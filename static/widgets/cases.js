/*
 * cases — a piecewise definition.
 *   ```wimark-cases {"f": "|x|"}
 *   [["x", "x \\ge 0"], ["-x", "otherwise"]]
 *   ```
 */
WiMark.register('cases', {
  title: 'Piecewise function',
  description: 'A piecewise definition from [value, condition] pairs; word conditions are set as text.',
  example: { opts: { f: '\\operatorname{sgn}(x)' }, body: [['-1', 'x < 0'], ['0', 'x = 0'], ['1', 'otherwise']] },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var rows = W.rows(v.items, ['value', 'cond']).map(function (r) {
      var c = String(r.cond === undefined ? '' : r.cond);
      if (/^[A-Za-z ,.']+$/.test(c)) c = '\\text{' + c + '}';
      else if (c) c = '\\text{if } ' + c;
      return r.value + ' & ' + c;
    });
    var src = (v.f ? v.f + ' = ' : '') + '\\begin{cases}' + rows.join(' \\\\ ') + '\\end{cases}';
    el.appendChild(h('div', 'wm-eq', h('div', 'wm-eq-body', W.tex(src, true)), v.n ? h('span', 'wm-eq-n', '(' + v.n + ')') : null));
  }
});
