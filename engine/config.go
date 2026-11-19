package engine

import (
	"encoding/json"
	"fmt"
	"regexp"
	"slices"
	"strings"
	"text/template"
)

// Config is the root of gomark.toml.
type Config struct {
	Site       Meta                         `toml:"site"`
	Languages  []Language                   `toml:"languages"`
	Style      Style                        `toml:"style"`
	Navigation Nav                          `toml:"navigation"`
	AI         AIConfig                     `toml:"ai"`
	Strings    map[string]map[string]string `toml:"strings"`
	Sections   []Section                    `toml:"sections"`
}

// Meta is [site]. Description is localized and filled from [[languages]].
type Meta struct {
	Title       string `toml:"title"`
	Author      string `toml:"author"`
	Theme       string `toml:"theme"`
	Out         string `toml:"out"`        // output dir, relative to the site
	GoMarkURL   string `toml:"gomark_url"` // link on "GoMark" in the top bar; "" = no link
	Description string `toml:"-"`
}

// Language is one [[languages]] entry; the first one is the default.
type Language struct {
	Code        string `toml:"code"`
	Label       string `toml:"label"`
	Description string `toml:"description"`
}

// Style is [style]; it becomes CSS variables in every page.
type Style struct {
	FontMono     string `toml:"font_mono"`
	FontSans     string `toml:"font_sans"`
	BodyFont     string `toml:"body_font"`    // "mono" | "sans"
	HeadingFont  string `toml:"heading_font"` // "mono" | "sans"
	FontSize     int    `toml:"font_size"`
	ContentWidth int    `toml:"content_width"`
	SidebarWidth int    `toml:"sidebar_width"`
	FoldersWidth int    `toml:"folders_width"`
	TocWidth     int    `toml:"toc_width"`
	Radius       int    `toml:"radius"`
	CodeTheme    string `toml:"code_theme"` // "auto" | "light" | "dark"
}

// Nav is [navigation].
type Nav struct {
	FoldersOpen bool `toml:"folders_open"`
	ShowToC     bool `toml:"show_toc"`
	StatusBar   bool `toml:"status_bar"`
}

// AIConfig is [ai]. Secrets, endpoints and programs never come from the
// site: keys are ANTHROPIC_API_KEY, DEEPSEEK_API_KEY or OPENAI_API_KEY, the
// local command GOMARK_AI_COMMAND.
type AIConfig struct {
	Provider   string `toml:"provider"`     // "anthropic" | "deepseek" | "openai" | "command"
	Model      string `toml:"model"`        // model id for the API providers
	Effort     string `toml:"effort"`       // low | medium | high | xhigh | max
	MaxInputKB int    `toml:"max_input_kb"` // largest input file sent
}

// Section is a top-level folder of every language. Title is per build language.
type Section struct {
	ID       string        `toml:"id"`
	Titles   Text          `toml:"title"`
	MaxDepth int           `toml:"max_depth"`
	Title    string        `toml:"-"`
	Layout   SectionLayout `toml:"-"` // sections/<id>.toml, see section.go
}

// Text is a per-language string: "…" (all languages) or { it = "…", en = "…" }.
type Text map[string]string

const anyLang = "*"

func (t *Text) UnmarshalTOML(v any) error {
	out := Text{}
	switch val := v.(type) {
	case string:
		out[anyLang] = val
	case map[string]any:
		for k, raw := range val {
			s, ok := raw.(string)
			if !ok {
				return fmt.Errorf("title.%s must be a string", k)
			}
			out[k] = s
		}
	default:
		return fmt.Errorf("title must be a string or a table of languages")
	}
	*t = out
	return nil
}

// For returns the text in lang, else any variant.
func (t Text) For(lang, def string) string {
	for _, k := range []string{lang, anyLang, def} {
		if t[k] != "" {
			return t[k]
		}
	}
	for _, k := range sortedKeys(t) {
		if t[k] != "" {
			return t[k]
		}
	}
	return ""
}

func defaultConfig() *Config {
	return &Config{
		Site: Meta{Title: "Site", Theme: "light", Out: "dist"},
		Style: Style{
			FontMono: "JetBrains Mono", FontSans: "IBM Plex Sans", BodyFont: "sans", HeadingFont: "mono",
			FontSize: 14, ContentWidth: 780, SidebarWidth: 256, FoldersWidth: 224, TocWidth: 232,
			Radius: 0, CodeTheme: "auto",
		},
		Navigation: Nav{ShowToC: true, StatusBar: true},
		AI:         AIConfig{Provider: "anthropic", Model: "claude-opus-5-5", Effort: "high", MaxInputKB: 10240},
	}
}

