/*
 * funnel — ordered stages and how many make it to the next one.
 * data:   [{ "label", "value" }]
 * config: { "conversion": true }
 */
WiMark.register('funnel', {
  title: 'Funnel',
  description: 'Ordered stages shaded light to dark, with the share kept at each step.',
  example: {
    data: [{ label: 'visited the catalog', value: 1200 }, { label: 'opened an editor', value: 640 }, { label: 'copied Markdown', value: 410 }, { label: 'published a page', value: 180 }],
    config: { conversion: true }
  },
  mount: function (el, data, config) {
    var W = WiMark, svg = W.svg;
    var st = W.list(data).map(function (d) { return { label: d.label, value: Math.max(0, W.num(d.value)) }; });
    var top = Math.max.apply(null, st.map(function (s) { return s.value; }).concat([1]));
    var row = 44, c = W.chart(el, { height: st.length * row + 8, margin: { top: 4, right: 4, bottom: 4, left: 4 }, label: 'funnel' });
    st.forEach(function (s, i) {
      // Ordinal: steps 1…4 of the ramp, never the lightest (it would vanish on the surface).
      var k = 1 + Math.round((3 * i) / Math.max(1, st.length - 1)), w = (c.w * 0.62 * s.value) / top, x = (c.w * 0.62 - w) / 2, y = i * row;
      c.add(svg('rect', { x: x, y: y, width: Math.max(2, w), height: row - 8, rx: 4, class: 'wm-cell wm-h' + k, 'data-tip': s.label + ': ' + W.fmt(s.value) }));
      c.add(svg('text', { x: c.w * 0.62 / 2, y: y + row / 2, 'text-anchor': 'middle', class: k >= 3 ? 'wm-heat-text-dark' : 'wm-heat-text', text: W.compact(s.value) }));
      c.add(svg('text', { x: c.w * 0.62 + 16, y: y + row / 2 - 4, class: 'wm-value', text: s.label }));
      if (config.conversion !== false && i > 0) {
        c.add(svg('text', { x: c.w * 0.62 + 16, y: y + row / 2 + 11, text: Math.round((100 * s.value) / (st[i - 1].value || 1)) + '% of previous · ' + Math.round((100 * s.value) / top) + '% of first' }));
      }
    });
  }
});
