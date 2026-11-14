package engine

import (
	"fmt"
	"os"
	"os/exec"
	"path"
	"path/filepath"
	"slices"
	"strings"
)

// NewPage creates <lang>/<section>/<rel> with an h1 title.
func (s *Site) NewPage(lang, sectionID, rel, title string) (string, error) {
	out, full, err := s.target(lang, sectionID, rel, false)
	if err != nil {
		return "", err
	}
	if title == "" {
		title = strings.TrimSuffix(base(out), path.Ext(out))
	}
	if err := os.MkdirAll(filepath.Dir(full), 0o755); err != nil {
		return "", err
	}
	return out, os.WriteFile(full, []byte("# "+title+"\n\n"), 0o644)
}

// NewFolder creates <lang>/<section>/<rel>.
func (s *Site) NewFolder(lang, sectionID, rel string) (string, error) {
	out, full, err := s.target(lang, sectionID, rel, true)
	if err != nil {
		return "", err
	}
	return out, os.MkdirAll(full, 0o755)
}

// target validates and resolves a new path.
func (s *Site) target(lang, sectionID, rel string, dir bool) (out, full string, err error) {
	if lang, err = s.Lang(lang); err != nil {
		return "", "", err
	}
	sec := s.Config.Section(sectionID)
	if sec == nil {
		return "", "", fmt.Errorf("section %q is not defined in %s", sectionID, ConfigFile)
	}
	if rel = cleanRel(rel); rel == "" || dir == isMarkdown(rel) {
		want := ".md path (e.g. systems/idea.md)"
		if dir {
			want = "folder path (e.g. systems)"
		}
		return "", "", fmt.Errorf("path must be a relative %s", want)
	}
	if err := s.fits(*sec, rel, dir); err != nil {
		return "", "", err
	}
	out = lang + "/" + sec.ID + "/" + rel
	if full = s.path(filepath.FromSlash(out)); exists(full) {
		return "", "", fmt.Errorf("%s already exists", out)
	}
	return out, full, nil
}

// Delete removes "<section>/<path>" in lang only.
func (s *Site) Delete(lang, target string) error {
	lang, err := s.Lang(lang)
	if err != nil {
		return err
	}
	if target = cleanRel(target); !strings.Contains(target, "/") {
		return fmt.Errorf("cannot delete a section root; use 'section remove'")
	}
	full := s.path(lang, filepath.FromSlash(target))
	if !exists(full) {
		return fmt.Errorf("not found: %s/%s", lang, target)
	}
	return os.RemoveAll(full)
}

// Move moves "<section>/<path>" in lang; translations follow unless their
// destination exists (returned in kept).
func (s *Site) Move(lang, src, dst string) (moved, kept []string, err error) {
	if lang, err = s.Lang(lang); err != nil {
		return nil, nil, err
	}
	if src, dst = cleanRel(src), cleanRel(dst); src == "" || dst == "" {
		return nil, nil, fmt.Errorf("src and dst must be relative paths inside the site")
	}
	if !strings.Contains(src, "/") {
		return nil, nil, fmt.Errorf("cannot move a section root; use 'section add' to manage sections")
	}
	from := s.path(lang, filepath.FromSlash(src))
	info, err := os.Stat(from)
	if err != nil {
		return nil, nil, fmt.Errorf("source not found: %s", src)
	}
	for _, p := range []string{src, dst} {
		if id, _, _ := strings.Cut(p, "/"); s.Config.Section(id) == nil {
			return nil, nil, fmt.Errorf("section %q is not defined in %s", id, ConfigFile)
		}
	}
	id, rel, _ := strings.Cut(dst, "/")
	if err := s.fits(*s.Config.Section(id), rel, info.IsDir()); err != nil {
		return nil, nil, err
	}
	if exists(s.path(lang, filepath.FromSlash(dst))) {
		return nil, nil, fmt.Errorf("destination already exists: %s", dst)
	}

	langs := append([]string{lang}, slices.DeleteFunc(s.Config.LangCodes(), func(l string) bool { return l == lang })...)
	for _, l := range langs {
		from, to := s.path(l, filepath.FromSlash(src)), s.path(l, filepath.FromSlash(dst))
		if l != lang && !exists(from) {
			continue
		}
		if l != lang && exists(to) {
			kept = append(kept, l+"/"+dst)
			continue
		}
		if err := os.MkdirAll(filepath.Dir(to), 0o755); err != nil {
			return moved, kept, err
		}
		if err := os.Rename(from, to); err != nil {
			return moved, kept, fmt.Errorf("cannot move %s/%s: %w", l, src, err)
		}
		moved = append(moved, fmt.Sprintf("%s/%s → %s/%s", l, src, l, dst))
	}
	return moved, kept, nil
}

