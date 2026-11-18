package engine

import (
	"cmp"
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path"
	"path/filepath"
	"strings"
	"syscall"
	"time"
)

// Assets holds templates/ and static/, set by the host binary.
var Assets fs.FS

// Themes lists the CSS themes in static/themes.
func Themes() []string {
	names, _ := fs.Glob(Assets, "static/themes/*.css")
	for i, n := range names {
		names[i] = strings.TrimSuffix(path.Base(n), ".css")
	}
	return names
}

// Widget is a widget script, named after its file. Folders are ignored.
type Widget struct {
	Name string // used by ```widget-<name> fences
	Path string // in the output, relative to static/: widgets/<folders>/<name>.js
	Site bool   // from <site>/widgets rather than the engine

	fsys fs.FS
	file string
}

// Widgets lists engine widgets and <site>/widgets; site wins on equal names.
// s may be nil.
func (s *Site) Widgets() ([]Widget, error) {
	byName := map[string]Widget{}
	var order []string
	add := func(fsys fs.FS, root string, site bool) error {
		seen := map[string]string{}
		return fs.WalkDir(fsys, root, func(p string, d fs.DirEntry, err error) error {
			if p == root && errors.Is(err, fs.ErrNotExist) {
				return fs.SkipAll
			}
			if err != nil || d.IsDir() || path.Ext(p) != ".js" {
				return err
			}
			name := strings.TrimSuffix(d.Name(), ".js")
			if seen[name] != "" {
				return fmt.Errorf("widget %q is defined twice: %s and %s", name, seen[name], p)
			}
			seen[name] = p
			if _, ok := byName[name]; !ok {
				order = append(order, name)
			}
			byName[name] = Widget{name, "widgets/" + strings.TrimPrefix(p, root+"/"), site, fsys, p}
			return nil
		})
	}
	if err := add(Assets, "static/widgets", false); err != nil {
		return nil, err
	}
	if s != nil && s.Dir != "" {
		if err := add(os.DirFS(s.Dir), "widgets", true); err != nil {
			return nil, err
		}
	}
	out := make([]Widget, len(order))
	for i, n := range order {
		out[i] = byName[n]
	}
	return out, nil
}

// NewWidget creates <site>/widgets/<rel>.js (e.g. charts/gauge) from a template.
func (s *Site) NewWidget(rel string) (string, error) {
	rel = strings.TrimSuffix(cleanRel(rel), ".js")
	name := base(rel)
	if rel == "" || !slugRe.MatchString(name) {
		return "", fmt.Errorf("widget name must be a lowercase slug, e.g. gauge or charts/gauge")
	}
	out := "widgets/" + rel + ".js"
	full := s.path(filepath.FromSlash(out))
	if exists(full) {
		return "", fmt.Errorf("%s already exists", out)
	}
	if err := os.MkdirAll(filepath.Dir(full), 0o755); err != nil {
		return "", err
	}
	return out, os.WriteFile(full, []byte(strings.ReplaceAll(widgetTemplate, "NAME", name)), 0o644)
}

const widgetTemplate = `/*
 * NAME — describe what the widget shows.
 * data:   { "value": 42 }
 * config: {}
 *
 * Rules (checked by gomark ai and the engine tests): no colors or fonts in
 * JavaScript — give elements classes, use WiMark.series(i) for series and
 * 'wm-' + WiMark.state(s) for states; build nodes with WiMark.h / WiMark.svg,
 * never innerHTML. The theme decides the look.
 */
WiMark.register('NAME', {
  title: 'NAME',
  description: 'What the widget is for.',
  example: { data: { value: 42 }, config: {} },
  mount: function (el, data, config) {
    var W = WiMark, h = W.h;
    el.appendChild(h('div', 'wm-card wm-NAME', W.inline('**NAME**: ' + W.fmt(W.num(data.value)))));
  }
});
`

// Folder is the widget's folder ("" at the top level).
func (w Widget) Folder() string { return parent(strings.TrimPrefix(w.Path, "widgets/")) }

// Doc is the widget's leading comment: description and payload.
func (w Widget) Doc() string {
	b, _ := fs.ReadFile(w.fsys, w.file)
	src := strings.TrimSpace(string(b))
	end := strings.Index(src, "*/")
	if !strings.HasPrefix(src, "/*") || end < 0 {
		return ""
	}
	var lines []string
	for _, l := range strings.Split(src[2:end], "\n") {
		if l = strings.TrimPrefix(strings.TrimSpace(l), "*"); !strings.Contains(l, "───") {
			lines = append(lines, strings.TrimPrefix(l, " "))
		}
	}
	return strings.TrimSpace(strings.Join(lines, "\n"))
}

// Asset reads "static/…": a site widget if one has that path, else the engine file.
func (s *Site) Asset(p string) ([]byte, error) {
	ws, _ := s.Widgets()
	for _, w := range ws {
		if w.Site && "static/"+w.Path == p {
			return fs.ReadFile(w.fsys, w.file)
		}
	}
	return fs.ReadFile(Assets, p)
}

// copyStatic writes static/ and the site widgets into <out>/static.
func (s *Site) copyStatic(out string) (int, error) {
	files := map[string]fs.FS{}
	fs.WalkDir(Assets, "static", func(p string, d fs.DirEntry, err error) error {
		if err == nil && !d.IsDir() {
			files[p] = Assets
		}
		return err
	})
	ws, err := s.Widgets()
	src := map[string]string{}
	for _, w := range ws {
		if w.Site {
			files["static/"+w.Path], src["static/"+w.Path] = w.fsys, w.file
		}
	}
	for p, fsys := range files {
		b, err := fs.ReadFile(fsys, cmp.Or(src[p], p))
		if err != nil {
			return 0, err
		}
		dst := filepath.Join(out, filepath.FromSlash(p))
		if err := os.MkdirAll(filepath.Dir(dst), 0o755); err != nil {
			return 0, err
		}
		if err := os.WriteFile(dst, b, 0o644); err != nil {
			return 0, err
		}
	}
	return len(files), err
}

// keepOut is never deleted from the output (its own git repository).
var keepOut = map[string]bool{".git": true, ".gitignore": true, "CNAME": true, ".nojekyll": true}

// cleanDir empties dir except keepOut, retrying files briefly locked by
// synced folders (EDEADLK / EBUSY).
func cleanDir(dir string) error {
	entries, err := os.ReadDir(dir)
	if os.IsNotExist(err) {
		return os.MkdirAll(dir, 0o755)
	}
	for _, e := range entries {
		if keepOut[e.Name()] {
			continue
		}
		for try := 1; ; try++ {
			err = os.RemoveAll(filepath.Join(dir, e.Name()))
			if err == nil || try == 6 || !errors.Is(err, syscall.EDEADLK) && !errors.Is(err, syscall.EBUSY) {
				break
			}
			time.Sleep(time.Duration(100*try) * time.Millisecond)
		}
		if err != nil {
			return err
		}
	}
	return err
}
