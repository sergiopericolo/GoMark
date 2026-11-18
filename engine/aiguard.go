package engine

import (
	"cmp"
	"context"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"reflect"
	"regexp"
	"slices"
	"strings"
	"time"
)

// The guards of gomark ai. They read the AI's output as untrusted text and
// return problems (which block apply) and notes (which do not). A proposal
// that passes may still be wrong; that is what the review before apply is for.

const aiMaxPageBytes = 1 << 20

var (
	fenceOpenRe  = regexp.MustCompile("^\\s{0,3}(`{3,}|~{3,})\\s*([^`]*)$")
	headingRe    = regexp.MustCompile(`^(#{1,6})\s`)
	linkRe       = regexp.MustCompile(`\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)`)
	inlineCodeRe = regexp.MustCompile("`([^`\n]+)`")
	dangerousRe  = regexp.MustCompile(`(?i)<\s*(script|iframe|object|embed|link|meta|style|form|base)\b|\son[a-z]+\s*=|javascript:|vbscript:|data:text/html`)
	urlLikeRe    = regexp.MustCompile(`^(?:[a-z]+:|/|#|\.{1,2}/|[\w./-]+\.(?:png|jpe?g|gif|svg|webp|pdf|md|js|css|html?)$)|^\d{4}-\d{2}-\d{2}`)
	// JSON keys whose string values are identifiers, never prose.
	protectedKeys = []string{"src", "original", "href", "url", "id", "date", "start", "end", "lang", "code", "path", "from", "to",
		"pattern", "flags", "tex", "file", "key", "type", "state", "marker", "branch", "method", "status", "version", "keys", "format", "palette", "theme"}
)

// fence is one fenced code block of a Markdown text.
type fence struct{ info, body string }

// splitFences returns the fenced blocks and the text outside them.
func splitFences(md string) (fences []fence, prose string) {
	var out, body []string
	var open, info string
	for _, line := range strings.Split(md, "\n") {
		if open == "" {
			if m := fenceOpenRe.FindStringSubmatch(line); m != nil {
				open, info, body = m[1], strings.TrimSpace(m[2]), nil
				continue
			}
			out = append(out, line)
			continue
		}
		if t := strings.TrimSpace(line); strings.HasPrefix(t, open[:3]) && len(strings.TrimRight(t, open[:1])) == 0 && len(t) >= len(open) {
			fences = append(fences, fence{info, strings.Join(body, "\n")})
			open = ""
			continue
		}
		body = append(body, line)
	}
	if open != "" {
		fences = append(fences, fence{info, strings.Join(body, "\n")})
	}
	return fences, strings.Join(out, "\n")
}

func headings(prose string) []string {
	var out []string
	for _, l := range strings.Split(prose, "\n") {
		if m := headingRe.FindStringSubmatch(l); m != nil {
			out = append(out, m[1])
		}
	}
	return out
}

func matches(re *regexp.Regexp, s string, group int) []string {
	var out []string
	for _, m := range re.FindAllStringSubmatch(s, -1) {
		out = append(out, m[group])
	}
	slices.Sort(out)
	return out
}

// checkTranslation compares a translation with its source: the structure,
// the code, the links and the widget data must be the same.
func checkTranslation(src, out string, s *Site) (problems, notes []string) {
	if strings.TrimSpace(out) == "" {
		return []string{"the translation is empty"}, nil
	}
	sf, sp := splitFences(src)
	of, op := splitFences(out)
	if a, b := headings(sp), headings(op); !slices.Equal(a, b) {
		problems = append(problems, fmt.Sprintf("headings changed: %v → %v", a, b))
	}
	if len(sf) != len(of) {
		problems = append(problems, fmt.Sprintf("%d code/widget blocks in the source, %d in the translation", len(sf), len(of)))
	} else {
		for i := range sf {
			a, b := sf[i], of[i]
			if a.info != b.info {
				problems = append(problems, fmt.Sprintf("block %d changed kind: %q → %q", i+1, a.info, b.info))
				continue
			}
			if !strings.HasPrefix(a.info, "widget-") {
				if a.body != b.body {
					problems = append(problems, fmt.Sprintf("code block %d (%s) was changed", i+1, cmp.Or(a.info, "text")))
				}
				continue
			}
			if strings.TrimSpace(a.body) == "" {
				if strings.TrimSpace(b.body) != "" {
					problems = append(problems, fmt.Sprintf("block %d (%s) was empty and got content", i+1, a.info))
				}
				continue
			}
			var x, y any
			if err := json.Unmarshal([]byte(b.body), &y); err != nil {
				problems = append(problems, fmt.Sprintf("block %d (%s): invalid JSON: %v", i+1, a.info, err))
				continue
			}
			if json.Unmarshal([]byte(a.body), &x) == nil {
				if why := sameShape(x, y, ""); why != "" {
					problems = append(problems, fmt.Sprintf("block %d (%s): %s", i+1, a.info, why))
				}
			}
		}
	}
	if a, b := matches(linkRe, sp, 1), matches(linkRe, op, 1); !slices.Equal(a, b) {
		problems = append(problems, "links or images changed (their URLs must stay the same)")
	}
	if a, b := matches(inlineCodeRe, sp, 1), matches(inlineCodeRe, op, 1); !slices.Equal(a, b) {
		problems = append(problems, "inline code changed")
	}
	if strings.Count(sp, "$") != strings.Count(op, "$") {
		problems = append(problems, "math ($…$) changed")
	}
	problems = append(problems, checkUnsafe(op)...)
	if ratio := float64(len(out)) / float64(max(1, len(src))); ratio < 0.4 || ratio > 2.5 {
		problems = append(problems, fmt.Sprintf("the translation is %.0f%% of the source length: something was dropped or added", ratio*100))
	}
	return problems, notes
}

