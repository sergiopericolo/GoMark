package engine

import (
	"bytes"
	"cmp"
	"fmt"
	"html/template"
	"net/url"
	"os"
	"path"
	"path/filepath"
	"regexp"
	"strings"
)

// Page is a compiled Markdown page.
type Page struct {
	Title        string
	SectionID    string
	SectionTitle string
	RelPath      string // logical path inside the section, the same in every language
	SourcePath   string // file actually read, site-relative (e.g. en/about/cv.md)
	SourceLang   string
	Fallback     bool   // missing in the built language, copied from SourceLang
	URL          string // section-relative link
	Depth        int
	Body         template.HTML
	ToC          []*ToCItem
	Widgets      []string
}

// Context is the data passed to templates/layout.html.
type Context struct {
	Site          Meta
	Lang          string
	Style         Style
	Nav           Nav
	StyleVars     template.CSS
	FontsURL      string
	Sections      []Section
	ActiveSection *Section
	DepthMode     string       // "home" | "flat" | "multi" | "page"
	Index         string       // "On this page" column: "right" | "left" | "none"
	Switch        []LangLink   // language switch; empty in a single-language build
	Grid          template.CSS // body grid-template-columns of this page
	RootPrefix    string       // root of the output (sections and static/)
	SectionPrefix string       // root of the current section
	Folders       []*Folder
	CurrentFolder *Folder
	Pages         []*Page
	Page          *Page
	Scripts       []string // widget scripts the page uses, relative to static/
	Version       string

	strings map[string]string
}

// T returns the interface string for key.
func (c *Context) T(key string) string {
	if v, ok := c.strings[key]; ok {
		return v
	}
	return key
}

// builder compiles one language of a site.
type builder struct {
	site     *Site
	lang     string
	tmpl     *template.Template
	sections []Section
	strings  map[string]string
	widgets  map[string]string // widget name → script path
	media    map[string][]byte // processed images (output path → bytes); nil outside a build
	warnings []string
}

func (s *Site) builder(lang string) (*builder, error) {
	lang, err := s.Lang(lang)
	if err != nil {
		return nil, err
	}
	tmpl, err := template.New("layout.html").Funcs(funcs).ParseFS(Assets, "templates/layout.html")
	if err != nil {
		return nil, fmt.Errorf("cannot load template: %w", err)
	}
	ws, err := s.Widgets()
	if err != nil {
		return nil, err
	}
	r := &builder{site: s, lang: lang, tmpl: tmpl, sections: s.Config.SectionsFor(lang), strings: uiStrings(s.Config, lang), widgets: map[string]string{}}
	for _, w := range ws {
		r.widgets[w.Name] = w.Path
	}
	return r, nil
}

// context fills the shared fields; depth is from the output root.
func (r *builder) context(depth int) *Context {
	cfg := r.site.Config
	site := cfg.Site
	for _, l := range cfg.Languages {
		if l.Code == r.lang {
			site.Description = l.Description
		}
	}
	return &Context{
		Site: site, Lang: r.lang, Style: cfg.Style, Nav: cfg.Navigation,
		StyleVars: styleVars(cfg.Style), FontsURL: fontsURL(cfg.Style),
		Sections: r.sections, RootPrefix: relPrefix(depth), Version: Version, strings: r.strings,
		Index: indexNone, Grid: "--grid: minmax(0, 1fr); --grid-medium: minmax(0, 1fr)",
	}
}

// LangLink is one entry of the language switch.
type LangLink struct {
	Code, Label, Href string
	Current           bool
}

// indexPage is the section's index.md, the whole content of a page section.
// Without one, the page is empty.
func (r *builder) indexPage(t *Tree, sec Section) (*Page, error) {
	for _, p := range t.Root.Pages {
		if p.RelPath == "index.md" {
			return p, nil
		}
	}
	return &Page{Title: sec.Title, SectionID: sec.ID, SectionTitle: sec.Title, RelPath: "index.md",
		URL: "index.html"}, nil
}

