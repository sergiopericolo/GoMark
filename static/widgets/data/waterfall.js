/*
 * waterfall — how a starting amount becomes the final one, step by step.
 * data:   [{ "label", "value", "total"? }]   (total: true draws the running total)
 * config: { "height": 280 }
 */
WiMark.register('waterfall', {
  title: 'Waterfall',
  description: 'Gains (▲) and losses (▼) from a start to an end, with running totals.',
  example: {
    data: [
      { label: 'start', value: 1200, total: true }, { label: 'new pages', value: 340 }, { label: 'translations', value: 210 },
      { label: 'removed', value: -150 }, { label: 'merged', value: -90 }, { label: 'end', total: true }
    ],
    config: { height: 280 }
  },
  mount: function (el, data, config) {
    var W = WiMark, svg = W.svg;
    var steps = [], run = 0;
    W.list(data).forEach(function (d) {
      if (d.total) { if (d.value !== undefined) run = W.num(d.value); steps.push({ label: d.label, a: 0, b: run, total: true, v: run }); }
      else { var v = W.num(d.value); steps.push({ label: d.label, a: run, b: run + v, v: v }); run += v; }
    });
    var c = W.chart(el, { height: W.num(config.height, 280), label: 'waterfall' });
    var y = W.scale.linear([Math.min(0, Math.min.apply(null, steps.map(function (s) { return Math.min(s.a, s.b); }))), Math.max.apply(null, steps.map(function (s) { return Math.max(s.a, s.b); }))], [c.h, 0], true);
    var band = W.scale.band(steps.map(function (s) { return s.label; }), [0, c.w], 0.3);
    c.axisY(y);
    steps.forEach(function (s, i) {
      var b = band(i), y0 = y(Math.max(s.a, s.b)), hh = Math.max(1, Math.abs(y(s.a) - y(s.b)));
      var cls = s.total ? 'wm-s1' : s.v >= 0 ? 'wm-pos' : 'wm-neg';
      c.add(svg('rect', { x: b.x, y: y0, width: b.w, height: hh, rx: 3, class: (s.total ? 'wm-mark ' : 'wm-cell ') + cls, 'data-tip': s.label + ': ' + (s.total ? W.fmt(s.v) : (s.v > 0 ? '+' : '') + W.fmt(s.v)) }));
      c.add(svg('text', { x: b.x + b.w / 2, y: y0 - 6, 'text-anchor': 'middle', class: 'wm-value', text: s.total ? W.compact(s.v) : (s.v >= 0 ? '▲ ' : '▼ ') + W.compact(Math.abs(s.v)) }));
      if (i < steps.length - 1) c.add(svg('line', { x1: b.x + b.w, x2: band(i + 1).x, y1: y(s.b), y2: y(s.b), class: 'wm-guide' }));
    });
    c.axisX(steps.map(function (s) { return s.label; }), function (i) { return band(i).x + band(i).w / 2; });
  }
});