// fits applies the depth rule to a new path.
func (s *Site) fits(sec Section, rel string, dir bool) error {
	if rel == "" || keep(sec, strings.Count(rel, "/")+1, dir) {
		return nil
	}
	return fmt.Errorf("%s/%s is beyond max_depth=%d of section %q", sec.ID, rel, sec.MaxDepth, sec.ID)
}

// AddSection adds a section and its folder in every language.
func (s *Site) AddSection(id, title string, depth int) error {
	switch {
	case !slugRe.MatchString(id):
		return fmt.Errorf("id must be a lowercase slug [a-z0-9_-] (got %q)", id)
	case depth < 1:
		return fmt.Errorf("depth must be >= 1")
	case s.Config.Section(id) != nil:
		return fmt.Errorf("section %q already exists", id)
	}
	s.Config.Sections = append(s.Config.Sections, Section{ID: id, Titles: Text{anyLang: title}, MaxDepth: depth})
	if err := s.Save(); err != nil {
		return err
	}
	for _, l := range s.Config.LangCodes() {
		if err := os.MkdirAll(s.path(l, id), 0o755); err != nil {
			return err
		}
	}
	return nil
}

// RemoveSection drops a section; deleteDirs also removes its folders.
func (s *Site) RemoveSection(id string, deleteDirs bool) error {
	i := slices.IndexFunc(s.Config.Sections, func(sec Section) bool { return sec.ID == id })
	if i < 0 {
		return fmt.Errorf("section %q not found", id)
	}
	s.Config.Sections = slices.Delete(s.Config.Sections, i, i+1)
	if err := s.Save(); err != nil {
		return err
	}
	for _, l := range s.Config.LangCodes() {
		if deleteDirs {
			if err := os.RemoveAll(s.path(l, id)); err != nil {
				return err
			}
		}
	}
	return nil
}

// AddLanguage adds a language and its section folders.
func (s *Site) AddLanguage(code, label string) error {
	code = strings.ToLower(strings.TrimSpace(code))
	if slices.Contains(s.Config.LangCodes(), code) {
		return fmt.Errorf("language %q already exists", code)
	}
	s.Config.Languages = append(s.Config.Languages, Language{Code: code, Label: label})
	if err := s.Config.validate(); err != nil {
		s.Config.Languages = s.Config.Languages[:len(s.Config.Languages)-1]
		return err
	}
	if err := s.Save(); err != nil {
		return err
	}
	for _, sec := range s.Config.Sections {
		if err := os.MkdirAll(s.path(code, sec.ID), 0o755); err != nil {
			return err
		}
	}
	return nil
}

// RemoveLanguage drops a language; its folder is kept.
func (s *Site) RemoveLanguage(code string) error {
	i := slices.IndexFunc(s.Config.Languages, func(l Language) bool { return l.Code == code })
	switch {
	case i < 0:
		return fmt.Errorf("language %q not found", code)
	case len(s.Config.Languages) == 1:
		return fmt.Errorf("cannot remove the only language")
	}
	s.Config.Languages = slices.Delete(s.Config.Languages, i, i+1)
	return s.Save()
}

// SetTheme sets [site] theme.
func (s *Site) SetTheme(name string) error {
	if !slices.Contains(Themes(), name) {
		return fmt.Errorf("theme %q not found (available: %s)", name, strings.Join(Themes(), ", "))
	}
	s.Config.Site.Theme = name
	return s.Save()
}

// Publish commits and pushes dir, a git repository.
func Publish(dir, message string) (string, error) {
	if !exists(dir) {
		return "", fmt.Errorf("%s not found; run 'gomark build' first", dir)
	}
	git := func(args ...string) (string, error) {
		cmd := exec.Command("git", args...)
		cmd.Dir = dir
		b, err := cmd.CombinedOutput()
		out := strings.TrimSpace(string(b))
		if err != nil {
			err = fmt.Errorf("git %s: %w\n%s", args[0], err, out)
		}
		return out, err
	}
	if _, err := git("add", "-A"); err != nil {
		return "", err
	}
	// git status, not git's localized messages.
	if changes, err := git("status", "--porcelain"); err != nil || changes == "" {
		return "nothing to commit — the output is already up to date", err
	}
	if _, err := git("commit", "-m", message); err != nil {
		return "", err
	}
	out, err := git("push")
	return "published: " + out, err
}
