package engine

import (
	"context"
	"io/fs"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"
	"testing"
)

// The engine ships the runtime, not widgets: a new site has none, and the
// ones it creates in <site>/widgets are all it has.
func TestWidgetsComeOnlyFromTheSite(t *testing.T) {
	s := testSite(t)
	if _, err := fs.Stat(Assets, "static/widgets"); err == nil {
		t.Error("static/widgets exists: the engine ships no WiMarks")
	}
	if ws, err := s.Widgets(); err != nil || len(ws) != 0 {
		t.Fatalf("a new site has WiMarks: %v %v", ws, err)
	}
	if _, err := s.NewWidget("charts/gauge"); err != nil {
		t.Fatal(err)
	}
	ws, err := s.Widgets()
	if err != nil || len(ws) != 1 || ws[0].Name != "gauge" || ws[0].Path != "widgets/charts/gauge.js" {
		t.Fatalf("Widgets = %v %v", ws, err)
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
	for _, f := range []string{"../static/widgets.js", "../static/engine.js", "../static/catalog.js", "../static/ui.js"} {
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

// widget check reports a broken widget; widget skill installs the skill once.
func TestCheckWidgetFileAndSkill(t *testing.T) {
	s := testSite(t)
	file, err := s.NewWidget("meter")
	if err != nil {
		t.Fatal(err)
	}
	full := filepath.Join(s.Dir, filepath.FromSlash(file))
	if problems, _, err := s.CheckWidgetFile(context.Background(), full); err != nil || len(problems) > 0 {
		t.Fatalf("the template fails the check: %v %v", problems, err)
	}
	bad := strings.Replace(read(t, full), "mount: function (el, v) {", "mount: function (el, v) { el.innerHTML = v.value;", 1)
	os.WriteFile(full, []byte(bad), 0o644)
	if problems, _, _ := s.CheckWidgetFile(context.Background(), full); len(problems) == 0 {
		t.Error("innerHTML passed the check")
	}

	got, err := s.WriteWidgetSkill(false)
	if err != nil || got != WidgetSkillFile {
		t.Fatalf("WriteWidgetSkill = %q, %v", got, err)
	}
	if !strings.Contains(read(t, filepath.Join(s.Dir, WidgetSkillFile)), "gomark widget context") {
		t.Error("the skill does not explain the loop")
	}
	if _, err := s.WriteWidgetSkill(false); err == nil {
		t.Error("the skill was replaced without -force")
	}
	if _, err := s.WriteWidgetSkill(true); err != nil {
		t.Error(err)
	}
}
