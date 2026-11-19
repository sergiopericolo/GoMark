package engine

import (
	"cmp"
	"context"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
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
	listItemRe   = regexp.MustCompile(`^(?:[-*+]|\d+[.)])\s`)
)

// fence is one fenced code block of a Markdown text.
type fence struct{ info, body string }

// wimark splits a fence's info into the WiMark name and its inline options;
// ok is false for a plain code block.
func (f fence) wimark() (name, opts string, ok bool) {
	rest, ok := strings.CutPrefix(f.info, "wimark-")
	if !ok {
		return "", "", false
	}
	name, opts, _ = strings.Cut(rest, " ")
	return name, strings.TrimSpace(opts), true
}

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
			an, _, aw := a.wimark()
			switch {
			case !aw && a.info != b.info:
				problems = append(problems, fmt.Sprintf("block %d changed kind: %q → %q", i+1, a.info, b.info))
			case !aw && a.body != b.body:
				problems = append(problems, fmt.Sprintf("code block %d (%s) was changed", i+1, cmp.Or(a.info, "text")))
			case aw && (a.info != b.info || a.body != b.body):
				// Widgets are copied, never translated: labels included.
				problems = append(problems, fmt.Sprintf("block %d (wimark-%s) was changed: widgets must be copied exactly", i+1, an))
			}
		}
	}
	if a, b := shape(sp), shape(op); a != b {
		problems = append(problems, fmt.Sprintf("structure changed: %d paragraphs, %d list items, %d table rows → %d, %d, %d (merged, split, added or dropped)",
			a[0], a[1], a[2], b[0], b[1], b[2]))
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

// shape counts the paragraphs, list items and table rows of Markdown prose.
// A faithful translation keeps all three: a change means sentences were
// merged, split, added or dropped.
func shape(prose string) [3]int {
	var n [3]int
	inPara := false
	for _, l := range strings.Split(prose, "\n") {
		t := strings.TrimSpace(l)
		switch {
		case t == "", headingRe.MatchString(t):
			inPara = false
		case listItemRe.MatchString(t):
			n[1]++
			inPara = true // continuation lines belong to the item
		case strings.HasPrefix(t, "|"):
			n[2]++
		case !inPara:
			n[0]++
			inPara = true
		}
	}
	return n
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
	known := map[string]Widget{}
	if ws, err := s.Widgets(); err == nil {
		for _, w := range ws {
			known[w.Name] = w
		}
	}
	fences, prose := splitFences(out)
	for i, f := range fences {
		name, opts, ok := f.wimark()
		if !ok {
			continue
		}
		w, ok := known[name]
		if !ok {
			problems = append(problems, fmt.Sprintf("block %d uses an unknown WiMark %q", i+1, name))
			continue
		}
		var v any
		if opts != "" {
			if err := json.Unmarshal([]byte(opts), &v); err != nil {
				problems = append(problems, fmt.Sprintf("block %d (wimark-%s): options: invalid JSON: %v", i+1, name, err))
			}
		}
		if strings.TrimSpace(f.body) != "" && !w.TextInput() {
			if err := json.Unmarshal([]byte(f.body), &v); err != nil {
				problems = append(problems, fmt.Sprintf("block %d (wimark-%s): invalid JSON: %v", i+1, name, err))
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
		problems = append(problems, "external dependencies are not allowed in a widget")
	}
	if regexp.MustCompile(`https?://`).MatchString(code) {
		notes = append(notes, "the widget mentions a URL: check what it links to")
	}
	node, err := exec.LookPath("node")
	if err != nil {
		return problems, append(notes, "node is not installed: the syntax was not checked")
	}
	tmp, err := os.CreateTemp("", "gomark-wimark-*.js")
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
