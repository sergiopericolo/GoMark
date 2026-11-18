package engine

import (
	"fmt"
	"reflect"
	"slices"
	"strconv"
	"strings"
)

// Setting is one value of gomark.toml by dotted key, e.g. site.theme,
// languages.default, sections.notes.title.it.
type Setting struct {
	Key     string
	Value   string
	Options []string // allowed values, when limited
}

// tables maps [site], [style], [navigation].
func (c *Config) tables() map[string]any {
	return map[string]any{"site": &c.Site, "style": &c.Style, "navigation": &c.Navigation, "ai": &c.AI}
}

// Settings lists every value, in file order.
func (s *Site) Settings() []Setting {
	c := s.Config
	var out []Setting
	add := func(k, v string, opts ...string) { out = append(out, Setting{k, v, opts}) }
	for _, name := range []string{"site", "style", "navigation", "ai"} {
		v := reflect.ValueOf(c.tables()[name]).Elem()
		for i := range v.NumField() {
			tag := v.Type().Field(i).Tag.Get("toml")
			if tag == "-" {
				continue
			}
			f, key := v.Field(i), name+"."+tag
			var opts []string
			switch {
			case f.Kind() == reflect.Bool:
				opts = []string{"true", "false"}
			case key == "site.theme":
				opts = Themes()
			case key == "style.body_font":
				opts = []string{"mono", "sans"}
			case key == "style.code_theme":
				opts = []string{"auto", "light", "dark"}
			case key == "ai.provider":
				opts = []string{"anthropic", "command"}
			case key == "ai.effort":
				opts = []string{"low", "medium", "high", "xhigh", "max"}
			}
			add(key, fmt.Sprint(f.Interface()), opts...)
		}
	}
	add("languages.default", c.DefaultLang(), c.LangCodes()...)
	for _, l := range c.Languages {
		add("languages."+l.Code+".label", l.Label)
		add("languages."+l.Code+".description", l.Description)
	}
	for _, sec := range c.Sections {
		add("sections."+sec.ID+".max_depth", strconv.Itoa(sec.MaxDepth))
		for _, l := range c.LangCodes() {
			add("sections."+sec.ID+".title."+l, sec.Titles.For(l, c.DefaultLang()))
		}
		add("sections."+sec.ID+".layout", sec.Layout.Layout, LayoutColumns, LayoutPage)
		add("sections."+sec.ID+".index", sec.Layout.Index, indexRight, indexLeft, indexNone)
		add("sections."+sec.ID+".theme", sec.Layout.Theme, append([]string{""}, Themes()...)...)
		add("sections."+sec.ID+".columns.folders", strconv.Itoa(sec.Layout.Columns.Folders))
		add("sections."+sec.ID+".columns.files", strconv.Itoa(sec.Layout.Columns.Files))
		add("sections."+sec.ID+".columns.index", strconv.Itoa(sec.Layout.Columns.Index))
	}
	return out
}

// Get returns the value of key.
func (s *Site) Get(key string) (Setting, error) {
	i := slices.IndexFunc(s.Settings(), func(st Setting) bool { return st.Key == key })
	if i < 0 {
		return Setting{}, fmt.Errorf("unknown setting %q", key)
	}
	return s.Settings()[i], nil
}

// Set changes and saves one value; an invalid one changes nothing.
func (s *Site) Set(key, value string) error {
	st, err := s.Get(key)
	if err != nil {
		return err
	}
	if len(st.Options) > 0 && !slices.Contains(st.Options, value) {
		return fmt.Errorf("%s must be one of: %s", key, strings.Join(st.Options, ", "))
	}
	before := *s.Config
	before.Languages = slices.Clone(before.Languages)
	before.Sections = slices.Clone(before.Sections)
	k := strings.Split(key, ".")
	if err := s.set(k, value); err != nil {
		return err
	}
	s.Config.normalize()
	if err := s.Config.validate(); err != nil {
		*s.Config = before
		return err
	}
	if k[0] == "sections" && k[2] != "title" && k[2] != "max_depth" {
		if err := s.saveLayout(*s.Config.Section(k[1])); err != nil {
			return err
		}
	}
	return s.Save()
}

func (s *Site) set(k []string, value string) error {
	c := s.Config
	switch {
	case k[0] == "languages" && k[1] == "default":
		i := slices.IndexFunc(c.Languages, func(l Language) bool { return l.Code == value })
		def := c.Languages[i]
		c.Languages = append([]Language{def}, slices.Delete(c.Languages, i, i+1)...)
	case k[0] == "languages":
		l := &c.Languages[slices.IndexFunc(c.Languages, func(l Language) bool { return l.Code == k[1] })]
		if k[2] == "label" {
			l.Label = value
		} else {
			l.Description = value
		}
	case k[0] == "sections":
		sec := c.Section(k[1])
		switch k[2] {
		case "title":
			titles := Text{}
			for kk, v := range sec.Titles {
				titles[kk] = v
			}
			titles[k[3]] = value
			sec.Titles = titles
			return nil
		case "layout":
			sec.Layout.Layout = value
			return nil
		case "index":
			sec.Layout.Index = value
			return nil
		case "theme":
			sec.Layout.Theme = value
			return nil
		case "columns":
			n, err := strconv.Atoi(value)
			if err != nil || n < 0 {
				return fmt.Errorf("%s must be a percentage (0 = default)", strings.Join(k, "."))
			}
			switch k[3] {
			case "folders":
				sec.Layout.Columns.Folders = n
			case "files":
				sec.Layout.Columns.Files = n
			case "index":
				sec.Layout.Columns.Index = n
			}
			return nil
		}
		n, err := strconv.Atoi(value)
		if err != nil || n < 1 {
			return fmt.Errorf("max_depth must be an integer >= 1")
		}
		sec.MaxDepth = n
	default:
		v := reflect.ValueOf(c.tables()[k[0]]).Elem()
		for i := range v.NumField() {
			if v.Type().Field(i).Tag.Get("toml") != k[1] {
				continue
			}
			switch f := v.Field(i); f.Kind() {
			case reflect.Bool:
				f.SetBool(value == "true")
			case reflect.Int:
				n, err := strconv.Atoi(value)
				if err != nil {
					return fmt.Errorf("%s must be an integer", strings.Join(k, "."))
				}
				f.SetInt(int64(n))
			default:
				f.SetString(value)
			}
		}
	}
	return nil
}
