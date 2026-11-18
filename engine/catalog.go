package engine

import (
	"bytes"
	"fmt"
	"html/template"
	"os"
	"path/filepath"
	"slices"
	"strings"
)

// WiMarkClasses are the classes of the engine widgets, one folder each in
// static/widgets/. Site widgets get the class of their top folder when it is
// one of these, "site" otherwise.
var WiMarkClasses = []string{"general", "markdown", "developer", "data"}

var wiMarkTitles = map[string]string{
	"general": "General", "markdown": "Markdown replacements", "developer": "Developer", "data": "Data", "site": "Site widgets",
}

// Class is the widget's WiMark class.
func (w Widget) Class() string {
	top, _, _ := strings.Cut(w.Folder(), "/")
	if slices.Contains(WiMarkClasses, top) {
		return top
	}
	if w.Site {
		return "site"
	}
	return "other"
}

// CatalogWidget and CatalogClass describe the catalog page to its script.
type CatalogWidget struct {
	Name  string `json:"name"`
	Class string `json:"class"`
	Path  string `json:"path"`
	Site  bool   `json:"site"`
}

type CatalogClass struct {
	Name    string          `json:"name"`
	Title   string          `json:"title"`
	Widgets []CatalogWidget `json:"widgets"`
}

type catalogTheme struct {
	Name  string `json:"name"`
	Class string `json:"class"`
}

// catalogContext is the data of templates/catalog.html.
type catalogContext struct {
	Site      Meta
	Lang      string
	Style     Style
	StyleVars template.CSS
	FontsURL  string
	Version   string
	Scripts   []string
	Data      struct {
		Theme   string         `json:"theme"`
		Themes  []catalogTheme `json:"themes"`
		Classes []CatalogClass `json:"classes"`
		Lang    string         `json:"lang"`
	}
}

// CatalogClasses groups the widgets by class, in class order.
func (s *Site) CatalogClasses() ([]CatalogClass, error) {
	ws, err := s.Widgets()
	if err != nil {
		return nil, err
	}
	var out []CatalogClass
	for _, class := range append(slices.Clone(WiMarkClasses), "site", "other") {
		c := CatalogClass{Name: class, Title: wiMarkTitles[class]}
		for _, w := range ws {
			if w.Class() == class {
				c.Widgets = append(c.Widgets, CatalogWidget{w.Name, class, w.Path, w.Site})
			}
		}
		if len(c.Widgets) > 0 {
			if c.Title == "" {
				c.Title = class
			}
			slices.SortFunc(c.Widgets, func(a, b CatalogWidget) int { return strings.Compare(a.Name, b.Name) })
			out = append(out, c)
		}
	}
	return out, nil
}

// Catalog renders the WiMark catalog: every widget, live, with an editor and
// a theme switch, in the site's fonts, sizes and theme. Links are relative to
// the folder holding static/. s may be nil (engine widgets, default look).
func (s *Site) Catalog() ([]byte, error) {
	if s == nil {
		s = &Site{Config: defaultConfig()}
		s.Config.normalize()
	}
	classes, err := s.CatalogClasses()
	if err != nil {
		return nil, err
	}
	tmpl, err := template.New("catalog.html").ParseFS(Assets, "templates/catalog.html")
	if err != nil {
		return nil, fmt.Errorf("cannot load catalog template: %w", err)
	}
	cfg := s.Config
	ctx := catalogContext{Site: cfg.Site, Lang: cfg.DefaultLang(), Style: cfg.Style,
		StyleVars: styleVars(cfg.Style), FontsURL: fontsURL(cfg.Style), Version: Version}
	ctx.Data.Theme, ctx.Data.Classes, ctx.Data.Lang = cfg.Site.Theme, classes, cfg.DefaultLang()
	for _, t := range Themes() {
		ctx.Data.Themes = append(ctx.Data.Themes, catalogTheme{t, ThemeClass(t)})
	}
	for _, c := range classes {
		for _, w := range c.Widgets {
			ctx.Scripts = append(ctx.Scripts, w.Path)
		}
	}
	var b bytes.Buffer
	err = tmpl.Execute(&b, ctx)
	return b.Bytes(), err
}

// WriteCatalog writes the catalog and its static files into dir.
func (s *Site) WriteCatalog(dir string) error {
	page, err := s.Catalog()
	if err != nil {
		return err
	}
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return err
	}
	if s == nil {
		s = &Site{}
	}
	if _, err := s.copyStatic(dir); err != nil {
		return err
	}
	return os.WriteFile(filepath.Join(dir, "index.html"), page, 0o644)
}
