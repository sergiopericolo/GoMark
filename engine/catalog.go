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

// CatalogWidget describes one WiMark to the catalog script.
type CatalogWidget struct {
	Name string `json:"name"`
	Path string `json:"path"`
	Site bool   `json:"site"`
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
		Theme   string          `json:"theme"`
		Themes  []catalogTheme  `json:"themes"`
		Widgets []CatalogWidget `json:"widgets"`
		Lang    string          `json:"lang"`
	}
}

// CatalogWidgets lists every WiMark, engine and site, in one list by name.
func (s *Site) CatalogWidgets() ([]CatalogWidget, error) {
	ws, err := s.Widgets()
	if err != nil {
		return nil, err
	}
	out := make([]CatalogWidget, 0, len(ws))
	for _, w := range ws {
		out = append(out, CatalogWidget{w.Name, w.Path, w.Site})
	}
	slices.SortFunc(out, func(a, b CatalogWidget) int { return strings.Compare(a.Name, b.Name) })
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
	widgets, err := s.CatalogWidgets()
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
	ctx.Data.Theme, ctx.Data.Widgets, ctx.Data.Lang = cfg.Site.Theme, widgets, cfg.DefaultLang()
	for _, t := range Themes() {
		ctx.Data.Themes = append(ctx.Data.Themes, catalogTheme{t, ThemeClass(t)})
	}
	for _, w := range widgets {
		ctx.Scripts = append(ctx.Scripts, w.Path)
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
