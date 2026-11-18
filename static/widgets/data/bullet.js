/*
 * bullet — a measure against a target over qualitative bands (poor · fair · good).
 * data:   [{ "label", "value", "target"?, "ranges": [50, 80, 100], "unit"? }]
 * config: {}
 */
WiMark.register('bullet', {
  title: 'Bullet chart',
  description: 'Compact bar against a target line over shaded qualitative ranges.',
  example: {
    data: [
      { label: 'Pages written', value: 42, target: 50, ranges: [20, 40, 60] },
      { label: 'Translated (%)', value: 71, target: 80, ranges: [50, 75, 100], unit: '%' },
      { label: 'Build (ms)', value: 120, target: 150, ranges: [100, 200, 300], unit: ' ms' }
    ],
    config: {}
  },
  mount: function (el, data, config) {
    var W = WiMark, svg = W.svg;
    var items = W.list(data), row = 42;
    var labelW = Math.max(80, Math.max.apply(null, items.map(function (d) { return W.diagram.textWidth(d.label, 11); }).concat([0])) + 14);
    var c = W.chart(el, { height: items.length * row + 8, margin: { top: 4, right: 70, bottom: 4, left: labelW }, label: 'bullet chart' });
    items.forEach(function (d, i) {
      var ranges = W.list(d.ranges).map(Number), max = Math.max.apply(null, ranges.concat([W.num(d.value), W.num(d.target), 1]));
      var x = W.scale.linear([0, max], [0, c.w]), y = i * row + 6;
      c.add(svg('text', { x: -10, y: y + 17, 'text-anchor': 'end', class: 'wm-value', text: d.label }));
      ranges.slice().sort(function (a, b) { return b - a; }).forEach(function (r, k) {
        c.add(svg('rect', { x: 0, y: y, width: x(r), height: 26, class: 'wm-cell wm-h' + Math.min(2, k) })); // widest range lightest, worst darkest
      });
      c.add(svg('rect', { x: 0, y: y + 9, width: Math.max(2, x(W.num(d.value))), height: 8, class: 'wm-bullet-bar', 'data-tip': d.label + ': ' + W.fmt(W.num(d.value)) + (d.unit || '') + (d.target !== undefined ? ' (target ' + W.fmt(W.num(d.target)) + ')' : '') }));
      if (d.target !== undefined) c.add(svg('line', { x1: x(W.num(d.target)), x2: x(W.num(d.target)), y1: y + 3, y2: y + 23, class: 'wm-bullet-target' }));
      c.add(svg('text', { x: c.w + 8, y: y + 17, class: 'wm-value', text: W.fmt(W.num(d.value)) + (d.unit || '') }));
    });
  }
});
