/*
 * histogram — how values are distributed, in equal-width bins.
 * data:   { "values": [] }
 * config: { "bins": 0, "height": 240, "mean": true }   (bins 0 = Sturges' rule)
 */
WiMark.register('histogram', {
  title: 'Histogram',
  description: 'Distribution of values in equal bins, with the mean marked.',
  example: {
    data: { values: [12, 15, 14, 18, 22, 21, 19, 25, 30, 28, 17, 16, 23, 24, 26, 19, 18, 20, 21, 22, 35, 13, 19, 20, 24, 27, 22, 18, 21, 23] },
    config: { bins: 0, height: 240, mean: true }
  },
  mount: function (el, data, config) {
    var W = WiMark, svg = W.svg;
    var vals = W.list(data.values || data).map(function (v) { return W.num(v, NaN); }).filter(isFinite);
    if (!vals.length) throw new Error('no numeric values');
    var ext = W.extent(vals), k = W.num(config.bins, 0) || Math.ceil(Math.log2(vals.length) + 1);
    var step = (ext[1] - ext[0]) / k, counts = new Array(k).fill(0);
    vals.forEach(function (v) { counts[Math.min(k - 1, Math.floor((v - ext[0]) / (step || 1)))]++; });
    var c = W.chart(el, { height: W.num(config.height, 240), label: 'histogram' });
    var x = W.scale.linear(ext, [0, c.w]), y = W.scale.linear([0, Math.max.apply(null, counts)], [c.h, 0], true);
    c.axisY(y, { ticks: 4 });
    counts.forEach(function (n, i) {
      var x0 = x(ext[0] + i * step), x1 = x(ext[0] + (i + 1) * step);
      c.add(svg('rect', { x: x0 + 1, y: y(n), width: Math.max(1, x1 - x0 - 2), height: c.h - y(n), rx: 2, class: 'wm-mark wm-s1',
        'data-tip': W.fmt(ext[0] + i * step) + ' – ' + W.fmt(ext[0] + (i + 1) * step) + ': ' + n }));
    });
    c.axisXLinear(x, { ticks: 6 });
    if (config.mean !== false) {
      var mean = W.sum(vals) / vals.length;
      c.add(svg('line', { x1: x(mean), x2: x(mean), y1: 0, y2: c.h, class: 'wm-stroke-ink wm-today' }));
      W.diagram.label(c.plot, x(mean), 8, 'mean ' + W.fmt(mean, { maximumFractionDigits: 1 }));
    }
  }
});
