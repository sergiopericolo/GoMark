package engine

import (
	"bytes"
	"html"
	"html/template"
	"regexp"
	"slices"
	"strings"

	"github.com/yuin/goldmark"
	"github.com/yuin/goldmark/ast"
	"github.com/yuin/goldmark/extension"
	"github.com/yuin/goldmark/parser"
	"github.com/yuin/goldmark/renderer"
	"github.com/yuin/goldmark/text"
	"github.com/yuin/goldmark/util"
)

// ToCItem is an outline entry (h1–h3).
type ToCItem struct {
	ID       string
	Text     string
	Level    int
	Children []*ToCItem
}

// md is the shared parser: GFM, math, heading ids, WiMark fences.
var md = goldmark.New(
	goldmark.WithParserOptions(parser.WithAutoHeadingID()),
	goldmark.WithExtensions(extension.GFM, mathExt),
	goldmark.WithRendererOptions(renderer.WithNodeRenderers(util.Prioritized(fenceRenderer{}, 100))),
)

var wimarkFenceRe = regexp.MustCompile("(?m)^```wimark-([A-Za-z0-9_-]+)")

// fenceRenderer renders fenced code. A ```wimark-<name> {options} fence
// becomes a source block that static/engine.js turns into the WiMark: the
// name and the inline JSON options travel as data attributes, the body stays
// the text of the block (readable without JavaScript).
type fenceRenderer struct{}

func (fenceRenderer) RegisterFuncs(reg renderer.NodeRendererFuncRegisterer) {
	reg.Register(ast.KindFencedCodeBlock, func(w util.BufWriter, src []byte, node ast.Node, entering bool) (ast.WalkStatus, error) {
		if !entering {
			w.WriteString("</code></pre>\n")
			return ast.WalkContinue, nil
		}
		n := node.(*ast.FencedCodeBlock)
		info := ""
		if n.Info != nil {
			info = strings.TrimSpace(string(n.Info.Segment.Value(src)))
		}
		lang, opts := info, ""
		if i := strings.IndexAny(info, " \t"); i >= 0 {
			lang, opts = info[:i], strings.TrimSpace(info[i:])
		}
		if name, ok := strings.CutPrefix(lang, "wimark-"); ok {
			w.WriteString(`<pre class="wimark-src"><code class="nohighlight" data-wimark="` + html.EscapeString(name) + `"`)
			if opts != "" {
				w.WriteString(` data-opts="` + html.EscapeString(opts) + `"`)
			}
		} else {
			w.WriteString("<pre><code")
			if lang != "" {
				w.WriteString(` class="language-` + html.EscapeString(lang) + `"`)
			}
		}
		w.WriteByte('>')
		for i := range n.Lines().Len() {
			line := n.Lines().At(i)
			w.WriteString(html.EscapeString(string(line.Value(src))))
		}
		return ast.WalkContinue, nil
	})
}

// renderMarkdown returns HTML, outline and title (first h1).
func renderMarkdown(src []byte) (body template.HTML, toc []*ToCItem, title string) {
	doc := md.Parser().Parse(text.NewReader(src))

	var stack []*ToCItem
	ast.Walk(doc, func(n ast.Node, entering bool) (ast.WalkStatus, error) {
		h, ok := n.(*ast.Heading)
		if !entering || !ok || h.Level > 3 {
			return ast.WalkContinue, nil
		}
		item := &ToCItem{Text: headingText(h, src), Level: h.Level}
		if id, ok := h.AttributeString("id"); ok {
			if b, ok := id.([]byte); ok {
				item.ID = string(b)
			}
		}
		if item.ID == "" {
			item.ID = slugify(item.Text)
		}
		if title == "" && h.Level == 1 {
			title = item.Text
		}
		// Pop siblings of equal or deeper level, then nest.
		for len(stack) > 0 && stack[len(stack)-1].Level >= h.Level {
			stack = stack[:len(stack)-1]
		}
		if len(stack) == 0 {
			toc = append(toc, item)
		} else {
			p := stack[len(stack)-1]
			p.Children = append(p.Children, item)
		}
		stack = append(stack, item)
		return ast.WalkContinue, nil
	})

	var buf bytes.Buffer
	if err := md.Renderer().Render(&buf, src, doc); err != nil {
		return "", toc, title
	}
	return template.HTML(buf.String()), toc, title
}

// headingText is the visible text of a heading.
func headingText(n ast.Node, src []byte) string {
	var b bytes.Buffer
	ast.Walk(n, func(c ast.Node, entering bool) (ast.WalkStatus, error) {
		if entering {
			switch v := c.(type) {
			case *ast.Text:
				b.Write(v.Segment.Value(src))
			case *ast.String:
				b.Write(v.Value)
			}
		}
		return ast.WalkContinue, nil
	})
	return strings.TrimSpace(b.String())
}

// slugify is the fallback heading id.
func slugify(s string) string {
	var b strings.Builder
	for _, r := range strings.ToLower(s) {
		if r >= 'a' && r <= 'z' || r >= '0' && r <= '9' {
			b.WriteRune(r)
		} else if b.Len() > 0 && !strings.HasSuffix(b.String(), "-") {
			b.WriteByte('-')
		}
	}
	if out := strings.Trim(b.String(), "-"); out != "" {
		return out
	}
	return "section"
}

// detectWidgets lists the WiMarks used in src, once each.
func detectWidgets(src []byte) []string {
	var out []string
	for _, m := range wimarkFenceRe.FindAllSubmatch(src, -1) {
		if name := string(m[1]); !slices.Contains(out, name) {
			out = append(out, name)
		}
	}
	return out
}
