/*
 * numberline — intervals and points on the real line, in interval notation.
 *   ```wimark-numberline {"range": [-5, 8]}
 *   ["[-2, 3)", ["(4, inf)", "B"], [1, "x₀"]]
 *   ```
 */
WiMark.register('numberline', {
  title: 'Number line',
  description: 'Intervals in interval notation ("[a, b)", "(-inf, 2]") and labelled points on the real line.',
  example: { opts: { range: [-5, 8] }, body: [['[-3, 1)', 'A'], ['(2, inf)', 'B'], ['[0, 5]', 'C'], [1, 'x₀'], [-4.5, 'x₁']] },
  mount: function (el, v) {
    var W = WiMark, svg = W.svg;
    var items = W.list(v.items).map(function (it) { return Array.isArray(it) ? it : [it]; });
    var bands = [], points = [];
    items.forEach(function (it) {
      var m = typeof it[0] === 'string' && /^\s*([[(])\s*([-+]?(?:inf|∞|[\d.]+))\s*,\s*([-+]?(?:inf|∞|[\d.]+))\s*([\])])\s*$/.exec(it[0]);
      var num = function (s) { return /inf|∞/.test(s) ? (s.charAt(0) === '-' ? -Infinity : Infinity) : parseFloat(s); };
      if (m) bands.push({ a: num(m[2]), b: num(m[3]), ca: m[1] === '[', cb: m[4] === ']', label: it[1] || it[0], src: it[0] });
      else points.push({ x: W.num(it[0]), label: it[1] === undefined ? String(it[0]) : String(it[1]) });
    });
    var finite = [].concat(bands.map(function (b) { return b.a; }), bands.map(function (b) { return b.b; }), points.map(function (p) { return p.x; })).filter(isFinite);
    var r = W.list(v.range), ext = W.extent(finite);
    var lo = r.length ? W.num(r[0]) : Math.floor(ext[0] - 1), hi = r.length ? W.num(r[1]) : Math.ceil(ext[1] + 1);
    var rowH = 26, H = 40 + bands.length * rowH + (points.length ? 30 : 0);
    var c = W.chart(el, { height: H, margin: { top: 10, right: 24, bottom: 24, left: 24 }, label: 'number line' });
    var x = W.scale.linear([lo, hi], [0, c.w]), axisY = c.h - 4;
    c.add(svg('line', { x1: -10, x2: c.w + 10, y1: axisY, y2: axisY, class: 'wm-edge wm-edge-arrow' }));
    x.ticks(Math.min(16, hi - lo)).forEach(function (t) {
      c.add(svg('line', { x1: x(t), x2: x(t), y1: axisY - 4, y2: axisY + 4, class: 'wm-baseline' }));
      c.add(svg('text', { x: x(t), y: axisY + 17, 'text-anchor': 'middle', text: W.fmt(t) }));
    });
    bands.forEach(function (b, i) {
      var yy = 14 + i * rowH, xa = isFinite(b.a) ? x(Math.max(lo, b.a)) : -6, xb = isFinite(b.b) ? x(Math.min(hi, b.b)) : c.w + 6, cls = W.series(i);
      c.add(svg('line', { x1: xa, x2: xb, y1: yy, y2: yy, class: 'wm-band-line ' + cls, 'data-tip': b.label + ' = ' + b.src }));
      if (!isFinite(b.b)) c.add(svg('polygon', { points: [xb + 4, yy, xb - 6, yy - 6, xb - 6, yy + 6].join(' '), class: 'wm-dot ' + cls }));
      if (!isFinite(b.a)) c.add(svg('polygon', { points: [xa - 4, yy, xa + 6, yy - 6, xa + 6, yy + 6].join(' '), class: 'wm-dot ' + cls }));
      c.add(svg('line', { x1: xa, x2: xa, y1: yy, y2: axisY, class: 'wm-guide' }));
      c.add(svg('line', { x1: xb, x2: xb, y1: yy, y2: axisY, class: 'wm-guide' }));
      if (isFinite(b.a)) c.add(svg('circle', { cx: xa, cy: yy, r: 5, class: (b.ca ? 'wm-dot ' : 'wm-dot-open ') + cls }));
      if (isFinite(b.b)) c.add(svg('circle', { cx: xb, cy: yy, r: 5, class: (b.cb ? 'wm-dot ' : 'wm-dot-open ') + cls }));
      c.add(svg('text', { x: (xa + xb) / 2, y: yy - 7, 'text-anchor': 'middle', class: 'wm-value', text: b.label === b.src ? b.src : b.label + ' = ' + b.src }));
    });
    points.forEach(function (p) {
      c.add(svg('circle', { cx: x(p.x), cy: axisY, r: 5, class: 'wm-dot wm-s-other', 'data-tip': p.label + ' = ' + W.fmt(p.x) }));
      c.add(svg('text', { x: x(p.x), y: axisY - 10, 'text-anchor': 'middle', class: 'wm-value', text: p.label }));
    });
  }
});