// section scans sec and compiles its pages.
func (r *builder) section(sec Section) (t *Tree, pages []*Page, missing int, err error) {
	if t, err = r.site.Scan(sec); err != nil {
		return nil, nil, 0, err
	}
	for _, key := range t.Keys {
		src, srcLang, fallback := t.pick(key, r.lang, r.site.Config.DefaultLang())
		b, err := os.ReadFile(r.site.path(filepath.FromSlash(src)))
		if err != nil {
			return nil, nil, 0, fmt.Errorf("parse %s: %w", src, err)
		}
		if r.media != nil {
			theme := cmp.Or(sec.Layout.Theme, r.site.Config.Site.Theme)
			var warns []string
			b, warns = r.processImages(b, theme, src)
			r.warnings = append(r.warnings, warns...)
		}
		body, toc, title := renderMarkdown(b)
		noExt := strings.TrimSuffix(key, path.Ext(key))
		if title == "" {
			title = base(noExt)
		}
		p := &Page{
			Title: title, SectionID: sec.ID, SectionTitle: sec.Title, RelPath: key,
			SourcePath: src, SourceLang: srcLang, Fallback: fallback,
			URL: noExt + "/index.html", Depth: strings.Count(key, "/") + 1,
			Body: body, ToC: toc, Widgets: detectWidgets(b),
		}
		if fallback {
			missing++
		}
		f := t.Folder(parent(key))
		f.Pages = append(f.Pages, p)
		pages = append(pages, p)
	}
	return t, pages, missing, nil
}

func (r *builder) home() *Context {
	ctx := r.context(0)
	ctx.DepthMode = "home"
	return ctx
}

// in places a context inside a section, at folder depth.
func (r *builder) in(t *Tree, f *Folder, depth int) *Context {
	ctx := r.context(depth + 1)
	ctx.ActiveSection = &t.Section
	ctx.DepthMode = "multi"
	if t.Section.MaxDepth <= 1 {
		ctx.DepthMode = "flat"
	}
	ctx.SectionPrefix = relPrefix(depth)
	ctx.Folders = t.Root.SubFolders
	ctx.CurrentFolder = f
	ctx.Pages = f.Pages
	ctx.section(&t.Section, ctx.DepthMode)
	return ctx
}

func (r *builder) folder(t *Tree, f *Folder) *Context { return r.in(t, f, f.Depth) }

func (r *builder) page(t *Tree, p *Page) *Context {
	ctx := r.in(t, t.Folder(parent(p.RelPath)), p.Depth)
	ctx.Page = p
	r.scripts(ctx, p)
	return ctx
}

// sectionPage is a page section: one page at the section root, no columns.
func (r *builder) sectionPage(t *Tree, p *Page) *Context {
	ctx := r.in(t, t.Root, 0)
	ctx.DepthMode = "page"
	ctx.section(&t.Section, ctx.DepthMode)
	ctx.Page = p
	r.scripts(ctx, p)
	return ctx
}

// scripts adds the widget scripts the page uses.
func (r *builder) scripts(ctx *Context, p *Page) {
	for _, w := range p.Widgets {
		if s, ok := r.widgets[w]; ok {
			ctx.Scripts = append(ctx.Scripts, s)
		}
	}
}

func (r *builder) exec(ctx *Context) ([]byte, error) {
	var b bytes.Buffer
	err := r.tmpl.Execute(&b, ctx)
	return b.Bytes(), err
}

// ─── Public entry points ────────────────────────────────────────────────────

// Stats summarizes a build.
type Stats struct {
	Lang      string
	Out       string
	Sections  int
	Pages     int
	Missing   int // pages copied from another language
	HTMLFiles int
	Assets    int
	Skipped   []string // entries beyond max_depth
	Images    int      // files written to media/ (copied or processed)
	Warnings  []string // problems that did not stop the build
}

