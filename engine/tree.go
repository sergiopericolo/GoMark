package engine

import (
	"io/fs"
	"path/filepath"
	"slices"
	"strings"
)

// Folder is a section directory: Files are page keys, Pages compiled pages.
type Folder struct {
	Name       string
	RelPath    string
	Depth      int
	SubFolders []*Folder
	Files      []string
	Pages      []*Page
}

// Tree is a section merged across languages, keyed by section-relative path.
type Tree struct {
	Section  Section
	Root     *Folder
	Keys     []string                     // logical pages, sorted
	Variants map[string]map[string]string // key → lang → site-relative source
	Skipped  []string                     // entries beyond max_depth, site-relative
}

// Entry is one tree item, in display order.
type Entry struct {
	Rel   string // section-relative path
	Depth int    // 1 = direct child of the section
	Dir   bool
}

// keep is the depth rule. Depth = path segments in the section (a/b.md = 2).
// Pages: depth <= max_depth. Folders: depth < max_depth.
func keep(sec Section, depth int, dir bool) bool {
	if dir {
		return depth < sec.MaxDepth
	}
	return depth <= sec.MaxDepth
}

// Scan merges <lang>/<section> of the given languages (all if none).
// Entries beyond max_depth go to Tree.Skipped.
func (s *Site) Scan(sec Section, langs ...string) (*Tree, error) {
	if len(langs) == 0 {
		langs = s.Config.LangCodes()
	}
	t := &Tree{Section: sec, Root: &Folder{Name: sec.Title}, Variants: map[string]map[string]string{}}
	folders := map[string]*Folder{"": t.Root}

	for _, lang := range langs {
		dir := s.path(lang, sec.ID)
		err := filepath.WalkDir(dir, func(p string, d fs.DirEntry, err error) error {
			if p == dir && err != nil && !exists(dir) {
				return filepath.SkipDir // this language has no such section
			}
			if err != nil || p == dir || !d.IsDir() && !isMarkdown(p) {
				return err
			}
			rel, _ := filepath.Rel(dir, p)
			rel = filepath.ToSlash(rel)
			depth := strings.Count(rel, "/") + 1
			up := folders[parent(rel)]
			switch {
			case !keep(sec, depth, d.IsDir()):
				t.Skipped = append(t.Skipped, lang+"/"+sec.ID+"/"+rel)
				if d.IsDir() {
					return filepath.SkipDir
				}
			case d.IsDir():
				if folders[rel] == nil {
					folders[rel] = &Folder{Name: d.Name(), RelPath: rel, Depth: depth}
					up.SubFolders = append(up.SubFolders, folders[rel])
				}
			default:
				if t.Variants[rel] == nil {
					t.Variants[rel] = map[string]string{}
					t.Keys = append(t.Keys, rel)
					up.Files = append(up.Files, rel)
				}
				t.Variants[rel][lang] = lang + "/" + sec.ID + "/" + rel
			}
			return nil
		})
		if err != nil {
			return nil, err
		}
	}

	slices.Sort(t.Keys)
	sortFolder(t.Root)
	return t, nil
}

// Folder finds a folder by path.
func (t *Tree) Folder(rel string) *Folder {
	var find func(f *Folder) *Folder
	find = func(f *Folder) *Folder {
		if f.RelPath == rel {
			return f
		}
		for _, sub := range f.SubFolders {
			if r := find(sub); r != nil {
				return r
			}
		}
		return nil
	}
	return find(t.Root)
}

// Entries flattens the tree depth-first, sorted by name.
func (t *Tree) Entries() []Entry {
	var out []Entry
	var walk func(f *Folder)
	walk = func(f *Folder) {
		kids := make([]Entry, 0, len(f.SubFolders)+len(f.Files))
		for _, sub := range f.SubFolders {
			kids = append(kids, Entry{sub.RelPath, sub.Depth, true})
		}
		for _, k := range f.Files {
			kids = append(kids, Entry{k, f.Depth + 1, false})
		}
		slices.SortFunc(kids, func(a, b Entry) int { return strings.Compare(base(a.Rel), base(b.Rel)) })
		for _, e := range kids {
			out = append(out, e)
			if e.Dir {
				walk(t.Folder(e.Rel))
			}
		}
	}
	walk(t.Root)
	return out
}

// pick chooses a page source: lang, else default, else any (fallback).
func (t *Tree) pick(key, lang, def string) (src, srcLang string, fallback bool) {
	v := t.Variants[key]
	if src, ok := v[lang]; ok {
		return src, lang, false
	}
	if src, ok := v[def]; ok {
		return src, def, true
	}
	l := sortedKeys(v)[0]
	return v[l], l, true
}

func sortFolder(f *Folder) {
	slices.SortFunc(f.SubFolders, func(a, b *Folder) int { return strings.Compare(a.RelPath, b.RelPath) })
	slices.Sort(f.Files)
	for _, sub := range f.SubFolders {
		sortFolder(sub)
	}
}
