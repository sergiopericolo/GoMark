/*
 * compare — options against features: ✓ ✕ ◐ or short text; one column highlighted.
 *   ```wimark-compare {"cols": ["GoMark", "Hugo", "Sphinx"], "best": "GoMark"}
 *   [["Single binary", true, true, false], ["LaTeX math", true, "partial", true], "# Group title"]
 *   ```
 */
WiMark.register('compare', {
  title: 'Comparison',
  description: 'Options against features with ✓ ✕ ◐ or text; "# title" rows group features, one column is highlighted.',
  example: { opts: { cols: ['GoMark', 'Hugo', 'Sphinx'], best: 'GoMark' }, body: ['# Build', ['Single binary', true, true, false], ['Incremental builds', false, true, true], '# Writing', ['LaTeX math', true, 'partial', true], ['Diagrams from JSON', true, false, 'plugin'], ['API reference', 'WiMarks', false, 'autodoc']] },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var cols = W.list(v.cols), best = cols.indexOf(v.best);
    function mark(x) {
      if (x === true) return h('span', { class: 'wm-bool wm-pos', title: 'yes' }, '✓');
      if (x === false || x === null) return h('span', { class: 'wm-bool wm-neg', title: 'no' }, '✕');
      if (x === 'partial') return h('span', { class: 'wm-bool wm-warn', title: 'partial' }, '◐');
      return W.inline(x);
    }
    var tbl = h('table', 'wm-table wm-compare');
    tbl.appendChild(h('thead', null, h('tr', null, h('th'), cols.map(function (c, i) { return h('th', { scope: 'col', class: 'wm-center' + (i === best ? ' wm-best' : '') }, W.inline(c)); }))));
    var body = h('tbody');
    W.list(v.items).forEach(function (r) {
      if (typeof r === 'string') { body.appendChild(h('tr', 'wm-group-row', h('th', { colspan: cols.length + 1, scope: 'colgroup' }, W.inline(r.replace(/^#\s*/, ''))))); return; }
      r = W.list(r);
      body.appendChild(h('tr', null, h('th', { scope: 'row' }, W.inline(r[0])), cols.map(function (c, i) { return h('td', { class: 'wm-center' + (i === best ? ' wm-best' : '') }, mark(r[i + 1])); })));
    });
    tbl.appendChild(body);
    el.appendChild(h('div', 'wm-table-wrap', tbl));
  }
});
