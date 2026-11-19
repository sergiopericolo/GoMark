/*
 * system — a system of equations, one per line, aligned on the relation.
 *   ```wimark-system {"n": "4"}
 *   2x + y = 5
 *   x - y = 1
 *   ```
 */
WiMark.register('system', {
  title: 'System of equations',
  description: 'Equations one per line, grouped by a brace and aligned on =, ≤ or ≥; optional solution line.',
  input: 'text',
  example: { opts: { solution: 'x = 2,\; y = 1' }, body: '2x + y = 5\nx - y = 1' },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var rows = W.lines(v.text).map(function (l) { return l.indexOf('&') >= 0 ? l : l.replace(/(\\le|\\ge|\\neq|<=|>=|=|<|>)/, '&$1'); });
    var src = '\\left\\{\\begin{aligned}' + rows.join(' \\\\ ') + '\\end{aligned}\\right.';
    if (v.solution) src += '\\qquad\\Longrightarrow\\qquad ' + v.solution;
    el.appendChild(h('div', 'wm-eq', h('div', 'wm-eq-body', W.tex(src, true)), v.n ? h('span', 'wm-eq-n', '(' + v.n + ')') : null));
  }
});
