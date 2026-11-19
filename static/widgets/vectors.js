/*
 * vectors — 2D vectors as arrows on a grid, from the origin or from a point.
 *   ```wimark-vectors
 *   [["u", [3, 1]], ["v", [1, 2]], ["u+v", [4, 3]], ["v", [1, 2], [3, 1], "dashed"]]
 *   ```
 */
WiMark.register('vectors', {
  title: 'Vectors',
  description: 'Vectors as arrows on a square grid: [name, [x, y], from?, "dashed"?] — sums, projections, bases.',
  example: { body: [['u', [3, 1]], ['v', [1, 2]], ['u + v', [4, 3]], ['v', [1, 2], [3, 1], 'dashed'], ['u', [3, 1], [1, 2], 'dashed']] },
  mount: function (el, v) {
    var W = WiMark, svg = W.svg;
    var vs = W.rows(v.items, ['name', 'to', 'from', 'style']).map(function (r) { var f = W.list(r.from).length ? r.from : [0, 0]; return { name: r.name, f: [W.num(f[0]), W.num(f[1])], t: [W.num(f[0]) + W.num(r.to[0]), W.num(f[1]) + W.num(r.to[1])], d: r.to, dashed: r.style === 'dashed' || r.from === 'dashed' }; });
    var xs = [0], ys = [0];
    vs.forEach(function (q) { xs.push(q.f[0], q.t[0]); ys.push(q.f[1], q.t[1]); });
    var lo = Math.floor(Math.min(Math.min.apply(null, xs), Math.min.apply(null, ys))) - 1, hi = Math.ceil(Math.max(Math.max.apply(null, xs), Math.max.apply(null, ys))) + 1;
    var size = W.num(v.size, 360), c = W.chart(el, { width: size, height: size, margin: { top: 10, right: 10, bottom: 26, left: 30 }, label: 'vectors' });
    c.svg.style.maxWidth = size + 'px';
    var x = W.scale.linear([lo, hi], [0, c.w]), y = W.scale.linear([lo, hi], [c.h, 0]);
    c.axisY(y);
    c.axisXLinear(x);
    var named = {};
    vs.forEach(function (q) {
      if (!(q.name in named)) named[q.name] = Object.keys(named).length;
      var cls = W.series(named[q.name]);
      c.add(svg('line', { x1: x(q.f[0]), y1: y(q.f[1]), x2: x(q.t[0]), y2: y(q.t[1]), class: 'wm-vector ' + cls + (q.dashed ? ' wm-vector-dash' : ''), 'data-tip': q.name + ' = (' + W.fmt(q.d[0]) + ', ' + W.fmt(q.d[1]) + ')' }));
      if (!q.dashed) c.add(svg('text', { x: (x(q.f[0]) + x(q.t[0])) / 2 + 6, y: (y(q.f[1]) + y(q.t[1])) / 2 - 6, class: 'wm-value', text: q.name }));
    });
    el.appendChild(W.legend(Object.keys(named).map(function (n) { var q = vs.filter(function (z) { return z.name === n; })[0]; return { label: n + ' = (' + W.fmt(q.d[0]) + ', ' + W.fmt(q.d[1]) + ')', i: named[n] }; })));
  }
});
