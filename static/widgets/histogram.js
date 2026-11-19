/*
 * histogram — the distribution of values in equal bins, mean and median marked.
 *   ```wimark-histogram {"bins": 10, "unit": "ms"}
 *   [12, 15, 11, 18, 14, 13, 16]
 *   ```
 */
WiMark.register('histogram', {
  title: 'Histogram',
  description: 'Values counted in equal bins, with the mean and the median marked.',
  example: { opts: { bins: 12, unit: 'ms' }, body: [41, 44, 45, 46, 47, 47, 48, 48, 49, 49, 49, 50, 50, 50, 50, 51, 51, 51, 52, 52, 53, 53, 54, 55, 56, 58, 61, 64, 70, 82] },
  mount: function (el, v) {
    var W = WiMark, svg = W.svg;
    var xs = W.list(v.items).map(Number).filter(isFinite).sort(function (a, b) { return a - b; });
    var ext = W.extent(xs), k = Math.max(2, W.num(v.bins, Math.ceil(Math.log2(xs.length) + 1))), bw = (ext[1] - ext[0]) / k;
    var bins = new Array(k).fill(0);
    xs.forEach(function (x) { bins[Math.min(k - 1, Math.floor((x - ext[0]) / bw))]++; });
    var c = W.chart(el, { height: W.num(v.height, 260), label: 'histogram' });
    var x = W.scale.linear(ext, [0, c.w]), y = W.scale.linear([0, Math.max.apply(null, bins)], [c.h, 0], true);
    c.axisY(y, { format: function (t) { return W.fmt(t); } });
    c.axisXLinear(x);
    bins.forEach(function (n, i) {
      var a = ext[0] + i * bw;
      c.add(svg('rect', { x: x(a) + 1, y: y(n), width: Math.max(1, x(a + bw) - x(a) - 2), height: c.h - y(n), class: 'wm-mark wm-s1', 'data-tip': '[' + W.fmt(a) + ', ' + W.fmt(a + bw) + '): ' + n }));
    });
    var mean = W.sum(xs) / xs.length, med = xs.length % 2 ? xs[(xs.length - 1) / 2] : (xs[xs.length / 2 - 1] + xs[xs.length / 2]) / 2;
    [['mean', mean, 'wm-guide'], ['median', med, 'wm-guide wm-guide-alt']].forEach(function (m, i) {
      c.add(svg('line', { x1: x(m[1]), x2: x(m[1]), y1: 0, y2: c.h, class: m[2] }));
      c.add(svg('text', { x: x(m[1]) + 4, y: 10 + i * 13, class: 'wm-value', text: m[0] + ' ' + W.fmt(m[1]) + (v.unit ? ' ' + v.unit : '') }));
    });
  }
});
