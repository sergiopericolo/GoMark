package engine

import (
	"encoding/json"
	"html"
	"html/template"
	"os"
	"path"
	"path/filepath"
	"regexp"
	"slices"
	"strings"
	"unicode/utf16"
	"unicode/utf8"
)

// The search index is one script per language, <out>/search-index.js, that
// sets window.GOMARK_SEARCH to one entry per page:
//
//	[url, title, section, [[heading id, heading text, level, at], …], text, meta]
//
// at is where the heading's part of text starts. text keeps the code blocks;
// meta says where they are and what else the page holds:
//
//	{s: section id, p: source path, k: [[from, to, lang], …],
//	 f: [feature, …], w: [widget, …], g: language it falls back to}
//
// Offsets count UTF-16 units, as JavaScript strings do. The first five
// fields keep the shape of earlier versions.
//
// It is a script and not JSON so that search also works from file://.
// static/search.js loads it on first use and searches it in memory.
const (
	searchIndexFile = "search-index.js"
	searchMaxText   = 32 << 10 // bytes of body text kept per page
)

// Markers placed in the text while it is flattened, then taken out with
// their offsets. They are private-use runes no page holds.
const (
	mHead   = '' // <id> opens a heading
	mCode   = '' // <lang> opens a code block
	mEnd    = '' // closes a code block
	mFinish = ''
)

var (
	widgetSrcRe = regexp.MustCompile(`(?s)<pre class="wimark-src">.*?</pre>`)
	headOpenRe  = regexp.MustCompile(`<h[1-3] id="([^"]*)"`)
	codeRe      = regexp.MustCompile(`(?s)<pre><code(?: class="language-([^"]*)")?>(.*?)</code></pre>`)
	blockTagRe  = regexp.MustCompile(`(?i)</?(?:p|h[1-6]|li|ul|ol|dl|dt|dd|div|pre|blockquote|table|tr|td|th|br|hr)\b[^>]*>`)
	htmlTagRe   = regexp.MustCompile(`<[^>]*>`)
)

// searchFeatures maps a has: name to the HTML that shows it.
var searchFeatures = []struct{ name, html string }{
	{"code", "<pre><code"},
	{"math", `<span class="math`},
	{"table", "<table"},
	{"image", "<img"},
	{"link", "<a href"},
	{"quote", "<blockquote"},
	{"task", `type="checkbox"`},
}

// searchEntry indexes one page; url is relative to the output root.
func searchEntry(url string, p *Page) []any {
	text, heads, code := searchText(p.Body)

	// The page's own "# Title" opens the text: the title is indexed already.
	if rest, ok := strings.CutPrefix(text, p.Title); ok && p.Title != "" {
		cut := u16len(text) - u16len(strings.TrimLeft(rest, " "))
		text = strings.TrimLeft(rest, " ")
		for i := range heads {
			heads[i].at = max(0, heads[i].at-cut)
		}
		for i := range code {
			code[i].from, code[i].to = max(0, code[i].from-cut), max(0, code[i].to-cut)
		}
	}

	byID := map[string]int{}
	for i, h := range heads {
		if _, ok := byID[h.id]; !ok {
			byID[h.id] = i
		}
	}
	rows := [][]any{}
	var walk func([]*ToCItem)
	walk = func(items []*ToCItem) {
		for _, it := range items {
			at := -1
			if i, ok := byID[it.ID]; ok {
				at = heads[i].at
				delete(byID, it.ID)
			}
			rows = append(rows, []any{it.ID, it.Text, it.Level, at})
			walk(it.Children)
		}
	}
	walk(p.ToC)

	meta := map[string]any{"s": p.SectionID, "p": path.Join(p.SectionID, p.RelPath)}
	if len(code) > 0 {
		k := make([][]any, len(code))
		for i, c := range code {
			k[i] = []any{c.from, c.to, c.lang}
		}
		meta["k"] = k
	}
	var feats []string
	for _, f := range searchFeatures {
		if strings.Contains(string(p.Body), f.html) {
			feats = append(feats, f.name)
		}
	}
	if len(p.Widgets) > 0 {
		feats = append(feats, "widget")
		meta["w"] = p.Widgets
	}
	if len(feats) > 0 {
		meta["f"] = feats
	}
	if p.Fallback {
		meta["g"] = p.SourceLang
	}
	return []any{url, p.Title, p.SectionTitle, rows, text, meta}
}

