/*
 * hbar — horizontal bars with labels on the left: long category names, rankings.
 * data:   [{ "label", "value" }] or { "labels", "series": [one series] }
 * config: { "sort": "none" | "desc" | "asc", "unit": "", "max_bars": 20 }
 */
WiMark.register('hbar', {
  title: 'Horizontal bars',
  description: 'Ranked bars with readable long labels and values at the end.',
  example: {
    data: [
      { label: 'Markdown replacements', value: 25 }, { label: 'Developer diagrams', value: 25 },
      { label: 'General', value: 25 }, { label: 'Data and charts', value: 25 }, { label: 'Site widgets', value: 3 }
    ],
    config: { sort: 'desc', unit: ' widgets', max_bars: 20 }
  },
  choices: { sort: ['none', 'desc', 'asc'] },
  mount: function (el, data, config) {
    var W = WiMark, svg = W.svg;
    var d = W.seriesData(data), s = d.series[0] || { values: [] };
    var rows = d.labels.map(function (l, i) { return { label: l, value: s.values[i] }; }).filter(function (r) { return isFinite(r.value); });
    if (config.sort === 'desc') rows.sort(function (a, b) { return b.value - a.value; });
    if (config.sort === 'asc') rows.sort(function (a, b) { return a.value - b.value; });
    rows = rows.slice(0, Math.max(1, W.num(config.max_bars, 20)));
    var labelW = Math.min(240, Math.max(60, Math.max.apply(null, rows.map(function (r) { return W.diagram.textWidth(r.label, 11); }).concat([0])) + 14));
    var c = W.chart(el, { height: rows.length * 30 + 12, margin: { top: 6, right: 70, bottom: 6, left: labelW }, label: 'horizontal bars' });
    var x = W.scale.linear([0, Math.max.apply(null, rows.map(function (r) { return r.value; }).concat([1]))], [0, c.w]);
    rows.forEach(function (r, i) {
      var y = i * 30 + 4;
      c.add(svg('text', { x: -10, y: y + 15, 'text-anchor': 'end', text: r.label }));
      c.add(svg('rect', { x: 0, y: y, width: Math.max(2, x(r.value)), height: 20, rx: 3, class: 'wm-mark wm-s1', 'data-tip': r.label + ': ' + W.fmt(r.value) + (config.unit || '') }));
      c.add(svg('text', { x: x(r.value) + 6, y: y + 14, class: 'wm-value', text: W.fmt(r.value) + (config.unit || '') }));
    });
    c.add(svg('line', { x1: 0, x2: 0, y1: 0, y2: c.h, class: 'wm-baseline' }));
  }
});
