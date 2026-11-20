package engine

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// The build writes one search entry per page, with its headings and its
// text, and nothing in the text can close the script.
func TestSearchIndex(t *testing.T) {
	s := testSite(t)
	page := "# Deploy\n\nShip it with `gomark publish`. </script><b>x</b>\n\n## Rollback\n\nUndo. Ça va.\n\n" +
		"```wimark-meter\n{\"value\": 3}\n```\n\n```sh\ngomark   rollback\n```\n\n| a | b |\n|---|---|\n| $x$ | 2 |\n"
	if err := os.MkdirAll(filepath.Join(s.Dir, "en", "notes", "ops"), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(s.Dir, "en", "notes", "ops", "deploy.md"), []byte(page), 0o644); err != nil {
		t.Fatal(err)
	}
	out := t.TempDir()
	if _, err := s.Build("", out); err != nil {
		t.Fatal(err)
	}
	src := read(t, filepath.Join(out, searchIndexFile))
	if strings.Contains(src, "</script>") {
		t.Fatal("the index can close its own script")
	}
	raw, ok := strings.CutPrefix(strings.TrimSpace(src), "window.GOMARK_SEARCH=")
	if !ok {
		t.Fatalf("unexpected index: %.60s", src)
	}
	var entries [][]any
	if err := json.Unmarshal([]byte(strings.TrimSuffix(raw, ";")), &entries); err != nil {
		t.Fatal(err)
	}
	if len(entries) != 1 {
		t.Fatalf("want 1 entry, got %d", len(entries))
	}
	e := entries[0]
	if e[0] != "notes/ops/deploy/index.html" || e[1] != "Deploy" || e[2] != "Notes" {
		t.Errorf("entry = %v", e[:3])
	}
	text := e[4].(string)
	if !strings.HasPrefix(text, "Ship it with gomark publish.") || strings.Contains(text, "value") {
		t.Errorf("text = %q", text)
	}
	// Offsets count UTF-16 units, as the browser does.
	u16 := []rune(text) // the text is in the BMP
	at := func(v any) int { return int(v.(float64)) }

	heads := e[3].([]any)
	if len(heads) != 2 {
		t.Fatalf("headings = %v", heads)
	}
	h := heads[1].([]any)
	if h[0] != "rollback" || h[1] != "Rollback" || at(h[2]) != 2 {
		t.Errorf("heading = %v", h)
	}
	if got := string(u16[at(h[3]):]); !strings.HasPrefix(got, "Rollback Undo. Ça va.") {
		t.Errorf("heading starts at %q", got)
	}

	meta := e[5].(map[string]any)
	if meta["s"] != "notes" || meta["p"] != "notes/ops/deploy.md" {
		t.Errorf("meta = %v", meta)
	}
	code := meta["k"].([]any)
	if len(code) != 1 {
		t.Fatalf("code = %v", code)
	}
	k := code[0].([]any)
	if got := string(u16[at(k[0]):at(k[1])]); got != "gomark rollback" || k[2] != "sh" {
		t.Errorf("code block = %q (%v)", got, k[2])
	}
	feats, _ := json.Marshal(meta["f"])
	if string(feats) != `["code","math","table","widget"]` {
		t.Errorf("features = %s", feats)
	}
	if w, _ := json.Marshal(meta["w"]); string(w) != `["meter"]` {
		t.Errorf("widgets = %s", w)
	}
}
