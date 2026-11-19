/*
 * plot — y = f(x) for one or more expressions (parsed safely, never eval'd).
 *   ```wimark-plot {"x": [-6.28, 6.28], "y": [-2, 2]}
 *   ["sin(x)", "x^2/10 - 1"]
 *   ```
 *   or ```wimark-plot {"fn": "exp(-x^2)"} · "points": [[0, 1, "max"]]
 *   functions: sin cos tan asin acos atan sinh cosh tanh sqrt cbrt abs exp ln log log2 floor ceil round sign min max pow hypot · pi e tau phi
 */
WiMark.register('plot', {
  title: 'Function plot',
  description: 'Plot expressions of x with gaps at discontinuities; ranges accept "2pi"; marked points.',
  example: { opts: { x: ['-2pi', '2pi'], y: [-2, 2], points: [[0, 1, 'cos 0']] }, body: ['sin(x)', 'cos(x)', 'tan(x)/4'] },
  mount: function (el, v) {
    var W = WiMark, svg = W.svg, V = W.math.value;
    var exprs = W.list(v.fn || v.items).map(String);
    var fns = exprs.map(function (e) { return W.math.compile(e, ['x']); });
    var xr = W.list(v.x), x0 = V(xr[0], -10), x1 = V(xr[1], 10);
    var ys = [];
    fns.forEach(function (f) { for (var i = 0; i <= 200; i++) { var y = f(x0 + ((x1 - x0) * i) / 200); if (isFinite(y)) ys.push(y); } });
    var yr = W.list(v.y), ext = W.extent(ys);
    var c = W.chart(el, { height: W.num(v.height, 300), label: 'plot of ' + exprs.join(', ') });
    var x = W.scale.linear([x0, x1], [0, c.w]), y = W.scale.linear([V(yr[0], ext[0]), V(yr[1], ext[1])], [c.h, 0]);
    c.axisY(y);
    c.axisXLinear(x);
    var clip = W.uid('clip');
    c.add(svg('clipPath', { id: clip }, svg('rect', { x: 0, y: 0, width: c.w, height: c.h })));
    fns.forEach(function (f, i) {
      c.add(svg('path', { d: W.plotPath(f, x0, x1, x, y, W.num(v.samples, 600)), class: 'wm-line ' + W.series(i), 'clip-path': 'url(#' + clip + ')', 'data-tip': 'y = ' + exprs[i] }));
    });
    W.list(v.points).forEach(function (p) {
      var px = x(V(p[0], 0)), py = y(V(p[1], 0));
      c.add(svg('circle', { cx: px, cy: py, r: 4, class: 'wm-dot wm-s-other', 'data-tip': (p[2] ? p[2] + ': ' : '') + '(' + W.fmt(V(p[0], 0)) + ', ' + W.fmt(V(p[1], 0)) + ')' }));
      if (p[2]) c.add(svg('text', { x: px + 7, y: py - 7, class: 'wm-value', text: p[2] }));
    });
    el.appendChild(W.legend(exprs.map(function (e, i) { return { label: '`y = ' + e + '`', i: i }; }), 'line'));
  }
});
