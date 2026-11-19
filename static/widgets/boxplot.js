/*
 * boxplot — median, quartiles, whiskers (1.5 IQR) and outliers per group.
 *   ```wimark-boxplot {"unit": "ms"}
 *   {"v1": [12, 15, 11, 30], "v2": [9, 10, 12, 11]}
 *   ```
 */
WiMark.register('boxplot', {
  title: 'Box plot',
  description: 'Groups side by side: median, quartiles, whiskers at 1.5 IQR and outliers as dots.',
  example: { opts: { unit: 'ms' }, body: { 'go 1.22': [48, 52, 47, 61, 50, 49, 55, 58, 46, 51, 90], 'go 1.23': [41, 44, 40, 47, 43, 45, 42, 49, 46, 44], 'go 1.24': [33, 35, 31, 36, 34, 38, 32, 37, 35, 60] } },
  mount: function (el, v) {
    var W = WiMark, svg = W.svg;
    var names = Object.keys(v).filter(function (k) { return Array.isArray(v[k]); });
    var q = function (s, p) { var i = (s.length - 1) * p, lo = Math.floor(i); return s[lo] + (s[Math.min(lo + 1, s.length - 1)] - s[lo]) * (i - lo); };
    var G = names.map(function (n) {
      var s = v[n].map(Number).filter(isFinite).sort(function (a, b) { return a - b; }), q1 = q(s, 0.25), q3 = q(s, 0.75), iqr = q3 - q1;
      var inl = s.filter(function (x) { return x >= q1 - 1.5 * iqr && x <= q3 + 1.5 * iqr; });
      return { n: n, s: s, q1: q1, med: q(s, 0.5), q3: q3, lo: inl[0], hi: inl[inl.length - 1], out: s.filter(function (x) { return inl.indexOf(x) < 0; }) };
    });
    var c = W.chart(el, { height: W.num(v.height, 280), label: 'box plot' });
    var y = W.scale.linear(W.extent([].concat.apply([], G.map(function (g) { return g.s; }))), [c.h, 0], true), band = W.scale.band(names, [0, c.w], 0.5);
    c.axisY(y);
    G.forEach(function (g, i) {
      var b = band(i), cx = b.x + b.w / 2, cls = W.series(i), tip = g.n + ': median ' + W.fmt(g.med) + ', IQR ' + W.fmt(g.q1) + '–' + W.fmt(g.q3) + (v.unit ? ' ' + v.unit : '');
      c.add(svg('line', { x1: cx, x2: cx, y1: y(g.hi), y2: y(g.q3), class: 'wm-stroke-ink' }));
      c.add(svg('line', { x1: cx, x2: cx, y1: y(g.q1), y2: y(g.lo), class: 'wm-stroke-ink' }));
      [g.lo, g.hi].forEach(function (t) { c.add(svg('line', { x1: cx - b.w / 4, x2: cx + b.w / 4, y1: y(t), y2: y(t), class: 'wm-stroke-ink' })); });
      c.add(svg('rect', { x: b.x, y: y(g.q3), width: b.w, height: Math.max(1, y(g.q1) - y(g.q3)), rx: 3, class: 'wm-mark ' + cls, 'data-tip': tip }));
      c.add(svg('line', { x1: b.x, x2: b.x + b.w, y1: y(g.med), y2: y(g.med), class: 'wm-median' }));
      g.out.forEach(function (o) { c.add(svg('circle', { cx: cx, cy: y(o), r: 3.5, class: 'wm-dot-open ' + cls, 'data-tip': g.n + ' outlier: ' + W.fmt(o) })); });
    });
    c.axisX(names, function (i) { return band(i).x + band(i).w / 2; });
  }
});
