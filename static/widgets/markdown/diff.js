/*
 * diff — changes between two texts, unified or side by side.
 * data:   { "before", "after", "title"? } or { "diff": "unified diff text" }
 * config: { "mode": "unified" | "split", "context": 3 }
 */
WiMark.register('diff', {
  title: 'Diff',
  description: 'Line changes between two versions (computed, or from a unified diff), unified or split.',
  example: {
    data: {
      title: 'gomark.toml',
      before: '[site]\ntitle = "Blog"\ntheme = "light"\nout   = "dist"',
      after: '[site]\ntitle = "Blog"\ntheme = "spectrum"\nout   = "dist"\nauthor = "Ada"'
    },
    config: { mode: 'unified', context: 3 }
  },
  choices: { mode: ['unified', 'split'] },
  mount: function (el, data, config) {
    var W = WiMark, h = W.h;
    var ops = [];
    if (data.diff) {
      String(data.diff).split('\n').forEach(function (l) {
        if (/^(\+\+\+|---|@@|diff |index )/.test(l)) ops.push({ t: 'meta', s: l });
        else if (l.charAt(0) === '+') ops.push({ t: 'add', s: l.slice(1) });
        else if (l.charAt(0) === '-') ops.push({ t: 'del', s: l.slice(1) });
        else ops.push({ t: 'same', s: l.slice(l.charAt(0) === ' ' ? 1 : 0) });
      });
    } else {
      // Longest common subsequence on lines.
      var a = String(data.before || '').split('\n'), b = String(data.after || '').split('\n');
      var n = a.length, m = b.length, L = [];
      for (var i = 0; i <= n; i++) { L.push(new Array(m + 1).fill(0)); }
      for (i = n - 1; i >= 0; i--) for (var j = m - 1; j >= 0; j--) L[i][j] = a[i] === b[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
      i = 0; j = 0;
      while (i < n || j < m) {
        if (i < n && j < m && a[i] === b[j]) { ops.push({ t: 'same', s: a[i] }); i++; j++; }
        else if (i < n && (j >= m || L[i + 1][j] >= L[i][j + 1])) { ops.push({ t: 'del', s: a[i] }); i++; }
        else { ops.push({ t: 'add', s: b[j] }); j++; }
      }
    }
    var ctx = W.num(config.context, 3), keep = ops.map(function () { return ctx < 0; });
    ops.forEach(function (o, k) { if (o.t !== 'same') for (var d = -ctx; d <= ctx; d++) if (ops[k + d]) keep[k + d] = true; });
    var adds = ops.filter(function (o) { return o.t === 'add'; }).length, dels = ops.filter(function (o) { return o.t === 'del'; }).length;
    var sign = { add: '+', del: '−', same: ' ', meta: '' };
    var pre = h('pre', 'wm-diff-pre'), gap = false;
    if (config.mode === 'split') {
      var grid = h('div', 'wm-diff-split');
      var left = [], right = [];
      ops.forEach(function (o, k) {
        if (!keep[k]) return;
        if (o.t === 'same') { while (left.length < right.length) left.push(null); while (right.length < left.length) right.push(null); left.push(o); right.push(o); }
        else if (o.t === 'del') left.push(o);
        else if (o.t === 'add') right.push(o);
      });
      while (left.length < right.length) left.push(null);
      while (right.length < left.length) right.push(null);
      left.forEach(function (o, k) {
        [o, right[k]].forEach(function (x) {
          grid.appendChild(h('div', 'wm-diff-line wm-diff-' + (x ? x.t : 'empty'), h('span', { class: 'wm-diff-sign', 'aria-hidden': 'true' }, x ? sign[x.t] : ''), x ? x.s : ''));
        });
      });
      pre.appendChild(grid);
    } else {
      ops.forEach(function (o, k) {
        if (!keep[k]) { if (!gap) pre.appendChild(h('div', 'wm-diff-line wm-diff-gap', '⋯')); gap = true; return; }
        gap = false;
        pre.appendChild(h('div', { class: 'wm-diff-line wm-diff-' + o.t, 'aria-label': o.t === 'add' ? 'added' : o.t === 'del' ? 'removed' : null },
          h('span', { class: 'wm-diff-sign', 'aria-hidden': 'true' }, sign[o.t]), o.s));
      });
    }
    el.appendChild(h('div', 'wm-code wm-diff', h('div', 'wm-code-head', h('span', null, data.title || 'diff'),
      h('span', null, h('span', 'wm-diff-count', '+' + adds), ' ', h('span', 'wm-diff-count', '−' + dels))), pre));
  }
});
