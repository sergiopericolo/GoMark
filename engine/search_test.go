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
	page := "# Deploy\n\nShip it with `gomark publish`. </script><b>x</b>\n\n## Rollback\n\nUndo.\n\n" +
		"```wimark-meter\n{\"value\": 3}\n```\n"
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
	heads, _ := json.Marshal(e[3])
	if !strings.Contains(string(heads), `["rollback","Rollback"]`) {
		t.Errorf("headings = %s", heads)
	}
	text := e[4].(string)
	if !strings.HasPrefix(text, "Ship it with gomark publish.") || strings.Contains(text, "value") {
		t.Errorf("text = %q", text)
	}
}
