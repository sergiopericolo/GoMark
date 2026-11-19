/*
 * complex — complex numbers on the Argand plane with modulus and argument.
 *   ```wimark-complex
 *   [["z", "3+2i"], ["\\bar z", "3-2i"], ["iz", "-2+3i"]]
 *   ```
 */
WiMark.register('complex', {
  title: 'Complex plane',
  description: 'Complex numbers "a+bi" on the Argand plane, with |z| and arg z listed.',
  example: { opts: { circle: true }, body: [['z', '3+2i'], ['\\bar z', '3-2i'], ['iz', '-2+3i'], ['z^2', '5+12i']] },
  mount: function (el, v) {
    var W = WiMark, h = W.h, svg = W.svg;
    function parse(s) {
      if (Array.isArray(s)) return [W.num(s[0]), W.num(s[1])];
      var t = String(s).replace(/\s+/g, '').replace(/^\+/, ''), m = /^([-+]?[\d.]+(?:e[-+]?\d+)?)?(?:([-+])([\d.]*)i)?$/.exec(t), mi = /^([-+]?[\d.]*)i$/.exec(t);
      if (mi) return [0, mi[1] === '' || mi[1] === '+' ? 1 : mi[1] === '-' ? -1 : parseFloat(mi[1])];
      if (!m) throw new Error('not a complex number: ' + s);
      return [m[1] ? parseFloat(m[1]) : 0, m[2] ? (m[2] === '-' ? -1 : 1) * (m[3] === '' ? 1 : parseFloat(m[3])) : 0];
    }
    var zs = W.rows(v.items, ['name', 'z']).map(function (r) { var p = parse(r.z); return { name: r.name, re: p[0], im: p[1], r: Math.hypot(p[0], p[1]), a: Math.atan2(p[1], p[0]) }; });
    var R = Math.ceil(Math.max.apply(null, zs.map(function (z) { return Math.max(Math.abs(z.re), Math.abs(z.im)); }).concat([1])) + 1);
    var size = W.num(v.size, 340), c = W.chart(el, { width: size, height: size, margin: { top: 10, right: 10, bottom: 26, left: 30 }, label: 'complex plane' });
    c.svg.style.maxWidth = size + 'px';
    var x = W.scale.linear([-R, R], [0, c.w]), y = W.scale.linear([-R, R], [c.h, 0]);
    c.axisY(y);
    c.axisXLinear(x);
    c.add(svg('text', { x: c.w - 4, y: y(0) - 6, 'text-anchor': 'end', text: 'Re' }));
    c.add(svg('text', { x: x(0) + 6, y: 12, text: 'Im' }));
    if (v.circle) c.add(svg('circle', { cx: x(0), cy: y(0), r: x(1) - x(0), class: 'wm-ring wm-guide' }));
    zs.forEach(function (z, i) {
      c.add(svg('line', { x1: x(0), y1: y(0), x2: x(z.re), y2: y(z.im), class: 'wm-vector ' + W.series(i) }));
      c.add(svg('circle', { cx: x(z.re), cy: y(z.im), r: 4, class: 'wm-dot ' + W.series(i), 'data-tip': z.name + ' = ' + W.fmt(z.re) + (z.im < 0 ? ' − ' : ' + ') + W.fmt(Math.abs(z.im)) + 'i' }));
    });
    el.appendChild(W.table(['', 'a + bi', '|z|', 'arg z'], zs.map(function (z) {
      return [W.tex(z.name), W.tex(W.fmt(z.re) + (z.im < 0 ? ' - ' : ' + ') + W.fmt(Math.abs(z.im)) + 'i'), W.fmt(z.r, { maximumFractionDigits: 4 }), W.fmt((z.a * 180) / Math.PI, { maximumFractionDigits: 2 }) + '°'];
    }), { align: ['center', 'left', 'right', 'right'] }));
  }
});
