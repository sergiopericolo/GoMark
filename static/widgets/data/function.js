/*
 * function — plots y = f(x) for one or more expressions (safe parser, no eval).
 * data:   { "functions": ["sin(x)", "x^2/4", …] }
 * config: { "x_min": -6.28, "x_max": 6.28, "y_min"?, "y_max"?, "samples": 400, "height": 300 }
 *         functions: sin cos tan asin acos atan sinh cosh tanh sqrt cbrt abs exp ln log log2 floor ceil round sign min max pow hypot · constants pi e tau phi
 */
WiMark.register('function', {
  title: 'Function plot',
  description: 'Plot math expressions of x — parsed safely, never evaluated as code; gaps at discontinuities.',
  example: {
    data: { functions: ['sin(x)', 'cos(x)/2', 'x^2/10 - 1'] },
    config: { x_min: -6.28, x_max: 6.28, y_min: -2, y_max: 2, samples: 400, height: 300 }
  },
  mount: function (el, data, config) {
    var W = WiMark, svg = W.svg;
    var exprs = W.list(data.functions || data.function || data);
    var fns = exprs.map(function (e) { return W.math.compile(e, ['x']); });
    var x0 = W.num(config.x_min, -10), x1 = W.num(config.x_max, 10), n = Math.max(20, Math.min(4000, W.num(config.samples, 400)));
    var curves = fns.map(function (f) {
      var pts = [];
      for (var i = 0; i <= n; i++) { var xv = x0 + ((x1 - x0) * i) / n, yv = f(xv); pts.push([xv, isFinite(yv) ? yv : NaN]); }
      return pts;
    });
    var ys = [].concat.apply([], curves.map(function (p) { return p.map(function (q) { return q[1]; }); })).filter(isFinite);
    var ext = W.extent(ys);
    var y0 = config.y_min !== undefined ? W.num(config.y_min) : ext[0], y1 = config.y_max !== undefined ? W.num(config.y_max) : ext[1];
    var c = W.chart(el, { height: W.num(config.height, 300), margin: { right: 16 }, label: 'function plot' });
    var x = W.scale.linear([x0, x1], [0, c.w]), y = W.scale.linear([y0, y1], [c.h, 0]);
    c.axisY(y);
    c.axisXLinear(x);
    var clip = W.uid('clip');
    c.add(svg('clipPath', { id: clip }, svg('rect', { x: 0, y: 0, width: c.w, height: c.h })));
    curves.forEach(function (pts, si) {
      var d = '', pen = false, prev = null;
      pts.forEach(function (p) {
        var ok = isFinite(p[1]) && !(prev && isFinite(prev[1]) && Math.abs(y(p[1]) - y(prev[1])) > c.h * 2);
        if (ok) { d += (pen ? ' L' : ' M') + x(p[0]).toFixed(2) + ',' + Math.max(-c.h, Math.min(2 * c.h, y(p[1]))).toFixed(2); pen = true; }
        else pen = false;
        prev = p;
      });
      c.add(svg('path', { d: d, class: 'wm-line ' + W.series(si), 'clip-path': 'url(#' + clip + ')', 'data-tip': 'y = ' + exprs[si] }));
    });
    el.appendChild(W.legend(exprs.map(function (e, i) { return { label: '`y = ' + e + '`', i: i }; }), 'line'));
  }
});
