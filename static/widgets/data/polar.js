/*
 * polar — curves r = f(t) in polar coordinates (roses, cardioids, spirals).
 * data:   { "functions": ["1 + cos(t)", "sin(4t)"] }
 * config: { "turns": 1, "samples": 720, "rings": 4 }
 */
WiMark.register('polar', {
  title: 'Polar plot',
  description: 'Curves r = f(t) for t over one or more turns, on polar rings.',
  example: {
    data: { functions: ['1 + cos(t)', 'abs(sin(4t))', '0.1t'] },
    config: { turns: 2, samples: 900, rings: 4 }
  },
  mount: function (el, data, config) {
    var W = WiMark, svg = W.svg;
    var exprs = W.list(data.functions), fns = exprs.map(function (e) { return W.math.compile(e, ['t']); });
    var T = 2 * Math.PI * Math.max(0.25, W.num(config.turns, 1)), n = Math.max(60, Math.min(5000, W.num(config.samples, 720)));
    var curves = fns.map(function (f) { var p = []; for (var i = 0; i <= n; i++) { var t = (T * i) / n; p.push([t, f(t)]); } return p; });
    var rmax = Math.max.apply(null, [].concat.apply([0.0001], curves.map(function (p) { return p.map(function (q) { return isFinite(q[1]) ? Math.abs(q[1]) : 0; }); })));
    var c = W.chart(el, { width: 420, height: 420, margin: { top: 16, right: 16, bottom: 16, left: 16 }, label: 'polar plot' });
    c.svg.style.maxWidth = '420px';
    var cx = c.w / 2, cy = c.h / 2, R = Math.min(cx, cy), rings = Math.max(1, W.num(config.rings, 4));
    for (var k = 1; k <= rings; k++) {
      c.add(svg('circle', { cx: cx, cy: cy, r: (R * k) / rings, class: 'wm-gridline wm-ring' }));
      c.add(svg('text', { x: cx + 3, y: cy - (R * k) / rings - 3, text: W.fmt((rmax * k) / rings) }));
    }
    for (var a = 0; a < 12; a++) {
      var ang = (Math.PI * a) / 6;
      c.add(svg('line', { x1: cx, y1: cy, x2: cx + R * Math.cos(ang), y2: cy - R * Math.sin(ang), class: 'wm-gridline' }));
    }
    curves.forEach(function (pts, si) {
      var d = '', pen = false;
      pts.forEach(function (p) {
        if (!isFinite(p[1])) { pen = false; return; }
        var r = (R * p[1]) / rmax;
        d += (pen ? ' L' : ' M') + (cx + r * Math.cos(p[0])).toFixed(2) + ',' + (cy - r * Math.sin(p[0])).toFixed(2);
        pen = true;
      });
      c.add(svg('path', { d: d, class: 'wm-line ' + W.series(si), 'data-tip': 'r = ' + exprs[si] }));
    });
    el.appendChild(W.legend(exprs.map(function (e, i) { return { label: '`r = ' + e + '`', i: i }; }), 'line'));
  }
});
