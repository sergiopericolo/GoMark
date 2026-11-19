package engine

import (
	"errors"
	"fmt"
	"html/template"
	"io/fs"
	"os"
	"slices"
	"strings"

	"github.com/BurntSushi/toml"
)

// Layouts of one section, kept in sections/<id>.toml. A missing file means
// the defaults: columns, index on the right, widths from [style].
const (
	LayoutColumns = "columns" // folders · files · content · index
	LayoutPage    = "page"    // one HTML page (index.md), no columns

	indexRight = "right"
	indexLeft  = "left"
	indexNone  = "none"

	sectionDir = "sections"

	// Default percentages, used when [columns] sets at least one column.
	colFolders = 18
	colFiles   = 22
	colIndex   = 20
	colMax     = 90 // the three columns leave at least 10% for the content
)

// SectionLayout is the decoded sections/<id>.toml of one section.
type SectionLayout struct {
	Layout   string         // LayoutColumns | LayoutPage
	Index    string         // indexRight | indexLeft | indexNone
	Theme    string         // theme of this section only; "" = [site] theme
	Columns  Columns        // percentages; all zero = px widths of [style]
	Override map[string]any // [style] keys written in the file
	Style    Style          // resolved: [style] of gomark.toml + Override
}

// Columns are percentages of the section width. Folders count only in
// multi-level sections; the content column takes what is left.
type Columns struct {
	Folders int `toml:"folders"`
	Files   int `toml:"files"`
	Index   int `toml:"index"`
}

// sectionFile is the on-disk shape of sections/<id>.toml.
type sectionFile struct {
	Layout  string         `toml:"layout"`
	Index   string         `toml:"index"`
	Theme   string         `toml:"theme"`
	Columns Columns        `toml:"columns"`
	Style   map[string]any `toml:"style"`
}

func (s *Site) sectionFilePath(id string) string {
	return s.path(sectionDir, id+".toml")
}

// resolve fills the defaults and the resolved style from the global [style].
func (l *SectionLayout) resolve(global Style) error {
	if l.Layout == "" {
		l.Layout = LayoutColumns
	}
	if l.Index == "" {
		l.Index = indexRight
	}
	st := global
	if len(l.Override) > 0 {
		b, err := toml.Marshal(map[string]any{"style": l.Override})
		if err != nil {
			return err
		}
		wrap := struct {
			Style Style `toml:"style"`
		}{st}
		if _, err := toml.Decode(string(b), &wrap); err != nil {
			return err
		}
		st = wrap.Style
	}
	st.normalize()
	l.Style = st
	return nil
}

// validate checks the values a user can write in sections/<id>.toml.
func (l SectionLayout) validate(id string) error {
	file := "sections/" + id + ".toml"
	if !slices.Contains([]string{LayoutColumns, LayoutPage}, l.Layout) {
		return fmt.Errorf("%s: layout must be \"columns\" or \"page\"", file)
	}
	if !slices.Contains([]string{indexRight, indexLeft, indexNone}, l.Index) {
		return fmt.Errorf("%s: index must be \"right\", \"left\" or \"none\"", file)
	}
	if l.Theme != "" && !slices.Contains(Themes(), l.Theme) {
		return fmt.Errorf("%s: theme %q not found (available: %s)", file, l.Theme, strings.Join(Themes(), ", "))
	}
	c := l.Columns
	for name, v := range map[string]int{"folders": c.Folders, "files": c.Files, "index": c.Index} {
		if v < 0 || v > colMax {
			return fmt.Errorf("%s: columns.%s must be a percentage from 1 to %d (or left out)", file, name, colMax)
		}
	}
	if c != (Columns{}) {
		used := orDefault(c.Folders, colFolders) + orDefault(c.Files, colFiles)
		if l.Index != indexNone {
			used += orDefault(c.Index, colIndex)
		}
		if used > colMax {
			return fmt.Errorf("%s: columns add up to %d%%; leave at least %d%% for the content", file, used, 100-colMax)
		}
	}
	return nil
}

func orDefault(v, def int) int {
	if v == 0 {
		return def
	}
	return v
}

// loadLayouts reads sections/<id>.toml for every section; a missing file
// keeps the defaults.
func (s *Site) loadLayouts() error {
	for i := range s.Config.Sections {
		sec := &s.Config.Sections[i]
		if !slugRe.MatchString(sec.ID) {
			continue // validate reports bad ids
		}
		var f sectionFile
		_, err := toml.DecodeFile(s.sectionFilePath(sec.ID), &f)
		if err != nil && !errors.Is(err, fs.ErrNotExist) {
			return fmt.Errorf("invalid sections/%s.toml: %w", sec.ID, err)
		}
		sec.Layout = SectionLayout{Layout: f.Layout, Index: f.Index, Theme: f.Theme, Columns: f.Columns, Override: f.Style}
		if err := sec.Layout.resolve(s.Config.Style); err != nil {
			return fmt.Errorf("invalid sections/%s.toml: %w", sec.ID, err)
		}
	}
	return nil
}

