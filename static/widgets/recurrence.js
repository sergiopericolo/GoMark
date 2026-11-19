/*
 * recurrence — the first terms of a recurrence, listed and plotted.
 *   ```wimark-recurrence {"rule": "a + b", "init": [0, 1], "n": 15, "tex": "F_n = F_{n-1} + F_{n-2}"}
 *   ```
 *   In the rule: a = previous term, b = the one before, c = three back, n = index.
 */
WiMark.register('recurrence', {
  title: 'Recurrence',
  description: 'Terms of a recurrence (a = previous term, b = the one before, n = index), as a list and a chart.',
  example: { opts: { rule: 'a + b', init: [0, 1], n: 16, tex: 'F_n = F_{n-1} + F_{n-2},\\quad F_0 = 0,\\ F_1 = 1' } },
  mount: function (el, v) {
    var W = WiMark, h = W.h, svg = W.svg;
    var f = W.math.compile(String(v.rule || 'a'), ['n', 'a', 'b', 'c']), seq = W.list(v.init).map(Number);
    var N = Math.max(seq.length, Math.min(200, W.num(v.n, 15)));
    for (var k = seq.length; k < N; k++) seq.push(f(k, seq[k - 1], seq[k - 2], seq[k - 3]));
    if (v.tex) el.appendChild(h('div', 'wm-eq', h('div', 'wm-eq-body', W.tex(v.tex, true))));
    el.appendChild(h('div', 'wm-seq', seq.map(function (x, i) { return h('span', { class: 'wm-seq-term', title: 'a(' + i + ')' }, h('sub', null, String(i)), W.fmt(x, { maximumFractionDigits: 6 })); })));
    if (v.chart === false) return;
    var c = W.chart(el, { height: W.num(v.height, 200), label: 'recurrence terms' });
    var finite = seq.filter(isFinite), ext = W.extent(finite.concat([0]));
    var x = W.scale.linear([0, N - 1], [0, c.w]), y = W.scale.linear(ext, [c.h, 0], true);
    c.axisY(y);
    c.axisXLinear(x, { format: function (t) { return W.fmt(t); } });
    c.add(svg('path', { d: 'M' + seq.map(function (s, i) { return x(i) + ',' + y(isFinite(s) ? s : 0); }).join(' L'), class: 'wm-line wm-s1' }));
    seq.forEach(function (s, i) { if (isFinite(s)) c.add(svg('circle', { cx: x(i), cy: y(s), r: 3.5, class: 'wm-dot wm-s1', 'data-tip': 'a(' + i + ') = ' + W.fmt(s) })); });
  }
});
