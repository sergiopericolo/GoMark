package engine

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func testSite(t *testing.T) *Site {
	t.Helper()
	Assets = os.DirFS("..") // the repo: static/ and templates/
	s, err := Init(t.TempDir(), "Test", "", false)
	if err != nil {
		t.Fatal(err)
	}
	if err := s.AddSection("notes", "Notes", 3); err != nil {
		t.Fatal(err)
	}
	return s
}

func TestTracks(t *testing.T) {
	px := defaultConfig().Style
	px.normalize()
	px.FoldersWidth, px.SidebarWidth, px.TocWidth = 224, 256, 232

	cases := []struct {
		name  string
		sec   Section
		mode  string
		index string
		want  string
	}{
		{"multi px", Section{Layout: SectionLayout{Layout: LayoutColumns, Index: indexRight, Style: px}}, "multi", indexRight,
			"224px 256px minmax(0, 1fr) 232px"},
		{"flat px", Section{Layout: SectionLayout{Layout: LayoutColumns, Index: indexRight, Style: px}}, "flat", indexRight,
			"256px minmax(0, 1fr) 232px"},
		{"index none", Section{Layout: SectionLayout{Layout: LayoutColumns, Index: indexNone, Style: px}}, "multi", indexNone,
			"224px 256px minmax(0, 1fr)"},
		{"index left", Section{Layout: SectionLayout{Layout: LayoutColumns, Index: indexLeft, Style: px}}, "flat", indexLeft,
			"232px 256px minmax(0, 1fr)"},
		{"percent defaults", Section{Layout: SectionLayout{Layout: LayoutColumns, Index: indexRight,
			Columns: Columns{Files: 30}, Style: px}}, "multi", indexRight,
			"minmax(0, 18fr) minmax(0, 30fr) minmax(0, 32fr) minmax(0, 20fr)"},
		{"percent flat ignores folders", Section{Layout: SectionLayout{Layout: LayoutColumns, Index: indexRight,
			Columns: Columns{Folders: 40, Files: 30, Index: 20}, Style: px}}, "flat", indexRight,
			"minmax(0, 30fr) minmax(0, 50fr) minmax(0, 20fr)"},
		{"page", Section{Layout: SectionLayout{Layout: LayoutPage, Index: indexRight, Style: px}}, "page", indexNone,
			"minmax(0, 1fr)"},
	}
	for _, c := range cases {
		if got := c.sec.tracks(c.mode, c.index); got != c.want {
			t.Errorf("%s: tracks = %q, want %q", c.name, got, c.want)
		}
	}
}

func TestLayoutValidate(t *testing.T) {
	ok := SectionLayout{Layout: LayoutColumns, Index: indexRight}
	if err := ok.validate("notes"); err != nil {
		t.Fatalf("default layout rejected: %v", err)
	}
	bad := map[string]SectionLayout{
		"layout":        {Layout: "grid", Index: indexRight},
		"index side":    {Layout: LayoutColumns, Index: "top"},
		"negative":      {Layout: LayoutColumns, Index: indexRight, Columns: Columns{Files: -1}},
		"over 100":      {Layout: LayoutColumns, Index: indexRight, Columns: Columns{Files: 101}},
		"no content":    {Layout: LayoutColumns, Index: indexRight, Columns: Columns{Folders: 50, Files: 50}},
		"index ignored": {Layout: LayoutColumns, Index: indexNone, Columns: Columns{Files: 60, Index: 40}},
	}
	for name, l := range bad {
		err := l.validate("notes")
		if name == "index ignored" {
			if err != nil {
				t.Errorf("%s: index column should not count when index is none: %v", name, err)
			}
			continue
		}
		if err == nil {
			t.Errorf("%s: expected an error", name)
		}
	}
}

func TestOverrideKeepsGlobalStyle(t *testing.T) {
	s := testSite(t)
	if err := os.WriteFile(s.sectionFilePath("notes"), []byte("layout = \"columns\"\nindex = \"left\"\n\n[style]\nbody_font = \"mono\"\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := s.loadLayouts(); err != nil {
		t.Fatal(err)
	}
	sec := s.Config.Section("notes")
	if sec.Layout.Style.BodyFont != "mono" {
		t.Errorf("section body_font = %q, want mono", sec.Layout.Style.BodyFont)
	}
	if s.Config.Style.BodyFont != "sans" {
		t.Errorf("global body_font changed to %q", s.Config.Style.BodyFont)
	}
	if sec.Layout.Style.FontSize != s.Config.Style.FontSize {
		t.Errorf("untouched font_size not inherited")
	}
}

func TestSetLayoutRewritesFileAndKeepsOverrides(t *testing.T) {
	s := testSite(t)
	file := filepath.Join(s.Dir, "sections", "notes.toml")
	if err := os.WriteFile(file, []byte("layout = \"columns\"\n\n[style]\nbody_font = \"mono\"\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := s.loadLayouts(); err != nil {
		t.Fatal(err)
	}
	if err := s.Set("sections.notes.columns.files", "25"); err != nil {
		t.Fatal(err)
	}
	b, err := os.ReadFile(file)
	if err != nil {
		t.Fatal(err)
	}
	text := string(b)
	for _, want := range []string{"files = 25", "[style]", "body_font = \"mono\""} {
		if !strings.Contains(text, want) {
			t.Errorf("sections/notes.toml lost %q:\n%s", want, text)
		}
	}
	if err := s.Set("sections.notes.layout", "bogus"); err == nil {
		t.Error("invalid layout accepted")
	}
	if got, _ := s.Get("sections.notes.columns.files"); got.Value != "25" {
		t.Errorf("failed Set changed the config: files = %s", got.Value)
	}
}

func TestPageSectionBuildsOnePage(t *testing.T) {
	s := testSite(t)
	if err := s.AddSection("about", "About", 1); err != nil {
		t.Fatal(err)
	}
	if err := s.Set("sections.about.layout", LayoutPage); err != nil {
		t.Fatal(err)
	}
	if _, err := s.NewPage("", "about", "index.md", "About me"); err != nil {
		t.Fatal(err)
	}
	out := t.TempDir()
	if _, err := s.Build("", out); err != nil {
		t.Fatal(err)
	}
	html, err := os.ReadFile(filepath.Join(out, "about", "index.html"))
	if err != nil {
		t.Fatal(err)
	}
	if strings.Contains(string(html), `class="col-files"`) {
		t.Error("page section rendered columns")
	}
	if !strings.Contains(string(html), `data-depth="page"`) {
		t.Error("page section not marked as page")
	}
}
