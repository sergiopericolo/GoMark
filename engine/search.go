package engine

import (
	"encoding/json"
	"html"
	"html/template"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"unicode/utf8"
)

// The search index is one script per language, <out>/search-index.js, that
// sets window.GOMARK_SEARCH to one entry per page:
//
//	[url, title, section, [[heading id, heading text], …], text]
//
// It is a script and not JSON so that search also works from file://.
// static/search.js loads it on first use and searches it in memory.
const (
	searchIndexFile = "search-index.js"
	searchMaxText   = 32 << 10 // bytes of body text kept per page
)

var (
	widgetSrcRe = regexp.MustCompile(`(?s)<pre class="wimark-src">.*?</pre>`)
	blockTagRe  = regexp.MustCompile(`(?i)</?(?:p|h[1-6]|li|ul|ol|dl|dt|dd|div|pre|blockquote|table|tr|td|th|br|hr)\b[^>]*>`)
	htmlTagRe   = regexp.MustCompile(`<[^>]*>`)
)

// searchEntry indexes one page; url is relative to the output root.
func searchEntry(url string, p *Page) []any {
	heads := [][2]string{}
	var walk func([]*ToCItem)
	walk = func(items []*ToCItem) {
		for _, it := range items {
			heads = append(heads, [2]string{it.ID, it.Text})
			walk(it.Children)
		}
	}
	walk(p.ToC)
	// The page's own "# Title" opens the text: the title is indexed already.
	text := strings.TrimSpace(strings.TrimPrefix(plainText(p.Body), p.Title))
	return []any{url, p.Title, p.SectionTitle, heads, text}
}

// plainText is the readable text of a rendered page: no tags, no widget
// sources, collapsed whitespace, cut at searchMaxText.
func plainText(body template.HTML) string {
	s := widgetSrcRe.ReplaceAllString(string(body), " ")
	s = blockTagRe.ReplaceAllString(s, " ")
	s = htmlTagRe.ReplaceAllString(s, "")
	s = strings.Join(strings.Fields(html.UnescapeString(s)), " ")
	if len(s) > searchMaxText {
		s = s[:searchMaxText]
		for !utf8.ValidString(s) {
			s = s[:len(s)-1]
		}
	}
	return s
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