// sameShape compares two JSON values: same keys, same lengths, same numbers
// and booleans; strings may differ (they are translated) except identifiers
// (protected keys, URLs, paths, dates).
func sameShape(a, b any, at string) string {
	switch x := a.(type) {
	case map[string]any:
		y, ok := b.(map[string]any)
		if !ok {
			return at + ": not an object any more"
		}
		ka, kb := sortedKeys(x), sortedKeys(y)
		if !slices.Equal(ka, kb) {
			return fmt.Sprintf("%s: keys changed %v → %v", cmp.Or(at, "top"), ka, kb)
		}
		for _, k := range ka {
			if slices.Contains(protectedKeys, k) {
				if !reflect.DeepEqual(x[k], y[k]) {
					return fmt.Sprintf("%s.%s must not change", at, k)
				}
				continue
			}
			if why := sameShape(x[k], y[k], at+"."+k); why != "" {
				return why
			}
		}
	case []any:
		y, ok := b.([]any)
		if !ok || len(x) != len(y) {
			return at + ": list length changed"
		}
		for i := range x {
			if why := sameShape(x[i], y[i], fmt.Sprintf("%s[%d]", at, i)); why != "" {
				return why
			}
		}
	case string:
		y, ok := b.(string)
		if !ok {
			return at + ": not a string any more"
		}
		if urlLikeRe.MatchString(x) && x != y {
			return fmt.Sprintf("%s: %q looks like a URL, path or date and must not change", at, x)
		}
	default:
		if !reflect.DeepEqual(a, b) {
			return fmt.Sprintf("%s: value changed %v → %v", at, a, b)
		}
	}
	return ""
}

// checkPage checks a converted page: a title, known widgets with valid JSON,
// no active HTML.
func checkPage(out string, s *Site) (problems, notes []string) {
	if len(out) > aiMaxPageBytes {
		problems = append(problems, "the page is larger than 1 MB")
	}
	if !strings.HasPrefix(strings.TrimSpace(out), "# ") {
		problems = append(problems, "the page must start with a \"# Title\" line")
	}
	known := map[string]bool{}
	if ws, err := s.Widgets(); err == nil {
		for _, w := range ws {
			known[w.Name] = true
		}
	}
	fences, prose := splitFences(out)
	for i, f := range fences {
		name, ok := strings.CutPrefix(f.info, "widget-")
		if !ok {
			continue
		}
		if !known[name] {
			problems = append(problems, fmt.Sprintf("block %d uses an unknown widget %q", i+1, name))
			continue
		}
		var v any
		if strings.TrimSpace(f.body) != "" {
			if err := json.Unmarshal([]byte(f.body), &v); err != nil {
				problems = append(problems, fmt.Sprintf("block %d (widget-%s): invalid JSON: %v", i+1, name, err))
			}
		}
	}
	problems = append(problems, checkUnsafe(prose)...)
	if n := len(fences); n > 0 {
		notes = append(notes, fmt.Sprintf("%d code or widget blocks: check that numbers and facts match the source", n))
	}
	return problems, notes
}

// checkUnsafe finds active HTML and script URLs in Markdown prose.
func checkUnsafe(prose string) []string {
	prose = inlineCodeRe.ReplaceAllString(prose, "")
	if m := dangerousRe.FindString(prose); m != "" {
		return []string{fmt.Sprintf("active HTML or script URL in the text (%q)", strings.TrimSpace(m))}
	}
	return nil
}

// checkWidget applies the WiMark rules to a widget written by the AI and
// parses it with node when node is installed.
func checkWidget(ctx context.Context, name, code string, s *Site) (problems, notes []string) {
	if len(code) > 200<<10 {
		problems = append(problems, "the widget is larger than 200 KB")
	}
	problems = append(problems, CheckWidgetSource(name, code)...)
	if regexp.MustCompile(`dependencies\s*:\s*\[\s*[^\]\s]`).MatchString(code) {
		problems = append(problems, "external dependencies are not allowed in a generated widget")
	}
	if regexp.MustCompile(`https?://`).MatchString(code) {
		notes = append(notes, "the widget mentions a URL: check what it links to")
	}
	if ws, err := s.Widgets(); err == nil {
		for _, w := range ws {
			if w.Name == name && !w.Site {
				notes = append(notes, fmt.Sprintf("a site widget named %q replaces the engine widget", name))
			}
		}
	}
	node, err := exec.LookPath("node")
	if err != nil {
		return problems, append(notes, "node is not installed: the syntax was not checked")
	}
	tmp, err := os.CreateTemp("", "gomark-widget-*.js")
	if err != nil {
		return problems, notes
	}
	defer os.Remove(tmp.Name())
	_, _ = tmp.WriteString(code)
	tmp.Close()
	ctx, cancel := context.WithTimeout(ctx, 20*time.Second)
	defer cancel()
	// --check parses only: the code is never run.
	if out, err := exec.CommandContext(ctx, node, "--check", filepath.Clean(tmp.Name())).CombinedOutput(); err != nil {
		problems = append(problems, "JavaScript syntax error: "+strings.TrimSpace(lastLine(string(out))))
	}
	return problems, notes
}

func lastLine(s string) string {
	lines := strings.Split(strings.TrimSpace(s), "\n")
	for i := len(lines) - 1; i >= 0; i-- {
		if strings.Contains(lines[i], "Error") {
			return lines[i]
		}
	}
	return lines[len(lines)-1]
}
