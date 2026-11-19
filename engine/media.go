package engine

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io/fs"
	"os"
	"path"
	"path/filepath"
	"regexp"
	"strings"
)

// Site images live in <site>/media/ and are copied to <out>/media/. The image
// and gallery WiMarks are processed at build: every site image they name is
// resized, re-encoded and optionally mapped to a theme palette into
// <out>/media/_wm/, and the block is rewritten to point at the result.
const (
	mediaDir      = "media"
	mediaOut      = "media/_wm"
	cacheDir      = ".gomark/cache"
	maxImageBytes = 40 << 20
)

var imageFenceRe = regexp.MustCompile("(?ms)^```wimark-(image|gallery)([^\\n]*)\\n(.*?)^```[ \\t]*$")

// processImages rewrites the image and gallery WiMarks of one page. theme is
// the page's theme ("palette": true). Problems are returned as warnings: the
// block is then left as it is.
func (r *builder) processImages(src []byte, theme, page string) ([]byte, []string) {
	var warns []string
	out := imageFenceRe.ReplaceAllFunc(src, func(block []byte) []byte {
		m := imageFenceRe.FindSubmatch(block)
		kind := string(m[1])
		v, err := wimarkValues(string(m[2]), string(m[3]))
		if err != nil {
			warns = append(warns, fmt.Sprintf("%s: wimark-%s: %v", page, kind, err))
			return block
		}
		if len(v) == 0 {
			return block // empty block: the widget's example
		}
		opts := imageOptions(v, kind, theme)
		var items []map[string]any
		if kind == "image" {
			items = []map[string]any{v}
		} else {
			list, _ := v["items"].([]any)
			for i, x := range list {
				// a gallery item is "src", ["src", "caption"] or { "src": … }
				it, ok := x.(map[string]any)
				switch t := x.(type) {
				case string:
					it, ok = map[string]any{"src": t}, true
				case []any:
					if len(t) > 0 {
						it, ok = map[string]any{"src": t[0]}, true
						if len(t) > 1 {
							it["caption"] = t[1]
						}
					}
				}
				if ok {
					list[i] = it
					items = append(items, it)
				}
			}
		}
		changed := false
		for _, it := range items {
			s, _ := it["src"].(string)
			if s == "" || strings.Contains(s, "://") || strings.HasPrefix(s, "data:") || strings.HasPrefix(s, "static/") {
				continue // remote, inline or engine images are left alone
			}
			res, w, h, err := r.processImage(s, opts)
			if err != nil {
				warns = append(warns, fmt.Sprintf("%s: wimark-%s: %v", page, kind, err))
				continue
			}
			it["original"], it["src"], it["w"], it["h"] = s, res, w, h
			changed = true
		}
		if !changed {
			return block
		}
		js, _ := json.Marshal(v)
		return []byte("```wimark-" + kind + " " + string(js) + "\n```")
	})
	return out, warns
}

// wimarkValues merges the options of a WiMark fence line with its JSON body,
// as static/widgets.js does: an object body adds its keys, an array body
// becomes "items".
func wimarkValues(opts, body string) (map[string]any, error) {
	v := map[string]any{}
	if opts = strings.TrimSpace(opts); opts != "" {
		if err := json.Unmarshal([]byte(opts), &v); err != nil {
			return nil, fmt.Errorf("options: invalid JSON: %w", err)
		}
	}
	if body = strings.TrimSpace(body); body != "" {
		var b any
		if err := json.Unmarshal([]byte(body), &b); err != nil {
			return nil, fmt.Errorf("invalid JSON: %w", err)
		}
		switch t := b.(type) {
		case map[string]any:
			for k, x := range t {
				v[k] = x
			}
		case []any:
			v["items"] = t
		default:
			v["value"] = t
		}
	}
	return v, nil
}