// saveLayout writes sections/<id>.toml. Comments are generated; [style]
// overrides are kept as they are.
func (s *Site) saveLayout(sec Section) error {
	l := sec.Layout
	var b strings.Builder
	fmt.Fprintf(&b, "# GoMark — layout of section %q. Applies to this section only.\n", sec.ID)
	b.WriteString("# Values left out come from gomark.toml.\n\n")
	fmt.Fprintf(&b, "layout = %s  # \"columns\" | \"page\" (one HTML page, no columns)\n", quote(l.Layout))
	fmt.Fprintf(&b, "index  = %s  # \"right\" | \"left\" | \"none\" (the \"On this page\" column)\n", quote(l.Index))
	fmt.Fprintf(&b, "theme  = %s  # this section only; \"\" = the site theme (gomark theme lists them)\n\n", quote(l.Theme))
	b.WriteString("# Percent of the width. Leave all three out to use the px widths of [style].\n")
	b.WriteString("# The content column takes the rest.\n")
	b.WriteString("[columns]\n")
	column := func(key string, v, def int) {
		if v == 0 {
			fmt.Fprintf(&b, "# %s = %d\n", key, def)
			return
		}
		fmt.Fprintf(&b, "%s = %d\n", key, v)
	}
	column("folders", l.Columns.Folders, colFolders)
	column("files", l.Columns.Files, colFiles)
	column("index", l.Columns.Index, colIndex)
	if len(l.Override) > 0 {
		b.WriteString("\n")
		if err := toml.NewEncoder(&b).Encode(map[string]any{"style": l.Override}); err != nil {
			return err
		}
	} else {
		b.WriteString("\n# [style]  # optional, overrides gomark.toml, e.g. body_font = \"sans\"\n")
	}
	if err := os.MkdirAll(s.path(sectionDir), 0o755); err != nil {
		return err
	}
	return os.WriteFile(s.sectionFilePath(sec.ID), []byte(b.String()), 0o644)
}

// tracks is body's grid-template-columns, in DOM order: folders, files,
// content, index. The index comes first when it sits on the left.
func (sec Section) tracks(mode, index string) string {
	if mode == "home" || mode == "page" {
		return "minmax(0, 1fr)"
	}
	multi := mode == "multi"
	c := sec.Layout.Columns
	var folders, files, idx string
	var content string
	if c == (Columns{}) {
		st := sec.Layout.Style
		if multi {
			folders = fmt.Sprintf("%dpx", st.FoldersWidth)
		}
		files = fmt.Sprintf("%dpx", st.SidebarWidth)
		content = "minmax(0, 1fr)"
		idx = fmt.Sprintf("%dpx", st.TocWidth)
	} else {
		fr := func(v int) string { return fmt.Sprintf("minmax(0, %dfr)", v) }
		f, fi, ix := orDefault(c.Folders, colFolders), orDefault(c.Files, colFiles), orDefault(c.Index, colIndex)
		if !multi {
			f = 0
		}
		if index == indexNone {
			ix = 0
		}
		if multi {
			folders = fr(f)
		}
		files = fr(fi)
		content = fr(100 - f - fi - ix)
		idx = fr(ix)
	}
	if index == indexNone {
		idx = ""
	}
	cols := []string{folders, files, content, idx}
	if index == indexLeft && idx != "" {
		cols = []string{idx, folders, files, content}
	}
	var out []string
	for _, col := range cols {
		if col != "" {
			out = append(out, col)
		}
	}
	return strings.Join(out, " ")
}

// section applies the section's own layout and style to the context.
func (c *Context) section(sec *Section, mode string) {
	c.Style = sec.Layout.Style
	if sec.Layout.Theme != "" {
		c.Site.Theme = sec.Layout.Theme
	}
	c.StyleVars = styleVars(c.Style)
	c.FontsURL = fontsURL(c.Style)
	c.Index = sec.Layout.Index
	if !c.Nav.ShowToC || mode == "page" {
		c.Index = indexNone
	}
	// Medium screens hide the index column, so they get the tracks without it.
	c.Grid = template.CSS(fmt.Sprintf("--grid: %s; --grid-medium: %s",
		sec.tracks(mode, c.Index), sec.tracks(mode, indexNone)))
}

// removeLayout deletes sections/<id>.toml if it exists.
func (s *Site) removeLayout(id string) error {
	err := os.Remove(s.sectionFilePath(id))
	if errors.Is(err, fs.ErrNotExist) {
		return nil
	}
	return err
}
