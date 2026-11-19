/*
 * vectorfield — arrows of a 2D field (dx, dy), shaded by magnitude.
 *   ```wimark-vectorfield {"dx": "-y", "dy": "x", "x": [-3, 3], "y": [-3, 3], "n": 15}
 *   ```
 */
WiMark.register('vectorfield', {
  title: 'Vector field',
  description: 'A 2D vector field F(x, y) = (dx, dy) as arrows of equal length, shaded by magnitude.',
  example: { opts: { dx: 'y', dy: 'sin(x) - y/3', x: [-4, 4], y: [-3, 3], n: 17 } },
  mount: function (el, v) {
    var W = WiMark, svg = W.svg, V = W.math.value;
    var fx = W.math.compile(String(v.dx || 'x'), ['x', 'y']), fy = W.math.compile(String(v.dy || 'y'), ['x', 'y']);
    var xr = W.list(v.x), yr = W.list(v.y), x0 = V(xr[0], -3), x1 = V(xr[1], 3), y0 = V(yr[0], -3), y1 = V(yr[1], 3);
    var n = Math.max(5, Math.min(40, W.num(v.n, 15)));
    var c = W.chart(el, { height: W.num(v.height, 340), label: 'vector field' });
    var x = W.scale.linear([x0, x1], [0, c.w]), y = W.scale.linear([y0, y1], [c.h, 0]);
    c.axisY(y);
    c.axisXLinear(x);
    var cells = [], mmax = 0, step = c.w / n, rows = Math.max(3, Math.round(c.h / step));
    for (var i = 0; i < n; i++) for (var j = 0; j < rows; j++) {
      var px = (i + 0.5) * step, py = ((j + 0.5) * c.h) / rows, a = x.invert(px), b = y.invert(py), u = fx(a, b), w = fy(a, b), m = Math.hypot(u, w);
      if (isFinite(m)) { cells.push([px, py, u, w, m, a, b]); mmax = Math.max(mmax, m); }
    }
    var len = step * 0.38;
    cells.forEach(function (q) {
      var k = q[4] ? len / q[4] : 0, dx = q[2] * k, dy = -q[3] * k, heat = 'wm-h' + Math.min(4, Math.floor((5 * q[4]) / (mmax || 1)));
      c.add(svg('line', { x1: q[0] - dx, y1: q[1] - dy, x2: q[0] + dx, y2: q[1] + dy, class: 'wm-arrow-line wm-edge-arrow ' + heat,
        'data-tip': 'F(' + W.fmt(q[5]) + ', ' + W.fmt(q[6]) + ') = (' + W.fmt(q[2]) + ', ' + W.fmt(q[3]) + ')' }));
    });
    el.appendChild(W.h('p', 'wm-muted wm-small', W.inline('`F(x, y) = (' + v.dx + ', ' + v.dy + ')` · darker = stronger')));
  }
});
