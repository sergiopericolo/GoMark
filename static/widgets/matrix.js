/*
 * matrix — a matrix or vector from rows of numbers or LaTeX.
 *   ```wimark-matrix {"name": "A", "type": "b"}
 *   [[1, 2], [3, 4]]
 *   ```
 *   type: b [ ], p ( ), v | |, B { }, V ‖ ‖ · "after": "= \\lambda x" appends LaTeX
 */
WiMark.register('matrix', {
  title: 'Matrix',
  description: 'A matrix or vector from JSON rows ([1, 2] is a column vector); brackets b p v B V.',
  example: { opts: { name: 'R(\\theta)', type: 'b' }, body: [['\\cos\\theta', '-\\sin\\theta'], ['\\sin\\theta', '\\cos\\theta']] },
  choices: { type: ['b', 'p', 'v', 'B', 'V'] },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var rows = W.list(v.items).map(function (r) { return Array.isArray(r) ? r : [r]; });
    var env = ({ b: 'bmatrix', p: 'pmatrix', v: 'vmatrix', B: 'Bmatrix', V: 'Vmatrix' })[v.type || 'b'] || 'bmatrix';
    var cell = function (x) { return typeof x === 'number' ? W.fmt(x, { maximumFractionDigits: 4, useGrouping: false }) : String(x); };
    var src = '\\begin{' + env + '}' + rows.map(function (r) { return r.map(cell).join(' & '); }).join(' \\\\ ') + '\\end{' + env + '}';
    if (v.name) src = v.name + ' = ' + src;
    if (v.after) src += ' ' + v.after;
    el.appendChild(h('div', 'wm-eq', h('div', 'wm-eq-body', W.tex(src, true)), v.n ? h('span', 'wm-eq-n', '(' + v.n + ')') : null));
  }
});
