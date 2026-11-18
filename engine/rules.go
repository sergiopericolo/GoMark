package engine

import (
	"fmt"
	"regexp"
	"sort"
	"strings"
)

// The WiMark rules: one widget per file, named after it, documented, never
// deciding colors or fonts (the theme does), never injecting HTML, running
// code or reaching the network. The engine's own widgets are tested against
// them, and widgets written by an AI must pass them before they can be applied.
var (
	registerRe  = regexp.MustCompile(`(?m)^\s*(?:WiMark|Widgets)\.register\('([a-z0-9-]+)'`)
	widgetDocRe = regexp.MustCompile(`^/\*\n \* ([a-z0-9-]+) — `)
	widgetRules = map[string]*regexp.Regexp{
		"a hex color":          regexp.MustCompile(`#[0-9A-Fa-f]{6}(?:[0-9A-Fa-f]{2})?\b|['"]#[0-9A-Fa-f]{3,4}['"]`),
		"an rgb/hsl color":     regexp.MustCompile(`\b(?:rgba?|hsla?)\(`),
		"a font family":        regexp.MustCompile(`(?i)font-?family|fontFamily`),
		"a color in style":     regexp.MustCompile(`\.style\.(?:color|background\w*|fill|stroke|border\w*Color|font\w*)\s*=`),
		"a color attribute":    regexp.MustCompile(`setAttribute\(\s*'(?:fill|stroke|color|style)'`),
		"a canvas color":       regexp.MustCompile(`(?:fillStyle|strokeStyle|shadowColor)\s*=\s*['"]`),
		"a canvas font family": regexp.MustCompile(`\.font\s*=\s*['"][^'"]*[A-Za-z]{3,}`), // a size is fine, a family name is not
		"HTML injection":       regexp.MustCompile(`\.(?:innerHTML|outerHTML)\s*=|insertAdjacentHTML|document\.write`),
		"code evaluation":      regexp.MustCompile(`\beval\(|new Function\(|setTimeout\(\s*['"]|setInterval\(\s*['"]`),
		"network access":       regexp.MustCompile(`\bfetch\(|XMLHttpRequest|WebSocket\(|EventSource\(|sendBeacon|importScripts|\bimport\(`),
		"a color in an object": regexp.MustCompile(`\b(?:fill|stroke):\s*'`),
	}
)

// CheckWidgetSource returns the rules a widget script breaks, empty if none.
func CheckWidgetSource(name, src string) []string {
	var out []string
	m := registerRe.FindAllStringSubmatch(src, -1)
	if len(m) != 1 || m[0][1] != name {
		var got []string
		for _, x := range m {
			got = append(got, x[1])
		}
		out = append(out, fmt.Sprintf("must register exactly one widget named %q (found %v)", name, got))
	}
	if d := widgetDocRe.FindStringSubmatch(strings.TrimSpace(src)); d == nil || d[1] != name {
		out = append(out, fmt.Sprintf("must start with a doc comment \"/*\\n * %s — what it does\"", name))
	}
	names := make([]string, 0, len(widgetRules))
	for k := range widgetRules {
		names = append(names, k)
	}
	sort.Strings(names)
	for _, what := range names {
		if loc := widgetRules[what].FindStringIndex(src); loc != nil {
			line := strings.Count(src[:loc[0]], "\n") + 1
			out = append(out, fmt.Sprintf("line %d: %s is not allowed (%q)", line, what, src[loc[0]:loc[1]]))
		}
	}
	return out
}
