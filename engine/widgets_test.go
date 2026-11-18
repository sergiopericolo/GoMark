package engine

import (
	"io/fs"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"
	"testing"
)

func TestEngineWidgets(t *testing.T) {
	Assets = os.DirFS("..")
	perClass := map[string]int{}
	err := fs.WalkDir(Assets, "static/widgets", func(p string, d fs.DirEntry, err error) error {
		if err != nil || d.IsDir() || filepath.Ext(p) != ".js" {
			return err
		}
		b, err := fs.ReadFile(Assets, p)
		if err != nil {
			return err
		}
		src, name := string(b), strings.TrimSuffix(filepath.Base(p), ".js")
		class := strings.Split(strings.TrimPrefix(p, "static/widgets/"), "/")[0]
		perClass[class]++
		for _, problem := range CheckWidgetSource(name, src) {
			t.Errorf("%s: %s", p, problem)
		}
		return nil
	})
	if err != nil {
		t.Fatal(err)
	}
	for _, c := range WiMarkClasses {
		if perClass[c] != 25 {
			t.Errorf("class %s has %d widgets, want 25", c, perClass[c])
		}
	}
}

// The shared stylesheets color everything through theme tokens.
func TestWidgetStylesUseTokens(t *testing.T) {
	hex := regexp.MustCompile(`#[0-9A-Fa-f]{3}(?:[0-9A-Fa-f]{3})?\b`)
	for _, f := range []string{"../static/wimark.css", "../static/catalog.css", "../static/widgets.js", "../static/catalog.js"} {
		b, err := os.ReadFile(f)
		if err != nil {
			t.Fatal(err)
		}
		if loc := hex.FindIndex(b); loc != nil {
			t.Errorf("%s:%d: literal color %q (use a theme token)", f, strings.Count(string(b[:loc[0]]), "\n")+1, b[loc[0]:loc[1]])
		}
	}
}

// Every script parses (needs node; skipped without it).
func TestWidgetSyntax(t *testing.T) {
	node, err := exec.LookPath("node")
	if err != nil {
		t.Skip("node not installed")
	}
	files, _ := filepath.Glob("../static/widgets/*/*.js")
	files = append(files, "../static/widgets.js", "../static/engine.js", "../static/catalog.js", "../static/ui.js")
	for _, f := range files {
		if out, err := exec.Command(node, "--check", f).CombinedOutput(); err != nil {
			t.Errorf("%s: %s", f, out)
		}
	}
}

// A widget made by "gomark widget new" starts out following the rules.
func TestNewWidgetFollowsTheRules(t *testing.T) {
	s := testSite(t)
	file, err := s.NewWidget("charts/gauge2")
	if err != nil {
		t.Fatal(err)
	}
	b, err := os.ReadFile(filepath.Join(s.Dir, filepath.FromSlash(file)))
	if err != nil {
		t.Fatal(err)
	}
	if problems := CheckWidgetSource("gauge2", string(b)); len(problems) > 0 {
		t.Errorf("the widget template breaks the rules: %v", problems)
	}
}
