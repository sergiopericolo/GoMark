package engine

import (
	"io/fs"
	"os"
	"os/exec"
	"path"
	"path/filepath"
	"regexp"
	"strings"
	"testing"
)

// minWiMarks is the size of the engine's WiMark list.
const minWiMarks = 120

// The engine WiMarks are one flat list, static/widgets/<name>.js, and each
// follows the rules.
func TestEngineWidgets(t *testing.T) {
	Assets = os.DirFS("..")
	n := 0
	err := fs.WalkDir(Assets, "static/widgets", func(p string, d fs.DirEntry, err error) error {
		if err != nil || d.IsDir() || filepath.Ext(p) != ".js" {
			return err
		}
		if path.Dir(p) != "static/widgets" {
			t.Errorf("%s: engine WiMarks live directly in static/widgets", p)
		}
		b, err := fs.ReadFile(Assets, p)
		if err != nil {
			return err
		}
		n++
		src, name := string(b), strings.TrimSuffix(filepath.Base(p), ".js")
		for _, problem := range CheckWidgetSource(name, src) {
			t.Errorf("%s: %s", p, problem)
		}
		if !strings.Contains(src, "example:") {
			t.Errorf("%s: no example (an empty block shows it)", p)
		}
		return nil
	})
	if err != nil {
		t.Fatal(err)
	}
	if n < minWiMarks {
		t.Errorf("%d engine WiMarks, want at least %d", n, minWiMarks)
	}
}

// A WiMark fence keeps its name and inline options for engine.js.
func TestWiMarkFence(t *testing.T) {
	src := "```wimark-callout {\"kind\": \"tip\", \"title\": \"<b>\"}\nBody & more\n```\n\n```go\nx := 1\n```\n"
	body, _, _ := renderMarkdown([]byte(src))
	html := string(body)
	for _, want := range []string{
		`<code class="nohighlight" data-wimark="callout" data-opts="{&#34;kind&#34;: &#34;tip&#34;, &#34;title&#34;: &#34;&lt;b&gt;&#34;}">Body &amp; more`,
		`<pre><code class="language-go">x := 1`,
	} {
		if !strings.Contains(html, want) {
			t.Errorf("missing %s in\n%s", want, html)
		}
	}
	if got := detectWidgets([]byte(src)); len(got) != 1 || got[0] != "callout" {
		t.Errorf("detectWidgets = %v", got)
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
	files, _ := filepath.Glob("../static/widgets/*.js")
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
