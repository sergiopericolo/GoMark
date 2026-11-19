/*
 * unitcircle — angles on the unit circle with their sine and cosine.
 *   ```wimark-unitcircle {"angles": [30, 45, 60, 120]}
 *   ```
 */
WiMark.register('unitcircle', {
  title: 'Unit circle',
  description: 'Angles (degrees) on the unit circle with cos and sin projections and a value table.',
  example: { opts: { angles: [30, 45, 60, 135] } },
  mount: function (el, v) {
    var W = WiMark, svg = W.svg;
    var angles = W.list(v.angles).map(Number), size = W.num(v.size, 340);
    var c = W.chart(el, { width: size, height: size, margin: { top: 14, right: 14, bottom: 14, left: 14 }, label: 'unit circle' });
    c.svg.style.maxWidth = size + 'px';
    var cx = c.w / 2, cy = c.h / 2, R = Math.min(cx, cy) - 16;
    c.add(svg('line', { x1: 0, x2: c.w, y1: cy, y2: cy, class: 'wm-baseline' }));
    c.add(svg('line', { x1: cx, x2: cx, y1: 0, y2: c.h, class: 'wm-baseline' }));
    c.add(svg('circle', { cx: cx, cy: cy, r: R, class: 'wm-ring wm-geo-line' }));
    [[1, 0, '1'], [-1, 0, '−1'], [0, 1, '1'], [0, -1, '−1']].forEach(function (p) { c.add(svg('text', { x: cx + p[0] * (R + 8) + (p[0] ? 0 : 6), y: cy - p[1] * (R + 6) + 4, 'text-anchor': p[0] < 0 ? 'end' : 'start', text: p[2] })); });
    angles.forEach(function (d, i) {
      var a = (d * Math.PI) / 180, px = cx + R * Math.cos(a), py = cy - R * Math.sin(a), cls = W.series(i);
      c.add(svg('line', { x1: cx, y1: cy, x2: px, y2: py, class: 'wm-vector ' + cls }));
      c.add(svg('line', { x1: px, y1: py, x2: px, y2: cy, class: 'wm-guide' }));
      c.add(svg('line', { x1: px, y1: py, x2: cx, y2: py, class: 'wm-guide' }));
      c.add(svg('circle', { cx: px, cy: py, r: 4, class: 'wm-dot ' + cls, 'data-tip': d + '°: cos ' + W.fmt(Math.cos(a), { maximumFractionDigits: 4 }) + ', sin ' + W.fmt(Math.sin(a), { maximumFractionDigits: 4 }) }));
      c.add(svg('text', { x: cx + (R + 18) * Math.cos(a), y: cy - (R + 18) * Math.sin(a) + 4, 'text-anchor': 'middle', class: 'wm-value', text: d + '°' }));
    });
    var exact = { 0: ['1', '0'], 30: ['\\frac{\\sqrt3}{2}', '\\frac12'], 45: ['\\frac{\\sqrt2}{2}', '\\frac{\\sqrt2}{2}'], 60: ['\\frac12', '\\frac{\\sqrt3}{2}'], 90: ['0', '1'] };
    el.appendChild(W.table(['θ', 'rad', 'cos θ', 'sin θ', 'tan θ'], angles.map(function (d) {
      var a = (d * Math.PI) / 180, ref = ((d % 360) + 360) % 360, q = ref % 180 <= 90 ? ref % 180 : 180 - (ref % 180), e = exact[q];
      var sgn = function (val, s) { return (val < -1e-12 ? '-' : '') + s; };
      return [d + '°', W.tex(W.fmt(d / 180, { maximumFractionDigits: 3 }) + '\\pi'), e ? W.tex(sgn(Math.cos(a), e[0])) : W.fmt(Math.cos(a), { maximumFractionDigits: 4 }), e ? W.tex(sgn(Math.sin(a), e[1])) : W.fmt(Math.sin(a), { maximumFractionDigits: 4 }), Math.abs(Math.cos(a)) < 1e-12 ? '—' : W.fmt(Math.tan(a), { maximumFractionDigits: 4 })];
    }), { align: ['right', 'right', 'center', 'center', 'right'] }));
  }
});
