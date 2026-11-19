package engine

import (
	"bytes"
	"image"
	"image/color"
	"image/png"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"testing"
)

func read(t *testing.T, p string) string {
	t.Helper()
	b, err := os.ReadFile(p)
	if err != nil {
		t.Fatal(err)
	}
	return string(b)
}

func TestTwoLanguagesBuildEveryPageWithASwitch(t *testing.T) {
	s := testSite(t)
	if err := s.AddLanguage("it", "Italiano"); err != nil {
		t.Fatal(err)
	}
	if _, err := s.NewPage("en", "notes", "a/first.md", "First"); err != nil {
		t.Fatal(err)
	}
	out := t.TempDir()
	all, err := s.Build("", out)
	if err != nil {
		t.Fatal(err)
	}
	if len(all) != 2 || all[1].Missing != 1 {
		t.Fatalf("want 2 languages with 1 fallback page in it, got %+v", all)
	}
	it := read(t, filepath.Join(out, "it", "notes", "a", "first", "index.html"))
	if !strings.Contains(it, `class="page-notice"`) {
		t.Error("the page copied into it has no notice")
	}
	if !strings.Contains(it, `href="../../../../en/notes/a/first/index.html"`) {
		t.Error("the it page does not link to the same page in en")
	}
	if strings.Contains(it, "<select") {
		t.Error("two languages must use a toggle, not a menu")
	}
	if !strings.Contains(read(t, filepath.Join(out, "index.html")), "en/index.html") {
		t.Error("the root index does not open the default language")
	}
}

func TestThreeLanguagesUseAMenu(t *testing.T) {
	s := testSite(t)
	for _, l := range []string{"it", "de"} {
		if err := s.AddLanguage(l, strings.ToUpper(l)); err != nil {
			t.Fatal(err)
		}
	}
	out := t.TempDir()
	if _, err := s.Build("", out); err != nil {
		t.Fatal(err)
	}
	if html := read(t, filepath.Join(out, "de", "index.html")); !strings.Contains(html, `<select class="lang-select"`) {
		t.Error("three languages must use a menu")
	}
}

func TestOneLanguageBuildsIntoOut(t *testing.T) {
	s := testSite(t)
	out := t.TempDir()
	if _, err := s.Build("", out); err != nil {
		t.Fatal(err)
	}
	html := read(t, filepath.Join(out, "index.html"))
	if strings.Contains(html, "lang-switch") || strings.Contains(html, "http-equiv") {
		t.Error("a one-language site needs neither a switch nor a redirect")
	}
}

// writePNG writes a w×h gradient.
func writePNG(t *testing.T, p string, w, h int) {
	t.Helper()
	img := image.NewRGBA(image.Rect(0, 0, w, h))
	for y := range h {
		for x := range w {
			img.Set(x, y, color.RGBA{uint8(255 * x / w), uint8(255 * y / h), 120, 255})
		}
	}
	var b bytes.Buffer
	if err := png.Encode(&b, img); err != nil {
		t.Fatal(err)
	}
	if err := os.MkdirAll(filepath.Dir(p), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(p, b.Bytes(), 0o644); err != nil {
		t.Fatal(err)
	}
}

func TestImageWiMarkCompressesAndMapsToThePalette(t *testing.T) {
	s := testSite(t)
	writePNG(t, filepath.Join(s.Dir, "media", "photo.png"), 400, 200)
	page := "# Photo\n\n```wimark-image {\"src\": \"media/photo.png\", \"alt\": \"x\", \"max_width\": 200, \"palette\": true}\n```\n"
	if err := os.WriteFile(filepath.Join(s.Dir, "en", "notes", "photo.md"), []byte(page), 0o644); err != nil {
		t.Fatal(err)
	}
	out := t.TempDir()
	all, err := s.Build("", out)
	if err != nil {
		t.Fatal(err)
	}
	if len(all[0].Warnings) > 0 {
		t.Fatalf("warnings: %v", all[0].Warnings)
	}
	html := read(t, filepath.Join(out, "notes", "photo", "index.html"))
	m := regexp.MustCompile(`media/_wm/photo-[0-9a-f]+\.png`).FindString(html)
	if m == "" {
		t.Fatalf("the block was not rewritten to a processed image:\n%s", html)
	}
	f, err := os.Open(filepath.Join(out, filepath.FromSlash(m)))
	if err != nil {
		t.Fatal(err)
	}
	defer f.Close()
	img, err := png.Decode(f)
	if err != nil {
		t.Fatal(err)
	}
	p, ok := img.(*image.Paletted)
	if !ok || img.Bounds().Dx() != 200 {
		t.Fatalf("want a 200px paletted image, got %T %v", img, img.Bounds())
	}
	pal, _ := ThemePalette(s.Config.Site.Theme)
	if len(p.Palette) != len(pal) {
		t.Errorf("palette has %d colors, the theme %d", len(p.Palette), len(pal))
	}
	if _, err := os.Stat(filepath.Join(out, "media", "photo.png")); err != nil {
		t.Error("the original image was not copied to the output")
	}
}

func TestImageWiMarkStaysInsideTheSite(t *testing.T) {
	s := testSite(t)
	page := "```wimark-image\n{\"src\": \"../../etc/passwd\"}\n```\n"
	if err := os.WriteFile(filepath.Join(s.Dir, "en", "notes", "bad.md"), []byte(page), 0o644); err != nil {
		t.Fatal(err)
	}
	all, err := s.Build("", t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	if len(all[0].Warnings) != 1 || !strings.Contains(all[0].Warnings[0], "inside the site") {
		t.Errorf("want one warning about the path, got %v", all[0].Warnings)
	}
}

func TestSectionTheme(t *testing.T) {
	s := testSite(t)
	if err := s.Set("sections.notes.theme", "duo"); err != nil {
		t.Fatal(err)
	}
	if _, err := s.NewPage("", "notes", "x.md", "X"); err != nil {
		t.Fatal(err)
	}
	out := t.TempDir()
	if _, err := s.Build("", out); err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(read(t, filepath.Join(out, "notes", "x", "index.html")), "themes/duo.css") {
		t.Error("the section page does not use the section theme")
	}
	if !strings.Contains(read(t, filepath.Join(out, "index.html")), "themes/light.css") {
		t.Error("the home page lost the site theme")
	}
	if err := s.Set("sections.notes.theme", "nope"); err == nil {
		t.Error("an unknown theme was accepted")
	}
}
