/*
 * math — a display equation in LaTeX, numbered, with the meaning of its symbols.
 *   ```wimark-math {"n": "1.2", "where": [["E", "energy"], ["m", "mass"]]}
 *   E = mc^2
 *   ```
 *   Several lines are stacked; lines with & are aligned on it.
 */
WiMark.register('math', {
  title: 'Equation',
  description: 'A numbered display equation (LaTeX); several lines stack, & aligns them; "where" explains the symbols.',
  input: 'text',
  example: { opts: { n: '2.4', where: [['\\hat f(\\xi)', 'the Fourier transform of $f$'], ['\\xi', 'frequency']] }, body: '\\hat f(\\xi) = \\int_{-\\infty}^{\\infty} f(x)\\, e^{-2\\pi i x \\xi}\\, dx' },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var ls = W.lines(v.text), src = ls.join(' \\\\\n');
    if (ls.length > 1) src = ls.some(function (l) { return l.indexOf('&') >= 0; }) ? '\\begin{aligned}' + src + '\\end{aligned}' : '\\begin{gathered}' + src + '\\end{gathered}';
    el.appendChild(h('div', { class: 'wm-eq', id: v.n ? 'eq-' + v.n : null }, h('div', 'wm-eq-body', W.tex(src, true)), v.n ? h('span', 'wm-eq-n', '(' + v.n + ')') : null));
    var where = W.rows(v.where, ['sym', 'text']);
    if (where.length) {
      el.appendChild(h('dl', 'wm-eq-where', h('span', 'wm-muted', 'where'), where.map(function (w) {
        return h('div', null, h('dt', null, W.tex(w.sym)), h('dd', null, W.inline(w.text)));
      })));
    }
  }
});
