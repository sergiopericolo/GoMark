/*
 * polar — curves r = f(t) on polar rings.
 *   ```wimark-polar {"turns": 1}
 *   ["1 + cos(t)", "sin(3t)"]
 *   ```
 */
WiMark.register('polar', {
  title: 'Polar plot',
  description: 'Curves r = f(t) over one or more turns on polar rings and spokes: roses, cardioids, spirals.',
  example: { opts: { turns: 1 }, body: ['1 + cos(t)', 'abs(sin(3t))'] },
  mount: function (el, v) {
    var W = WiMark, svg = W.svg;
    var exprs = W.list(v.r || v.items).map(String), turns = Math.max(0.25, W.num(v.turns, 1)), n = 720 * turns;
    var curves = exprs.map(function (e) {
      var f = W.math.compile(e, ['t']), pts = [];
      for (var i = 0; i <= n; i++) { var t = (2 * Math.PI * turns * i) / n, r = f(t); pts.push(isFinite(r) ? [r * Math.cos(t), r * Math.sin(t)] : null); }
      return pts;
    });
    var R = Math.max.apply(null, [].concat.apply([], curves).filter(Boolean).map(function (p) { return Math.hypot(p[0], p[1]); }).concat([1]));
    var size = W.num(v.size, 360), c = W.chart(el, { width: size, height: size, margin: { top: 10, right: 10, bottom: 10, left: 10 }, label: 'polar plot' });
    c.svg.style.maxWidth = size + 'px';
    var cx = c.w / 2, cy = c.h / 2, k = (Math.min(cx, cy) - 14) / R;
    W.ticks(0, R, 4).forEach(function (r) {
      if (r <= 0) return;
      c.add(svg('circle', { cx: cx, cy: cy, r: r * k, class: 'wm-ring' }));
      c.add(svg('text', { x: cx + 3, y: cy - r * k - 3, text: W.fmt(r) }));
    });
    for (var a = 0; a < 12; a++) {
      var ang = (a * Math.PI) / 6;
      c.add(svg('line', { x1: cx, y1: cy, x2: cx + R * k * Math.cos(ang), y2: cy - R * k * Math.sin(ang), class: 'wm-gridline' }));
    }
    curves.forEach(function (pts, i) {
      var d = '', pen = false;
      pts.forEach(function (p) { if (!p) { pen = false; return; } d += (pen ? ' L' : ' M') + (cx + p[0] * k).toFixed(2) + ',' + (cy - p[1] * k).toFixed(2); pen = true; });
      c.add(svg('path', { d: d, class: 'wm-line ' + W.series(i), 'data-tip': 'r = ' + exprs[i] }));
    });
    el.appendChild(W.legend(exprs.map(function (e, i) { return { label: '`r = ' + e + '`', i: i }; }), 'line'));
  }
});
