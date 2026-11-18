/*
 * bar — vertical bars, grouped when there are several series.
 * data:   { "labels": [], "series": [{ "name", "values": [] }] } or [{ "label", "value" }]
 * config: { "height": 280, "values": true, "table": true }
 */
WiMark.register('bar', {
  title: 'Bar chart',
  description: 'Compare amounts across categories; several series become grouped bars.',
  example: {
    data: { labels: ['general', 'markdown', 'developer', 'data'], series: [{ name: 'widgets', values: [25, 25, 25, 25] }, { name: 'with tables', values: [3, 12, 4, 6] }] },
    config: { height: 280, values: true, table: true }
  },
  mount: function (el, data, config) {
    var W = WiMark, svg = W.svg;
    var d = W.seriesData(data), S = d.series;
    var c = W.chart(el, { height: W.num(config.height, 280), label: 'bar chart' });
    var all = [].concat.apply([], S.map(function (s) { return s.values; }));
    var ext = W.extent(all.concat([0]));
    var y = W.scale.linear([Math.min(0, ext[0]), Math.max(0, ext[1])], [c.h, 0], true);
    var band = W.scale.band(d.labels, [0, c.w], 0.25);
    c.axisY(y);
    d.labels.forEach(function (lab, i) {
      var b = band(i), w = b.w / Math.max(1, S.length);
      S.forEach(function (s, si) {
        var v = s.values[i];
        if (!isFinite(v)) return;
        var y0 = y(Math.max(0, v)), hgt = Math.abs(y(v) - y(0));
        c.add(svg('rect', { x: b.x + si * w, y: y0, width: Math.max(1, w), height: Math.max(1, hgt), rx: 3, class: 'wm-mark ' + W.series(si), 'data-tip': (s.name ? s.name + ' · ' : '') + lab + ': ' + W.fmt(v) }));
        if (config.values !== false && w > 22) c.add(svg('text', { x: b.x + si * w + w / 2, y: v >= 0 ? y0 - 5 : y0 + hgt + 12, 'text-anchor': 'middle', class: 'wm-value', text: W.compact(v) }));
      });
    });
    c.axisX(d.labels, function (i) { return band(i).x + band(i).w / 2; });
    if (S.length > 1) el.appendChild(W.legend(S.map(function (s, i) { return { label: s.name, i: i }; })));
    if (config.table !== false) W.dataTable(el, [''].concat(S.map(function (s) { return s.name; })), d.labels.map(function (l, i) { return [l].concat(S.map(function (s) { return s.values[i]; })); }));
  }
});
