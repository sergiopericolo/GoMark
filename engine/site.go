// Package engine turns a folder of Markdown into a static site.
// It never prints or exits: every call returns a result or an error.
package engine

import (
	"bytes"
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"slices"
	"strings"

	"github.com/BurntSushi/toml"
)

const (
	Version    = "1.2.0"
	ConfigFile = "gomark.toml"
)

// Site is gomark.toml plus one content folder per language.
type Site struct {
	Dir      string
	Config   *Config
	Warnings []string // non-fatal issues found while loading
}

// Open reads and validates <dir>/gomark.toml.
func Open(dir string) (*Site, error) {
	cfg := defaultConfig()
	meta, err := toml.DecodeFile(filepath.Join(dir, ConfigFile), cfg)
	if errors.Is(err, fs.ErrNotExist) {
		return nil, fmt.Errorf("cannot find %s in %s (create a site with: gomark init <dir>)", ConfigFile, dir)
	}
	if err != nil {
		return nil, fmt.Errorf("invalid %s: %w", ConfigFile, err)
	}
	s := &Site{Dir: dir, Config: cfg}
	if u := meta.Undecoded(); len(u) > 0 {
		keys := make([]string, len(u))
		for i, k := range u {
			keys[i] = k.String()
		}
		s.Warnings = append(s.Warnings, fmt.Sprintf("%s: unknown keys ignored: %s", ConfigFile, strings.Join(keys, ", ")))
	}
	cfg.normalize()
	if err := s.loadLayouts(); err != nil {
		return nil, err
	}
	if err := cfg.validate(); err != nil {
		return nil, err
	}
	return s, nil
}

// Load is Open, or a default site (saved later) when there is no config.
func Load(dir string) (*Site, error) {
	if exists(filepath.Join(dir, ConfigFile)) {
		return Open(dir)
	}
	cfg := defaultConfig()
	cfg.normalize()
	return &Site{Dir: dir, Config: cfg}, nil
}

// Init writes gomark.toml in dir; force rewrites an existing one.
func Init(dir, title, out string, force bool) (*Site, error) {
	if exists(filepath.Join(dir, ConfigFile)) && !force {
		return nil, fmt.Errorf("%s already exists (use -force to rewrite it in the standard format)", filepath.Join(dir, ConfigFile))
	}
	s, err := Load(dir)
	if err != nil {
		return nil, err
	}
	if title != "" {
		s.Config.Site.Title = title
	}
	if out != "" {
		s.Config.Site.Out = relTo(dir, out)
	}
	return s, s.Save()
}

// Save writes gomark.toml in the standard format.
func (s *Site) Save() error {
	s.Config.normalize()
	var b bytes.Buffer
	if err := configTmpl.Execute(&b, s.Config); err != nil {
		return err
	}
	if err := os.MkdirAll(s.Dir, 0o755); err != nil {
		return err
	}
	return os.WriteFile(filepath.Join(s.Dir, ConfigFile), b.Bytes(), 0o644)
}

// Name is the site folder name.
func (s *Site) Name() string { return filepath.Base(filepath.Clean(s.Dir)) }

// Out is [site] out, resolved against the site folder.
func (s *Site) Out() string {
	if filepath.IsAbs(s.Config.Site.Out) {
		return s.Config.Site.Out
	}
	return filepath.Join(s.Dir, filepath.FromSlash(s.Config.Site.Out))
}

// Lang validates a code; "" is the default language.
func (s *Site) Lang(code string) (string, error) {
	if code == "" {
		return s.Config.DefaultLang(), nil
	}
	if !slices.Contains(s.Config.LangCodes(), code) {
		return "", fmt.Errorf("language %q is not declared in %s (available: %s)", code, ConfigFile, strings.Join(s.Config.LangCodes(), ", "))
	}
	return code, nil
}

// path joins site-relative segments.
func (s *Site) path(parts ...string) string {
	return filepath.Join(append([]string{s.Dir}, parts...)...)
}

// Find returns the nearest folder, upwards from dir, holding gomark.toml.
func Find(dir string) (string, error) {
	abs, err := filepath.Abs(dir)
	for ; err == nil; abs = filepath.Dir(abs) {
		if exists(filepath.Join(abs, ConfigFile)) {
			return abs, nil
		}
		if abs == filepath.Dir(abs) {
			return "", fmt.Errorf("no %s here or in any parent folder (create a site with: gomark init <dir>)", ConfigFile)
		}
	}
	return "", err
}

func exists(p string) bool {
	_, err := os.Stat(p)
	return err == nil
}

func sortedKeys[M ~map[string]V, V any](m M) []string {
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	slices.Sort(keys)
	return keys
}

// relTo is target relative to dir, when possible.
func relTo(dir, target string) string {
	a, err1 := filepath.Abs(dir)
	b, err2 := filepath.Abs(target)
	if r, err := filepath.Rel(a, b); err1 == nil && err2 == nil && err == nil {
		return filepath.ToSlash(r)
	}
	return target
}

// cleanRel cleans a relative path; "" if absolute or escaping.
func cleanRel(p string) string {
	if p == "" || filepath.IsAbs(p) {
		return ""
	}
	p = filepath.ToSlash(filepath.Clean(p))
	if p == "." || p == ".." || strings.HasPrefix(p, "../") {
		return ""
	}
	return p
}

// parent and base split a slash path.
func parent(rel string) string {
	if i := strings.LastIndex(rel, "/"); i >= 0 {
		return rel[:i]
	}
	return ""
}

func base(rel string) string { return rel[strings.LastIndex(rel, "/")+1:] }

func isMarkdown(name string) bool { return strings.HasSuffix(strings.ToLower(name), ".md") }

// relPrefix is "./" or "../" × depth.
func relPrefix(depth int) string {
	if depth <= 0 {
		return "./"
	}
	return strings.Repeat("../", depth)
}