// imageOptions reads max_width, quality, format, palette and dither.
func imageOptions(v map[string]any, kind, theme string) ImageOptions {
	o := ImageOptions{MaxWidth: 1600, Quality: 82}
	if kind == "gallery" {
		o.MaxWidth = 900
	}
	if n, ok := v["max_width"].(float64); ok && n > 0 {
		o.MaxWidth = int(n)
	}
	if n, ok := v["quality"].(float64); ok && n > 0 {
		o.Quality = int(n)
	}
	o.Format, _ = v["format"].(string)
	if d, ok := v["dither"].(bool); ok {
		o.NoDither = !d
	}
	switch p := v["palette"].(type) {
	case bool:
		if p {
			o.Palette = theme
		}
	case string:
		o.Palette = p
	}
	return o
}

// processImage encodes one site image (site-relative src) and records it for
// the output; it returns the output path and size. Results are cached in
// <site>/.gomark/cache by content, options and encoder version.
func (r *builder) processImage(src string, o ImageOptions) (string, int, int, error) {
	rel := cleanRel(src)
	if rel == "" {
		return "", 0, 0, fmt.Errorf("%q must be a path inside the site", src)
	}
	full := r.site.path(filepath.FromSlash(rel))
	info, err := os.Stat(full)
	if err != nil || !info.Mode().IsRegular() {
		return "", 0, 0, fmt.Errorf("image %s not found", rel)
	}
	if info.Size() > maxImageBytes {
		return "", 0, 0, fmt.Errorf("image %s is larger than %d MB", rel, maxImageBytes>>20)
	}
	raw, err := os.ReadFile(full)
	if err != nil {
		return "", 0, 0, err
	}
	sum := sha256.New()
	sum.Write(raw)
	fmt.Fprintf(sum, "|v%d|%d|%d|%s|%s|%t", encoderVersion, o.MaxWidth, o.Quality, o.Format, o.Palette, o.NoDither)
	if o.Palette != "" {
		pal, err := ThemePalette(o.Palette)
		if err != nil {
			return "", 0, 0, err
		}
		fmt.Fprint(sum, pal) // a changed theme is a new image
	}
	stem := strings.TrimSuffix(path.Base(rel), path.Ext(rel)) + "-" + hex.EncodeToString(sum.Sum(nil))[:12]
	var name string
	var b []byte
	for _, ext := range []string{".png", ".jpg"} {
		if c, err := os.ReadFile(r.site.path(cacheDir, stem+ext)); err == nil {
			name, b = stem+ext, c
			break
		}
	}
	if b == nil {
		var ext string
		if b, ext, _, err = EncodeImage(raw, o); err != nil {
			return "", 0, 0, fmt.Errorf("%s: %w", rel, err)
		}
		name = stem + ext
		cache := r.site.path(cacheDir, name)
		if os.MkdirAll(filepath.Dir(cache), 0o755) == nil {
			_ = os.WriteFile(cache, b, 0o644) // the cache is best effort
		}
	}
	w, h := imageSize(b)
	out := mediaOut + "/" + name
	r.media[out] = b
	return out, w, h, nil
}

// copyMedia writes <site>/media/ and the processed images into out.
func (r *builder) copyMedia(out string) (int, error) {
	n := 0
	dir := r.site.path(mediaDir)
	if exists(dir) {
		err := filepath.WalkDir(dir, func(p string, d fs.DirEntry, err error) error {
			if err != nil || d.IsDir() {
				return err
			}
			rel, _ := filepath.Rel(r.site.Dir, p)
			b, err := os.ReadFile(p)
			if err == nil {
				err = writeFile(filepath.Join(out, rel), b)
				n++
			}
			return err
		})
		if err != nil {
			return n, err
		}
	}
	for rel, b := range r.media {
		if err := writeFile(filepath.Join(out, filepath.FromSlash(rel)), b); err != nil {
			return n, err
		}
		n++
	}
	return n, nil
}

func writeFile(p string, b []byte) error {
	if err := os.MkdirAll(filepath.Dir(p), 0o755); err != nil {
		return err
	}
	return os.WriteFile(p, b, 0o644)
}
