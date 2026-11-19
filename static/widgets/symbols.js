/*
 * symbols — a notation table: LaTeX symbols and what they mean.
 *   ```wimark-symbols {"title": "Notation"}
 *   [["\\mathbb{N}", "natural numbers, from 0"], ["\\lVert x \\rVert", "Euclidean norm"]]
 *   ```
 */
WiMark.register('symbols', {
  title: 'Notation',
  description: 'A table of symbols (LaTeX) and their meaning: the notation section of a paper.',
  example: { opts: { title: 'Notation' }, body: [['\\mathbb{N}', 'natural numbers, $0 \\in \\mathbb{N}$'], ['[n]', 'the set $\\{1, \\dots, n\\}$'], ['\\lVert x \\rVert_2', 'Euclidean norm'], ['A^\\top', 'transpose of $A$'], ['\\mathbb{E}[X]', 'expected value of $X$'], ['f \\in O(g)', '$f$ grows at most like $g$']] },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    if (v.title) el.appendChild(h('div', 'wm-box-title', W.inline(v.title)));
    el.appendChild(h('dl', 'wm-symbols', W.rows(v.items, ['sym', 'text']).map(function (r) {
      return h('div', null, h('dt', null, W.tex(r.sym)), h('dd', null, W.inline(r.text)));
    })));
  }
});