// normalize fills defaults and clamps out-of-range values.
func (c *Config) normalize() {
	def := defaultConfig()
	or := func(v *string, d string) {
		if *v == "" {
			*v = d
		}
	}
	or(&c.Site.Title, def.Site.Title)
	or(&c.Site.Theme, def.Site.Theme)
	or(&c.Site.Out, def.Site.Out)
	or(&c.AI.Provider, def.AI.Provider)
	if c.AI.Provider == "deepseek" {
		or(&c.AI.Model, "deepseek-flash")
	}
	or(&c.AI.Model, def.AI.Model)
	or(&c.AI.Effort, def.AI.Effort)
	if c.AI.MaxInputKB <= 0 {
		c.AI.MaxInputKB = def.AI.MaxInputKB
	}
	if len(c.Languages) == 0 {
		c.Languages = []Language{{Code: "en", Label: "English"}}
	}
	for i := range c.Languages {
		l := &c.Languages[i]
		l.Code = strings.ToLower(strings.TrimSpace(l.Code))
		or(&l.Label, strings.ToUpper(l.Code))
	}

	c.Style.normalize()

	for i := range c.Sections {
		sec := &c.Sections[i]
		if sec.Titles == nil {
			sec.Titles = Text{}
		}
		if sec.Titles.For(c.DefaultLang(), c.DefaultLang()) == "" {
			sec.Titles[anyLang] = sec.ID
		}
		sec.Title = sec.Titles.For(c.DefaultLang(), c.DefaultLang())
		sec.MaxDepth = max(sec.MaxDepth, 1)
		// Overrides were checked when sections/<id>.toml was read.
		_ = sec.Layout.resolve(c.Style)
	}
}

// normalize fills defaults and clamps out-of-range values of [style].
func (s *Style) normalize() {
	def := defaultConfig().Style
	or := func(v *string, d string) {
		if *v == "" {
			*v = d
		}
	}
	or(&s.FontMono, def.FontMono)
	or(&s.FontSans, def.FontSans)
	if s.BodyFont != "sans" {
		s.BodyFont = "mono"
	}
	if s.HeadingFont != "sans" {
		s.HeadingFont = "mono"
	}
	clamp := func(v *int, lo, hi, d int) {
		if *v == 0 {
			*v = d
		}
		*v = min(max(*v, lo), hi)
	}
	clamp(&s.FontSize, 11, 22, def.FontSize)
	clamp(&s.ContentWidth, 480, 1400, def.ContentWidth)
	clamp(&s.SidebarWidth, 160, 480, def.SidebarWidth)
	clamp(&s.FoldersWidth, 140, 480, def.FoldersWidth)
	clamp(&s.TocWidth, 160, 420, def.TocWidth)
	if s.Radius < 0 || s.Radius > 24 {
		s.Radius = def.Radius
	}
	if s.CodeTheme != "light" && s.CodeTheme != "dark" {
		s.CodeTheme = "auto"
	}
}

var (
	langCodeRe = regexp.MustCompile(`^[a-z]{2}(-[a-z]{2})?$`)
	slugRe     = regexp.MustCompile(`^[a-z0-9][a-z0-9_-]*$`)
)

func (c *Config) validate() error {
	seen := map[string]bool{}
	for _, l := range c.Languages {
		if !langCodeRe.MatchString(l.Code) {
			return fmt.Errorf("language code %q is not valid (use e.g. \"it\", \"en\", \"pt-br\")", l.Code)
		}
		if seen[l.Code] {
			return fmt.Errorf("duplicate language %q", l.Code)
		}
		seen[l.Code] = true
	}
	for i, s := range c.Sections {
		switch {
		case s.ID == "":
			return fmt.Errorf("section #%d is missing id", i)
		case !slugRe.MatchString(s.ID):
			return fmt.Errorf("section id %q is not a valid slug [a-z0-9_-]", s.ID)
		case seen["#"+s.ID]:
			return fmt.Errorf("duplicate section id %q", s.ID)
		}
		seen["#"+s.ID] = true
		if err := s.Layout.validate(s.ID); err != nil {
			return err
		}
	}
	return nil
}

// DefaultLang is the first declared language.
func (c *Config) DefaultLang() string { return c.Languages[0].Code }

// LangCodes lists the language codes in declared order.
func (c *Config) LangCodes() []string {
	out := make([]string, len(c.Languages))
	for i, l := range c.Languages {
		out[i] = l.Code
	}
	return out
}

// Section returns the section with the given id, or nil.
func (c *Config) Section(id string) *Section {
	for i := range c.Sections {
		if c.Sections[i].ID == id {
			return &c.Sections[i]
		}
	}
	return nil
}

// SectionsFor returns a copy of the sections titled in lang.
func (c *Config) SectionsFor(lang string) []Section {
	out := slices.Clone(c.Sections)
	for i := range out {
		out[i].Title = out[i].Titles.For(lang, c.DefaultLang())
	}
	return out
}

