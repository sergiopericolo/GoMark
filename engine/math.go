package engine

import (
	"bytes"
	"html"

	"github.com/yuin/goldmark"
	"github.com/yuin/goldmark/ast"
	"github.com/yuin/goldmark/parser"
	"github.com/yuin/goldmark/renderer"
	"github.com/yuin/goldmark/text"
	"github.com/yuin/goldmark/util"
)

// LaTeX math: $…$ → <span class="math math-inline">\(…\)</span>,
// $$…$$ → <span class="math math-display">\[…\]</span>, kept raw for MathJax.

var kindMath = ast.NewNodeKind("Math")

type mathNode struct {
	ast.BaseInline
	Value   []byte // LaTeX without delimiters
	Display bool
}

func (n *mathNode) Kind() ast.NodeKind            { return kindMath }
func (n *mathNode) Dump(source []byte, level int) { ast.DumpHelper(n, source, level, nil, nil) }

type mathExtension struct{}

var mathExt = mathExtension{}

func (mathExtension) Extend(m goldmark.Markdown) {
	m.Parser().AddOptions(parser.WithInlineParsers(util.Prioritized(mathExt, 501)))
	m.Renderer().AddOptions(renderer.WithNodeRenderers(util.Prioritized(mathExt, 501)))
}

func (mathExtension) Trigger() []byte { return []byte{'$'} }

func (mathExtension) Parse(_ ast.Node, block text.Reader, _ parser.Context) ast.Node {
	line, _ := block.PeekLine()
	if len(line) == 0 || line[0] != '$' {
		return nil
	}
	// No space inside the delimiters, so "$5 and $10" is not math.
	node := func(start, end, advance int, display bool) ast.Node {
		if start >= end || line[start] == ' ' || line[end-1] == ' ' {
			return nil
		}
		block.Advance(advance)
		return &mathNode{Value: bytes.TrimSpace(line[start:end]), Display: display}
	}
	if len(line) > 1 && line[1] == '$' {
		if i := bytes.Index(line[2:], []byte("$$")); i >= 0 {
			return node(2, 2+i, 2+i+2, true)
		}
		return nil
	}
	for i := 1; i < len(line); i++ {
		if line[i] == '$' && (i+1 >= len(line) || line[i+1] != '$') {
			return node(1, i, i+1, false)
		}
	}
	return nil
}

func (mathExtension) RegisterFuncs(reg renderer.NodeRendererFuncRegisterer) {
	reg.Register(kindMath, func(w util.BufWriter, _ []byte, n ast.Node, entering bool) (ast.WalkStatus, error) {
		if !entering {
			return ast.WalkContinue, nil
		}
		m := n.(*mathNode)
		open, cls, end := `\(`, "math-inline", `\)`
		if m.Display {
			open, cls, end = `\[`, "math-display", `\]`
		}
		w.WriteString(`<span class="math ` + cls + `">` + open + html.EscapeString(string(m.Value)) + end + `</span>`)
		return ast.WalkSkipChildren, nil
	})
}
