package engine

import (
	"bytes"
	"cmp"
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path"
	"path/filepath"
	"regexp"
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

// Widget is a site widget script, named after its file. Folders are ignored.
type Widget struct {
	Name string // used by ```wimark-<name> fences
	Path string // in the output, relative to static/: widgets/<folders>/<name>.js

	fsys fs.FS
	file string
}

// Widgets lists <site>/widgets: the engine ships the runtime, not widgets.
// s may be nil (no widgets).
func (s *Site) Widgets() ([]Widget, error) {
	var out []Widget
	if s == nil || s.Dir == "" {
		return out, nil
	}
	fsys, root := os.DirFS(s.Dir), "widgets"
	seen := map[string]string{}
	err := fs.WalkDir(fsys, root, func(p string, d fs.DirEntry, err error) error {
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
		out = append(out, Widget{name, "widgets/" + strings.TrimPrefix(p, root+"/"), fsys, p})
		return nil
	})
	if err != nil {
		return nil, err
	}
	return out, nil
}

// WidgetSkillFile is where WriteWidgetSkill installs the Claude Code skill.
const WidgetSkillFile = ".claude/skills/gomark-widget/SKILL.md"

// WriteWidgetSkill installs the Claude Code skill for writing widgets in the
// site, from templates/widget-skill.md. force replaces an existing one.
func (s *Site) WriteWidgetSkill(force bool) (string, error) {
	b, err := fs.ReadFile(Assets, "templates/widget-skill.md")
	if err != nil {
		return "", err
	}
	full := s.path(filepath.FromSlash(WidgetSkillFile))
	if exists(full) && !force {
		return "", fmt.Errorf("%s already exists (use -force to replace it)", WidgetSkillFile)
	}
	if err := os.MkdirAll(filepath.Dir(full), 0o755); err != nil {
		return "", err
	}
	return WidgetSkillFile, os.WriteFile(full, b, 0o644)
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
 * NAME — describe what the WiMark shows.
 *   ` + "```" + `wimark-NAME {"label": "answer"}
 *   42
 *   ` + "```" + `
 *
 * Rules (checked by gomark ai and the engine tests): no colors or fonts in
 * JavaScript — give elements classes, use WiMark.series(i) for series and
 * 'wm-' + WiMark.state(s) for states; build nodes with WiMark.h / WiMark.svg,
 * never innerHTML. The theme decides the look.
 */
WiMark.register('NAME', {
  title: 'NAME',
  description: 'What the WiMark is for.',
  example: { opts: { label: 'answer' }, body: 42 },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    el.appendChild(h('div', 'wm-card wm-NAME', W.inline('**' + (v.label || 'NAME') + '**: ' + W.fmt(W.num(v.value)))));
  }
});
`

// Folder is the widget's folder ("" at the top level).
func (w Widget) Folder() string { return parent(strings.TrimPrefix(w.Path, "widgets/")) }

var textInputRe = regexp.MustCompile(`(?m)^\s*input:\s*'text'`)

// TextInput reports whether the WiMark reads its body as text, not JSON.
func (w Widget) TextInput() bool {
	b, _ := fs.ReadFile(w.fsys, w.file)
	return textInputRe.Match(b)
}

// Summary is the first line of the doc comment, after "name — ".
func (w Widget) Summary() string {
	first, _, _ := strings.Cut(w.Doc(), "\n")
	_, after, ok := strings.Cut(first, " — ")
	if !ok {
		return first
	}
	return after
}

// Source is the widget's script.
func (w Widget) Source() ([]byte, error) { return fs.ReadFile(w.fsys, w.file) }

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
		if "static/"+w.Path == p {
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
		files["static/"+w.Path], src["static/"+w.Path] = w.fsys, w.file
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

// syncDir makes dst a copy of src without emptying it first: changed files
// are overwritten in place, unchanged ones are left alone and entries src
// does not have are removed (except keepOut at the top). Deleting and
// recreating the whole output makes synced folders (iCloud, Dropbox) keep
// conflict copies ("it 2") and lock entries while they upload, so the next
// build failed; entries that stay locked are warnings, not errors.
func syncDir(src, dst string) (warnings []string, err error) {
	err = filepath.WalkDir(src, func(p string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		rel, _ := filepath.Rel(src, p)
		to := filepath.Join(dst, rel)
		info, statErr := os.Lstat(to)
		if d.IsDir() {
			if statErr == nil && !info.IsDir() {
				if err := removeAll(to); err != nil {
					return err
				}
			}
			return os.MkdirAll(to, 0o755)
		}
		b, err := os.ReadFile(p)
		if err != nil {
			return err
		}
		if statErr == nil && info.IsDir() {
			if err := removeAll(to); err != nil {
				return err
			}
		} else if old, err := os.ReadFile(to); err == nil && bytes.Equal(old, b) {
			return nil
		}
		return retry(func() error { return os.WriteFile(to, b, 0o644) })
	})
	if err != nil {
		return nil, err
	}
	return prune(src, dst, true), nil
}

// prune removes from dst what src does not have.
func prune(src, dst string, top bool) (warnings []string) {
	var entries []os.DirEntry
	err := retry(func() (err error) { entries, err = os.ReadDir(dst); return })
	if err != nil {
		return []string{fmt.Sprintf("cannot check %s for stale files: %v", dst, err)}
	}
	for _, e := range entries {
		if top && keepOut[e.Name()] {
			continue
		}
		from, to := filepath.Join(src, e.Name()), filepath.Join(dst, e.Name())
		info, err := os.Stat(from)
		switch {
		case err == nil && info.IsDir() && e.IsDir():
			warnings = append(warnings, prune(from, to, false)...)
		case err == nil:
		default:
			if err := removeAll(to); err != nil {
				warnings = append(warnings, fmt.Sprintf("cannot remove stale %s: %v", to, err))
			}
		}
	}
	return warnings
}

// removeAll removes p; a folder still locked by a sync client is moved
// aside under a hidden name first, which frees its name at once.
func removeAll(p string) error {
	err := retry(func() error { return os.RemoveAll(p) })
	if err == nil || !locked(err) {
		return err
	}
	aside := filepath.Join(filepath.Dir(p), fmt.Sprintf(".gomark-stale-%d", time.Now().UnixNano()))
	if os.Rename(p, aside) != nil {
		return err
	}
	return retry(func() error { return os.RemoveAll(aside) })
}

// retry runs fn again while a synced folder keeps the file briefly locked
// (EDEADLK / EBUSY).
func retry(fn func() error) error {
	for try := 1; ; try++ {
		err := fn()
		if err == nil || try == 6 || !locked(err) {
			return err
		}
		time.Sleep(time.Duration(100*try) * time.Millisecond)
	}
}

func locked(err error) bool { return errors.Is(err, syscall.EDEADLK) || errors.Is(err, syscall.EBUSY) }
