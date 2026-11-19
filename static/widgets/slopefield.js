/*
 * slopefield — the direction field of dy/dx = f(x, y) with solution curves (RK4).
 *   ```wimark-slopefield {"f": "x - y", "x": [-3, 3], "y": [-3, 3], "through": [[0, 1], [0, -2]]}
 *   ```
 */
WiMark.register('slopefield', {
  title: 'Slope field',
  description: 'The direction field of an ODE dy/dx = f(x, y); "through" draws solutions through points (RK4).',
  example: { opts: { f: 'x - y', x: [-3, 3], y: [-3, 3], through: [[-3, 2], [0, 0], [-1, -3], [-3, -1]] } },
  mount: function (el, v) {
    var W = WiMark, svg = W.svg, V = W.math.value;
    var f = W.math.compile(String(v.f || 'x'), ['x', 'y']);
    var xr = W.list(v.x), yr = W.list(v.y), x0 = V(xr[0], -3), x1 = V(xr[1], 3), y0 = V(yr[0], -3), y1 = V(yr[1], 3);
    var c = W.chart(el, { height: W.num(v.height, 340), label: 'slope field of dy/dx = ' + v.f });
    var x = W.scale.linear([x0, x1], [0, c.w]), y = W.scale.linear([y0, y1], [c.h, 0]);
    c.axisY(y);
    c.axisXLinear(x);
    var n = Math.max(8, Math.min(40, W.num(v.n, 21))), step = c.w / n, rows = Math.round(c.h / step), half = step * 0.33;
    for (var i = 0; i < n; i++) for (var j = 0; j < rows; j++) {
      var px = (i + 0.5) * step, py = ((j + 0.5) * c.h) / rows, s = f(x.invert(px), y.invert(py));
      if (!isFinite(s)) continue;
      var ang = Math.atan(-s * (c.h / (y1 - y0)) / (c.w / (x1 - x0)));
      c.add(svg('line', { x1: px - half * Math.cos(ang), y1: py - half * Math.sin(ang), x2: px + half * Math.cos(ang), y2: py + half * Math.sin(ang), class: 'wm-slope' }));
    }
    var clip = W.uid('clip');
    c.add(svg('clipPath', { id: clip }, svg('rect', { x: 0, y: 0, width: c.w, height: c.h })));
    W.list(v.through).forEach(function (p, k) {
      var pts = [];
      [1, -1].forEach(function (dir) {
        var X = V(p[0], 0), Y = V(p[1], 0), hh = (dir * (x1 - x0)) / 400, side = [];
        for (var t = 0; t < 400 && X >= x0 - 1e-9 && X <= x1 + 1e-9 && isFinite(Y) && Math.abs(Y) < 1e6; t++) {
          side.push([X, Y]);
          var k1 = f(X, Y), k2 = f(X + hh / 2, Y + (hh * k1) / 2), k3 = f(X + hh / 2, Y + (hh * k2) / 2), k4 = f(X + hh, Y + hh * k3);
          Y += (hh * (k1 + 2 * k2 + 2 * k3 + k4)) / 6;
          X += hh;
        }
        pts = dir > 0 ? side : side.slice(1).reverse().concat(pts);
      });
      c.add(svg('path', { d: 'M' + pts.map(function (q) { return x(q[0]).toFixed(1) + ',' + y(q[1]).toFixed(1); }).join(' L'), class: 'wm-line ' + W.series(k), 'clip-path': 'url(#' + clip + ')' }));
      c.add(svg('circle', { cx: x(V(p[0], 0)), cy: y(V(p[1], 0)), r: 4, class: 'wm-dot ' + W.series(k), 'data-tip': 'y(' + p[0] + ') = ' + p[1] }));
    });
    el.appendChild(W.h('p', 'wm-muted wm-small', W.inline('$\\dfrac{dy}{dx} = ' + v.f + '$')));
  }
});
