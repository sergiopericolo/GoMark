package engine

import (
	"os"
	"strings"
	"testing"
	"testing/fstest"
)

// Every bundled theme declares a class that matches its palette and defines
// every token the interface and the widgets read.
func TestBundledThemes(t *testing.T) {
	Assets = os.DirFS("..")
	classes := map[string]int{}
	for _, name := range Themes() {
		info, err := CheckTheme(name)
		if err != nil {
			t.Fatalf("%s: %v", name, err)
		}
		for _, p := range info.Problems {
			t.Errorf("%s: %s", name, p)
		}
		classes[info.Class]++
		t.Logf("%-14s %-10s families=%d colors=%d", name, info.Class, info.Families, info.Colors)
	}
	for _, c := range ThemeClasses {
		if classes[c] == 0 {
			t.Errorf("no bundled %s theme", c)
		}
	}
}

func TestRequiredTokens(t *testing.T) {
	Assets = os.DirFS("..")
	if len(requiredTokens()) < 60 {
		t.Fatalf("requiredTokens found only %d tokens", len(requiredTokens()))
	}
}

// A monochrome theme takes one hue, and only in the highlight tokens.
func TestHighlightHue(t *testing.T) {
	base, err := os.ReadFile("../static/theme.css")
	if err != nil {
		t.Fatal(err)
	}
	light, err := os.ReadFile("../static/themes/light.css")
	if err != nil {
		t.Fatal(err)
	}
	for _, c := range []struct {
		name, from, to string
		ok             bool
	}{
		{"light", "", "", true},
		{"blue-bg", "--bg:          #EFECE6", "--bg:          #3366CC", false},
		{"two-hues", "--mark-soft:   #F6E7BC", "--mark-soft:   #BCE7F6", false},
	} {
		Assets = fstest.MapFS{
			"static/theme.css":                 {Data: base},
			"static/themes/" + c.name + ".css": {Data: []byte(strings.Replace(string(light), c.from, c.to, 1))},
		}
		info, err := CheckTheme(c.name)
		if err != nil {
			t.Fatal(err)
		}
		if ok := len(info.Problems) == 0; ok != c.ok {
			t.Errorf("%s: ok=%v, want %v (%v)", c.name, ok, c.ok, info.Problems)
		}
	}
}