// Build compiles the site into out ("" = [site] out). A one-language site
// goes straight into out. With more languages, each one goes to out/<code>/
// with a language switch on every page (two languages: a toggle; more: a
// menu), and out/index.html opens the default language. Pages missing in a
// language are copied with a notice, so every page exists in every language.
// lang ("" = all) rebuilds one language only.
func (s *Site) Build(lang, out string) ([]*Stats, error) {
	if out == "" {
		out = s.Out()
	}
	langs := s.Config.LangCodes()
	if lang != "" {
		l, err := s.Lang(lang)
		if err != nil {
			return nil, err
		}
		langs = []string{l}
	}
	if len(s.Config.Languages) == 1 {
		st, err := s.build(langs[0], out, false)
		if err != nil {
			return nil, err
		}
		return []*Stats{st}, nil
	}
	if lang == "" {
		if err := cleanDir(out); err != nil {
			return nil, fmt.Errorf("cannot clean output dir: %w", err)
		}
	}
	var all []*Stats
	for _, l := range langs {
		st, err := s.build(l, filepath.Join(out, l), true)
		if err != nil {
			return all, err
		}
		all = append(all, st)
	}
	def := s.Config.DefaultLang() + "/index.html"
	root := fmt.Sprintf(`<!doctype html><meta charset="utf-8"><title>%s</title>`+
		`<meta http-equiv="refresh" content="0; url=%s"><a href="%s">%s</a>`+"\n",
		s.Config.Site.Title, def, def, def)
	return all, os.WriteFile(filepath.Join(out, "index.html"), []byte(root), 0o644)
}

// build compiles one language into out, emptied first; switches adds the
// language switch to every page.
func (s *Site) build(lang, out string, switches bool) (*Stats, error) {
	r, err := s.builder(lang)
	if err != nil {
		return nil, err
	}
	if out == "" {
		out = s.Out()
	}
	if err := cleanDir(out); err != nil {
		return nil, fmt.Errorf("cannot clean output dir: %w", err)
	}
	st := &Stats{Lang: r.lang, Out: out}
	r.media = map[string][]byte{}
	write := func(rel string, ctx *Context) error {
		if switches {
			ctx.Switch = r.switchTo(rel)
		}
		b, err := r.exec(ctx)
		if err != nil {
			return err
		}
		p := filepath.Join(out, filepath.FromSlash(rel))
		if err := os.MkdirAll(filepath.Dir(p), 0o755); err != nil {
			return err
		}
		st.HTMLFiles++
		return os.WriteFile(p, b, 0o644)
	}

	for _, sec := range r.sections {
		t, pages, missing, err := r.section(sec)
		switch {
		case err != nil:
		case sec.Layout.Layout == LayoutPage:
			var p *Page
			if p, err = r.indexPage(t, sec); err == nil {
				err = write(path.Join(sec.ID, "index.html"), r.sectionPage(t, p))
			}
		default:
			err = eachFolder(t.Root, func(f *Folder) error {
				return write(path.Join(sec.ID, f.RelPath, "index.html"), r.folder(t, f))
			})
			for i := 0; err == nil && i < len(pages); i++ {
				err = write(path.Join(sec.ID, pages[i].URL), r.page(t, pages[i]))
			}
		}
		if err != nil {
			return nil, fmt.Errorf("[%s] section %q: %w", r.lang, sec.ID, err)
		}
		st.Sections++
		st.Pages += len(pages)
		st.Missing += missing
		st.Skipped = append(st.Skipped, t.Skipped...)
	}
	if err := write("index.html", r.home()); err != nil {
		return nil, fmt.Errorf("[%s] home: %w", r.lang, err)
	}
	if st.Assets, err = s.copyStatic(out); err != nil {
		return nil, fmt.Errorf("static assets: %w", err)
	}
	if st.Images, err = r.copyMedia(out); err != nil {
		return nil, fmt.Errorf("media: %w", err)
	}
	st.Warnings = r.warnings
	return st, nil
}

// switchTo lists every language, with the same page (rel, from the language
// folder) as its link. The current language has no link.
func (r *builder) switchTo(rel string) []LangLink {
	depth := strings.Count(rel, "/") + 1
	var out []LangLink
	for _, l := range r.site.Config.Languages {
		link := LangLink{Code: l.Code, Label: l.Label, Current: l.Code == r.lang}
		if !link.Current {
			link.Href = strings.Repeat("../", depth) + l.Code + "/" + rel
		}
		out = append(out, link)
	}
	return out
}

