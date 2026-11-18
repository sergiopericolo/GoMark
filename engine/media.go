package engine

import (
	"bytes"
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

var imageFenceRe = regexp.MustCompile("(?ms)^```widget-(image|gallery)[ \\t]*\\n(.*?)\\n```[ \\t]*$")

// imageJob is one processed image of a build.
type imageJob struct {
	src, out string
	opts     ImageOptions
}

// processImages rewrites the image and gallery blocks of one page. theme is
// the page's theme (palette: true). Problems are returned as warnings: the
// block is then left as it is.
func (r *builder) processImages(src []byte, theme, page string) ([]byte, []string) {
	var warns []string
	out := imageFenceRe.ReplaceAllFunc(src, func(block []byte) []byte {
		m := imageFenceRe.FindSubmatch(block)
		kind, body := string(m[1]), bytes.TrimSpace(m[2])
		if len(body) == 0 {
			return block // empty block: the widget's example
		}
		var payload map[string]any
		if err := json.Unmarshal(body, &payload); err != nil {
			warns = append(warns, fmt.Sprintf("%s: widget-%s: invalid JSON: %v", page, kind, err))
			return block
		}
		cfg, _ := payload["config"].(map[string]any)
		opts := imageOptions(cfg, kind, theme)
		var items []map[string]any
		switch d := payload["data"].(type) {
		case map[string]any:
			items = []map[string]any{d}
		case []any:
			for _, x := range d {
				if m, ok := x.(map[string]any); ok {
					items = append(items, m)
				}
			}
		}
		changed := false
		for _, it := range items {
			s, _ := it["src"].(string)
			if s == "" || strings.Contains(s, "://") || strings.HasPrefix(s, "data:") || strings.HasPrefix(s, "static/") {
				continue // remote, inline or engine images are left alone
			}
			res, w, h, err := r.processImage(s, opts, cfg)
			if err != nil {
				warns = append(warns, fmt.Sprintf("%s: widget-%s: %v", page, kind, err))
				continue
			}
			it["original"], it["src"], it["width"], it["height"] = s, res, w, h
			changed = true
		}
		if !changed {
			return block
		}
		js, _ := json.MarshalIndent(payload, "", "  ")
		return []byte("```widget-" + kind + "\n" + string(js) + "\n```")
	})
	return out, warns
}

// imageOptions reads max_width, quality and palette from a block's config.
func imageOptions(cfg map[string]any, kind, theme string) ImageOptions {
	o := ImageOptions{MaxWidth: 1600, Quality: 82}
	if kind == "gallery" {
		o.MaxWidth = 900
	}
	if v, ok := cfg["max_width"].(float64); ok && v > 0 {
		o.MaxWidth = int(v)
	}
	if v, ok := cfg["quality"].(float64); ok && v > 0 {
		o.Quality = int(v)
	}
	switch p := cfg["palette"].(type) {
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
// <site>/.gomark/cache by content and options.
func (r *builder) processImage(src string, o ImageOptions, cfg map[string]any) (string, int, int, error) {
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
	ext := strings.ToLower(path.Ext(rel))
	switch format, _ := cfg["format"].(string); {
	case o.Palette != "", format == "png", ext == ".gif":
		ext = ".png"
	case format == "jpeg", format == "jpg":
		ext = ".jpg"
	}
	sum := sha256.New()
	sum.Write(raw)
	fmt.Fprintf(sum, "|%d|%d|%s|%s", o.MaxWidth, o.Quality, o.Palette, ext)
	if o.Palette != "" {
		pal, err := ThemePalette(o.Palette)
		if err != nil {
			return "", 0, 0, err
		}
		fmt.Fprint(sum, pal) // a changed theme is a new image
	}
	hash := hex.EncodeToString(sum.Sum(nil))[:12]
	name := strings.TrimSuffix(path.Base(rel), path.Ext(rel)) + "-" + hash + ext
	cache := r.site.path(cacheDir, name)
	b, err := os.ReadFile(cache)
	var w, h int
	if err == nil {
		w, h = imageSize(b)
	} else {
		var st ImageStats
		if b, st, err = EncodeImage(raw, ext, o); err != nil {
			return "", 0, 0, fmt.Errorf("%s: %w", rel, err)
		}
		w, h = st.Width, st.Height
		if os.MkdirAll(filepath.Dir(cache), 0o755) == nil {
			_ = os.WriteFile(cache, b, 0o644) // the cache is best effort
		}
	}
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
