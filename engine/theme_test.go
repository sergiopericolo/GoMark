package engine

import (
	"os"
	"testing"
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
