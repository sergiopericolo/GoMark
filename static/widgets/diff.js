/*
 * diff — line changes: a unified diff, or two versions split by "=== old" / "=== new".
 *   ```wimark-diff {"file": "gomark.toml", "mode": "unified"}
 *   === old
 *   theme = "light"
 *   === new
 *   theme = "duo"
 *   ```
 */
WiMark.register('diff', {
  title: 'Diff',
  description: 'A unified diff as is, or two versions compared line by line; unified or split view, context lines.',
  input: 'text',
  example: { opts: { file: 'gomark.toml', mode: 'unified', context: 3 }, body: '=== old\n[site]\ntitle = "Docs"\ntheme = "light"\nout   = "dist"\n=== new\n[site]\ntitle = "Docs"\ntheme = "duo"\nout   = "dist"\nmath  = true' },
  choices: { mode: ['unified', 'split'] },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var parts = W.sections(v.text), ops = [];
    if (parts.length >= 2 && parts[0].title) {
      var a = parts[0].text.split('\n'), b = parts[1].text.split('\n'), n = a.length, m = b.length, L = [];
      for (var i = 0; i <= n; i++) L.push(new Array(m + 1).fill(0));
      for (i = n - 1; i >= 0; i--) for (var j = m - 1; j >= 0; j--) L[i][j] = a[i] === b[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
      i = 0; j = 0;
      while (i < n || j < m) {
        if (i < n && j < m && a[i] === b[j]) { ops.push({ t: 'same', s: a[i] }); i++; j++; }
        else if (i < n && (j >= m || L[i + 1][j] >= L[i][j + 1])) { ops.push({ t: 'del', s: a[i] }); i++; }
        else { ops.push({ t: 'add', s: b[j] }); j++; }
      }
    } else {
      String(v.text || '').split('\n').forEach(function (l) {
        if (/^(\+\+\+|---|@@|diff |index )/.test(l)) ops.push({ t: 'meta', s: l });
        else if (l.charAt(0) === '+') ops.push({ t: 'add', s: l.slice(1) });
        else if (l.charAt(0) === '-') ops.push({ t: 'del', s: l.slice(1) });
        else ops.push({ t: 'same', s: l.slice(l.charAt(0) === ' ' ? 1 : 0) });
      });
    }
    var ctx = W.num(v.context, 3), keep = ops.map(function () { return ctx < 0; });
    ops.forEach(function (o, k) { if (o.t !== 'same') for (var d = -ctx; d <= ctx; d++) if (ops[k + d]) keep[k + d] = true; });
    var adds = ops.filter(function (o) { return o.t === 'add'; }).length, dels = ops.filter(function (o) { return o.t === 'del'; }).length;
    var sign = { add: '+', del: '−', same: ' ', meta: '' }, pre = h('pre', 'wm-diff-pre'), gap = false;
    if (v.mode === 'split') {
      var grid = h('div', 'wm-diff-split'), left = [], right = [];
      var pad = function () { while (left.length < right.length) left.push(null); while (right.length < left.length) right.push(null); };
      ops.forEach(function (o, k) { if (!keep[k]) return; if (o.t === 'same') { pad(); left.push(o); right.push(o); } else if (o.t === 'del') left.push(o); else if (o.t === 'add') right.push(o); });
      pad();
      left.forEach(function (o, k) { [o, right[k]].forEach(function (x) { grid.appendChild(h('div', 'wm-diff-line wm-diff-' + (x ? x.t : 'empty'), h('span', { class: 'wm-diff-sign', 'aria-hidden': 'true' }, x ? sign[x.t] : ''), x ? x.s : '')); }); });
      pre.appendChild(grid);
    } else {
      ops.forEach(function (o, k) {
        if (!keep[k]) { if (!gap) pre.appendChild(h('div', 'wm-diff-line wm-diff-gap', '⋯')); gap = true; return; }
        gap = false;
        pre.appendChild(h('div', { class: 'wm-diff-line wm-diff-' + o.t, 'aria-label': o.t === 'add' ? 'added' : o.t === 'del' ? 'removed' : null }, h('span', { class: 'wm-diff-sign', 'aria-hidden': 'true' }, sign[o.t]), o.s));
      });
    }
    el.appendChild(h('div', 'wm-code wm-diff', h('div', 'wm-code-head', h('span', null, v.file || 'diff'), h('span', null, h('span', 'wm-diff-count', '+' + adds), ' ', h('span', 'wm-diff-count', '−' + dels))), pre));
  }
});