// quote writes a TOML basic string (JSON escaping is a valid subset).
func quote(s string) string {
	b, _ := json.Marshal(s)
	return strings.NewReplacer(`<`, "<", `>`, ">", `&`, "&").Replace(string(b))
}

// titleTOML writes a title as a string or an inline table.
func titleTOML(t Text, langs []string) string {
	if len(t) == 1 && t[anyLang] != "" {
		return quote(t[anyLang])
	}
	keys := append([]string{anyLang}, langs...)
	for _, k := range sortedKeys(t) {
		if !slices.Contains(keys, k) {
			keys = append(keys, k)
		}
	}
	var parts []string
	for _, k := range keys {
		if v, ok := t[k]; ok {
			if k == anyLang {
				k = `"*"`
			}
			parts = append(parts, k+" = "+quote(v))
		}
	}
	return "{ " + strings.Join(parts, ", ") + " }"
}

var configTmpl = template.Must(template.New("toml").Funcs(template.FuncMap{
	"q":     quote,
	"title": titleTOML,
	"kv":    func(k string, v any, note string) string { return fmt.Sprintf("%-13s = %-18v # %s", k, v, note) },
}).Parse(`# GoMark site configuration.
# Edit by hand or with: gomark config <key> <value>

[site]
title         = {{q .Site.Title}}
author        = {{q .Site.Author}}
{{kv "theme" (q .Site.Theme) "default theme: light | dark (readers switch in the top bar)"}}
{{kv "out" (q .Site.Out) "output directory, relative to this site"}}
{{kv "gomark_url" (q .Site.GoMarkURL) "link on \"GoMark\" in the top bar; \"\" = no link"}}

# Languages
# The first language is the default one (used by "gomark build" without -lang).
# One folder per language: it/<section>/…, en/<section>/…
# The same path in two folders is the same page. A page missing in the built
# language is copied from another language with a notice.
{{range .Languages}}
[[languages]]
code        = {{q .Code}}
label       = {{q .Label}}
description = {{q .Description}}
{{end}}
# Style
[style]
{{with .Style}}{{kv "font_mono" (q .FontMono) "monospace font (Google Fonts)"}}
{{kv "font_sans" (q .FontSans) "sans-serif font (Google Fonts)"}}
{{kv "body_font" (q .BodyFont) "page text: \"mono\" | \"sans\""}}
{{kv "heading_font" (q .HeadingFont) "page titles and headings: \"mono\" | \"sans\""}}
{{kv "font_size" .FontSize "base size in px"}}
{{kv "content_width" .ContentWidth "max content width in px"}}
{{kv "sidebar_width" .SidebarWidth "files column in px"}}
{{kv "folders_width" .FoldersWidth "folders column in px"}}
{{kv "toc_width" .TocWidth "outline column in px"}}
{{kv "radius" .Radius "corner radius in px (0 = square)"}}
{{kv "code_theme" (q .CodeTheme) "code blocks: \"auto\" (follows the theme) | \"light\" | \"dark\""}}{{end}}

# Navigation
[navigation]
{{with .Navigation}}{{kv "folders_open" .FoldersOpen "true = all folders open; false = current branch only"}}
{{kv "show_toc" .ShowToC "\"On this page\" column"}}
{{kv "status_bar" .StatusBar "bottom status bar"}}{{end}}

# AI (gomark ai)
# "gomark translate" writes checked translations; the other AI commands are
# proposals until "gomark ai apply". Keys come from
# the environment only: ANTHROPIC_API_KEY, DEEPSEEK_API_KEY or OPENAI_API_KEY
# (with GOMARK_AI_ENDPOINT for another compatible API); the command provider
# runs GOMARK_AI_COMMAND (e.g. "claude -p").
[ai]
{{with .AI}}{{kv "provider" (q .Provider) "\"anthropic\" | \"deepseek\" | \"openai\" | \"command\""}}
{{kv "model" (q .Model) "model for the API providers"}}
{{kv "effort" (q .Effort) "low | medium | high | xhigh | max"}}
{{kv "max_input_kb" .MaxInputKB "largest file sent to the AI"}}{{end}}
{{if .Strings}}
# Interface strings (overrides)
{{range $l, $m := .Strings}}[strings.{{$l}}]
{{range $k, $v := $m}}{{$k}} = {{q $v}}
{{end}}
{{end}}{{end}}
# Sections
# id        = folder inside each <lang>/ folder
# title     = a single string or { it = "…", en = "…" }
# max_depth = 1 → flat section (3 columns); > 1 → nested folders (4 columns)
{{range .Sections}}
[[sections]]
id        = {{q .ID}}
title     = {{title .Titles $.LangCodes}}
max_depth = {{.MaxDepth}}
{{end}}`))
