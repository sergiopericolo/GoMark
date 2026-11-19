/*
 * parametric — curves (x(t), y(t)) at equal scale on both axes.
 *   ```wimark-parametric {"t": [0, "2pi"]}
 *   [["cos(3t)", "sin(2t)"]]
 *   ```
 *   or ```wimark-parametric {"x": "cos(t)^3", "y": "sin(t)^3"}
 */
WiMark.register('parametric', {
  title: 'Parametric curve',
  description: 'Curves x(t), y(t) — Lissajous, cycloids, astroids — drawn at equal scale.',
  example: { opts: { t: [0, '2pi'] }, body: [['cos(3t)', 'sin(2t)'], ['cos(t)^3', 'sin(t)^3']] },
  mount: function (el, v) {
    var W = WiMark, svg = W.svg, V = W.math.value;
    var pairs = v.x ? [[v.x, v.y]] : W.list(v.items);
    var tr = W.list(v.t), t0 = V(tr[0], 0), t1 = V(tr[1], 2 * Math.PI), n = W.num(v.samples, 800);
    var curves = pairs.map(function (p) {
      var fx = W.math.compile(String(p[0]), ['t']), fy = W.math.compile(String(p[1]), ['t']), pts = [];
      for (var i = 0; i <= n; i++) { var t = t0 + ((t1 - t0) * i) / n, a = fx(t), b = fy(t); if (isFinite(a) && isFinite(b)) pts.push([a, b]); }
      return pts;
    });
    var all = [].concat.apply([], curves);
    var ex = W.extent(all.map(function (p) { return p[0]; })), ey = W.extent(all.map(function (p) { return p[1]; }));
    var span = Math.max(ex[1] - ex[0], ey[1] - ey[0]) * 1.1, mx = (ex[0] + ex[1]) / 2, my = (ey[0] + ey[1]) / 2;
    var size = W.num(v.size, 360);
    var c = W.chart(el, { width: size + 60, height: size + 40, label: 'parametric curve' });
    c.svg.style.maxWidth = (size + 60) + 'px';
    var x = W.scale.linear([mx - span / 2, mx + span / 2], [0, c.w]), y = W.scale.linear([my - span / 2, my + span / 2], [c.h, 0]);
    c.axisY(y, { ticks: 4 });
    c.axisXLinear(x, { ticks: 4 });
    curves.forEach(function (pts, i) {
      c.add(svg('path', { d: 'M' + pts.map(function (p) { return x(p[0]).toFixed(2) + ',' + y(p[1]).toFixed(2); }).join(' L'), class: 'wm-line ' + W.series(i), 'data-tip': '(' + pairs[i][0] + ', ' + pairs[i][1] + ')' }));
    });
    el.appendChild(W.legend(pairs.map(function (p, i) { return { label: '`(' + p[0] + ', ' + p[1] + ')`', i: i }; }), 'line'));
  }
});
