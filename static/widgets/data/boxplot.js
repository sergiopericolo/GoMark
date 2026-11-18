/*
 * boxplot — quartiles, whiskers (1.5 IQR) and outliers per group.
 * data:   [{ "label", "values": [] }]
 * config: { "height": 260, "points": false }
 */
WiMark.register('boxplot', {
  title: 'Box plot',
  description: 'Median, quartiles, whiskers and outliers for several groups side by side.',
  example: {
    data: [
      { label: 'en', values: [120, 135, 128, 140, 150, 132, 129, 300] },
      { label: 'it', values: [90, 110, 105, 98, 120, 101, 99, 95] },
      { label: 'de', values: [60, 75, 80, 72, 68, 90, 85, 20] }
    ],
    config: { height: 260, points: false }
  },
  mount: function (el, data, config) {
    var W = WiMark, svg = W.svg;
    function q(s, p) { var i = (s.length - 1) * p, lo = Math.floor(i); return s[lo] + (s[Math.ceil(i)] - s[lo]) * (i - lo); }
    var groups = W.list(data).map(function (g) {
      var s = W.list(g.values).map(Number).filter(isFinite).sort(function (a, b) { return a - b; });
      var q1 = q(s, 0.25), q2 = q(s, 0.5), q3 = q(s, 0.75), iqr = q3 - q1;
      var inside = s.filter(function (v) { return v >= q1 - 1.5 * iqr && v <= q3 + 1.5 * iqr; });
      return { label: g.label, s: s, q1: q1, q2: q2, q3: q3, lo: inside[0], hi: inside[inside.length - 1], out: s.filter(function (v) { return inside.indexOf(v) < 0; }) };
    });
    var c = W.chart(el, { height: W.num(config.height, 260), label: 'box plot' });
    var y = W.scale.linear(W.extent([].concat.apply([], groups.map(function (g) { return g.s; }))), [c.h, 0], true);
    var band = W.scale.band(groups.map(function (g) { return g.label; }), [0, c.w], 0.5);
    c.axisY(y);
    groups.forEach(function (g, i) {
      var b = band(i), cx = b.x + b.w / 2, cls = W.series(0);
      var tip = g.label + ' · median ' + W.fmt(g.q2) + ' · Q1 ' + W.fmt(g.q1) + ' · Q3 ' + W.fmt(g.q3);
      c.add(svg('line', { x1: cx, x2: cx, y1: y(g.lo), y2: y(g.q3), class: 'wm-stroke-ink' }));
      c.add(svg('line', { x1: cx, x2: cx, y1: y(g.q1), y2: y(g.hi), class: 'wm-stroke-ink' }));
      [g.lo, g.hi].forEach(function (v) { c.add(svg('line', { x1: cx - b.w / 4, x2: cx + b.w / 4, y1: y(v), y2: y(v), class: 'wm-stroke-ink' })); });
      c.add(svg('rect', { x: b.x, y: y(g.q3), width: b.w, height: Math.max(1, y(g.q1) - y(g.q3)), rx: 3, class: 'wm-mark ' + cls, 'data-tip': tip }));
      c.add(svg('line', { x1: b.x, x2: b.x + b.w, y1: y(g.q2), y2: y(g.q2), class: 'wm-median' }));
      g.out.forEach(function (v) { c.add(svg('circle', { cx: cx, cy: y(v), r: 4, class: 'wm-outline', 'data-tip': g.label + ' · outlier ' + W.fmt(v) })); });
      if (config.points) g.s.forEach(function (v, k) { c.add(svg('circle', { cx: cx + ((k % 5) - 2) * 3, cy: y(v), r: 2, class: 'wm-ink' })); });
    });
    c.axisX(groups.map(function (g) { return g.label; }), function (i) { return band(i).x + band(i).w / 2; });
    W.dataTable(el, ['', 'min', 'Q1', 'median', 'Q3', 'max'], groups.map(function (g) { return [g.label, g.s[0], g.q1, g.q2, g.q3, g.s[g.s.length - 1]]; }));
  }
});