// Render compiles one page in memory: "" (home), "<section>",
// "<section>/<folder>" or "<section>/<page>.md".
func (s *Site) Render(lang, target string) ([]byte, error) {
	r, err := s.builder(lang)
	if err != nil {
		return nil, err
	}
	target = cleanRel(target)
	if target == "" {
		return r.exec(r.home())
	}
	id, rel, _ := strings.Cut(target, "/")
	for _, sec := range r.sections {
		if sec.ID != id {
			continue
		}
		t, pages, _, err := r.section(sec)
		if err != nil {
			return nil, err
		}
		if sec.Layout.Layout == LayoutPage && rel == "" {
			p, err := r.indexPage(t, sec)
			if err != nil {
				return nil, err
			}
			return r.exec(r.sectionPage(t, p))
		}
		for _, p := range pages {
			if p.RelPath == rel {
				return r.exec(r.page(t, p))
			}
		}
		if f := t.Folder(rel); f != nil && !isMarkdown(rel) {
			return r.exec(r.folder(t, f))
		}
		return nil, fmt.Errorf("%s: not found", target)
	}
	return nil, fmt.Errorf("section %q is not defined in %s", id, ConfigFile)
}

// ─── Template support ───────────────────────────────────────────────────────

var funcs = template.FuncMap{
	"add":        func(a, b int) int { return a + b },
	"baseName":   base,
	"themeClass": ThemeClass,
	// dict passes several values to a recursive sub-template.
	"dict": func(kv ...any) map[string]any {
		m := map[string]any{}
		for i := 0; i+1 < len(kv); i += 2 {
			m[kv[i].(string)] = kv[i+1]
		}
		return m
	},
	// isOpen: is f the current folder or one of its ancestors?
	"isOpen": func(f, cur *Folder) bool {
		return f != nil && cur != nil && (cur.RelPath == f.RelPath || strings.HasPrefix(cur.RelPath, f.RelPath+"/"))
	},
}

var fontNameRe = regexp.MustCompile(`^[A-Za-z0-9 \-]+$`)

func safeFont(name, fallback string) string {
	if name = strings.TrimSpace(name); fontNameRe.MatchString(name) {
		return name
	}
	return fallback
}

// styleVars turns [style] into CSS variables.
func styleVars(s Style) template.CSS {
	body := "var(--mono)"
	if s.BodyFont == "sans" {
		body = "var(--sans)"
	}
	return template.CSS(fmt.Sprintf(`--mono:"%s", ui-monospace, "SF Mono", Menlo, Consolas, monospace;`+
		`--sans:"%s", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;`+
		`--font-body:%s;--font-size:%dpx;--content-width:%dpx;--sidebar-width:%dpx;`+
		`--folders-width:%dpx;--toc-width:%dpx;--radius:%dpx;--radius-sm:%dpx;`,
		safeFont(s.FontMono, "JetBrains Mono"), safeFont(s.FontSans, "IBM Plex Sans"), body,
		s.FontSize, s.ContentWidth, s.SidebarWidth, s.FoldersWidth, s.TocWidth, s.Radius, max(0, s.Radius-1)))
}

// fontsURL links the configured Google Fonts.
func fontsURL(s Style) string {
	family := func(name, weights string) string {
		return "family=" + strings.ReplaceAll(url.PathEscape(name), "%20", "+") + ":wght@" + weights
	}
	return "https://fonts.googleapis.com/css2?" + family(safeFont(s.FontMono, "JetBrains Mono"), "400;500;600;700;800") +
		"&" + family(safeFont(s.FontSans, "IBM Plex Sans"), "400;500;600;700") + "&display=swap"
}

func eachFolder(f *Folder, fn func(*Folder) error) error {
	for _, sub := range f.SubFolders {
		if err := eachFolder(sub, fn); err != nil {
			return err
		}
	}
	return fn(f)
}
