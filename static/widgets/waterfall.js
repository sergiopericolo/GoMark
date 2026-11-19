/*
 * waterfall — request timing phases on a time axis, like the network panel.
 *   ```wimark-waterfall {"unit": "ms"}
 *   [["DNS", 0, 12], ["Connect", 12, 40], ["TLS", 40, 85], ["Wait (TTFB)", 85, 230], ["Download", 230, 260]]
 *   ```
 */
WiMark.register('waterfall', {
  title: 'Timing waterfall',
  description: 'Phases [name, start, end] on one time axis — request timing, startup phases, pipeline stages — with durations.',
  example: { opts: { unit: 'ms', title: 'GET /api/pages (cold)' }, body: [['DNS lookup', 0, 14], ['TCP connect', 14, 41], ['TLS handshake', 41, 92], ['Request sent', 92, 93], ['Waiting (TTFB)', 93, 241], ['Content download', 241, 268]] },
  mount: function (el, v) {
    var W = WiMark, svg = W.svg;
    var rows = W.rows(v.items, ['name', 'start', 'end']).map(function (r) { return { name: r.name, a: +r.start, b: +r.end }; });
    var lw = Math.max.apply(null, rows.map(function (r) { return W.diagram.textWidth(r.name, 12); }).concat([40])) + 16, end = Math.max.apply(null, rows.map(function (r) { return r.b; }));
    var c = W.chart(el, { height: rows.length * 26 + 40, margin: { left: lw, right: 60, top: 8, bottom: 24 }, title: v.title, label: 'timing waterfall' });
    var x = W.scale.linear([0, end], [0, c.w], true);
    c.axisXLinear(x, { format: function (t) { return W.fmt(t) + (v.unit || ''); } });
    rows.forEach(function (r, i) {
      var y = i * 26 + 3;
      c.add(svg('text', { x: -8, y: y + 13, 'text-anchor': 'end', class: 'wm-node-text', text: r.name }));
      c.add(svg('rect', { x: x(r.a), y: y, width: Math.max(2, x(r.b) - x(r.a)), height: 18, rx: 3, class: 'wm-mark ' + W.series(i % 8), 'data-tip': r.name + ': ' + W.fmt(r.a) + ' → ' + W.fmt(r.b) + ' ' + (v.unit || '') }));
      c.add(svg('text', { x: x(r.b) + 5, y: y + 13, class: 'wm-value', text: W.fmt(r.b - r.a) + (v.unit ? ' ' + v.unit : '') }));
    });
  }
});