type textHead struct {
	id string
	at int
}

type textCode struct {
	from, to int
	lang     string
}

// searchText is the readable text of a rendered page, with where each heading
// and each code block starts: no tags, no widget sources, collapsed
// whitespace, cut at searchMaxText.
func searchText(body template.HTML) (string, []textHead, []textCode) {
	s := widgetSrcRe.ReplaceAllString(string(body), " ")
	s = headOpenRe.ReplaceAllStringFunc(s, func(m string) string {
		id := headOpenRe.FindStringSubmatch(m)[1]
		return " " + string(mHead) + html.UnescapeString(id) + string(mFinish) + " " + m
	})
	s = codeRe.ReplaceAllStringFunc(s, func(m string) string {
		sm := codeRe.FindStringSubmatch(m)
		return " " + string(mCode) + sm[1] + string(mFinish) + " " + sm[2] + " " + string(mEnd) + " "
	})
	s = blockTagRe.ReplaceAllString(s, " ")
	s = htmlTagRe.ReplaceAllString(s, "")
	s = strings.Join(strings.Fields(html.UnescapeString(s)), " ")

	var (
		b     strings.Builder
		heads []textHead
		code  []textCode
		at    int // UTF-16 offset in b
		open  = -1
	)
	for i := 0; i < len(s); {
		r, n := utf8.DecodeRuneInString(s[i:])
		switch r {
		case mHead, mCode:
			end := strings.IndexRune(s[i:], mFinish)
			if end < 0 {
				end = len(s) - i
			}
			name := s[i+n : i+end]
			i += end + utf8.RuneLen(mFinish)
			if i < len(s) && s[i] == ' ' {
				i++
			}
			if r == mHead {
				heads = append(heads, textHead{name, at})
			} else {
				code = append(code, textCode{from: at, to: at, lang: strings.ToLower(name)})
				open = len(code) - 1
			}
			continue
		case mEnd:
			if open >= 0 {
				code[open].to = at
				open = -1
			}
			i += n
			continue
		}
		if b.Len()+n > searchMaxText {
			break
		}
		// One space between words: markers leave doubles behind.
		if !(r == ' ' && (b.Len() == 0 || strings.HasSuffix(b.String(), " "))) {
			b.WriteRune(r)
			at += utf16.RuneLen(r)
		}
		i += n
	}
	text := strings.TrimRight(b.String(), " ")
	n := u16len(text)
	for i := range heads {
		heads[i].at = min(heads[i].at, n)
	}
	if open >= 0 {
		code[open].to = n
	}
	code = slices.DeleteFunc(code, func(c textCode) bool { return c.from >= n })
	for i := range code {
		code[i].to = max(code[i].from, min(code[i].to, n))
		// The text around a block ends in a space the block does not own.
		for code[i].to > code[i].from && text[u8at(text, code[i].to-1)] == ' ' {
			code[i].to--
		}
	}
	return text, heads, code
}

func u16len(s string) int {
	n := 0
	for _, r := range s {
		n += utf16.RuneLen(r)
	}
	return n
}

// u8at is the byte index of UTF-16 offset at in s.
func u8at(s string, at int) int {
	n := 0
	for i, r := range s {
		if n >= at {
			return i
		}
		n += utf16.RuneLen(r)
	}
	return len(s)
}

// writeSearchIndex writes the entries as <out>/search-index.js. The JSON
// encoder escapes <, > and &, so no text can close the script.
func writeSearchIndex(out string, entries [][]any) error {
	if entries == nil {
		entries = [][]any{}
	}
	b, err := json.Marshal(entries)
	if err != nil {
		return err
	}
	b = append(append([]byte("window.GOMARK_SEARCH="), b...), ";\n"...)
	return os.WriteFile(filepath.Join(out, searchIndexFile), b, 0o644)
}
