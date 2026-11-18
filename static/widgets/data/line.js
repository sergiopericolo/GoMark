/*
 * line — values over an ordered axis (time, steps), one line per series.
 * data:   { "labels": [], "series": [{ "name", "values": [] }] }
 * config: { "height": 280, "points": true, "zero": false, "end_labels": true, "table": true }
 */
WiMark.register('line', {
  title: 'Line chart',
  description: 'Change over an ordered axis; dashes and end labels keep series apart in every theme.',
  example: {
    data: {
      labels: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'],
      series: [{ name: 'pages', values: [12, 18, 15, 24, 31, 38] }, { name: 'translated', values: [4, 9, 11, 14, 22, 30] }, { name: 'widgets', values: [2, 2, 5, 12, 40, 100] }]
    },
    config: { height: 280, points: true, zero: true, end_labels: true, table: true }
  },
  mount: function (el, data, config) {
    var W = WiMark, svg = W.svg;
    var d = W.seriesData(data), S = d.series;
    var direct = config.end_labels !== false && S.length <= 4 && S.length > 1;
    var c = W.chart(el, { height: W.num(config.height, 280), margin: { right: direct ? 90 : 16 }, label: 'line chart' });
    var all = [].concat.apply([], S.map(function (s) { return s.values; }));
    var ext = W.extent(all);
    if (config.zero !== false) ext = [Math.min(0, ext[0]), Math.max(0, ext[1])];
    var y = W.scale.linear(ext, [c.h, 0], true);
    var x = function (i) { return d.labels.length > 1 ? (i * c.w) / (d.labels.length - 1) : c.w / 2; };
    c.axisY(y);
    c.axisX(d.labels, x);
    S.forEach(function (s, si) {
      var cls = W.series(si), pts = [];
      s.values.forEach(function (v, i) { if (isFinite(v)) pts.push([x(i), y(v), v, i]); });
      if (!pts.length) return;
      c.add(svg('path', { d: 'M' + pts.map(function (p) { return p[0] + ',' + p[1]; }).join(' L'), class: 'wm-line ' + cls }));
      pts.forEach(function (p) {
        var tip = (s.name ? s.name + ' · ' : '') + d.labels[p[3]] + ': ' + W.fmt(p[2]);
        if (config.points !== false) c.add(svg('circle', { cx: p[0], cy: p[1], r: 4, class: 'wm-dot ' + cls }));
        c.add(svg('circle', { cx: p[0], cy: p[1], r: 12, class: 'wm-hit', 'data-tip': tip }));
      });
      if (direct) {
        var last = pts[pts.length - 1];
        c.add(svg('text', { x: last[0] + 10, y: last[1] + 4, class: 'wm-value', text: s.name }));
      }
    });
    if (S.length > 1) el.appendChild(W.legend(S.map(function (s, i) { return { label: s.name, i: i }; }), 'line'));
    if (config.table !== false) W.dataTable(el, [''].concat(S.map(function (s) { return s.name; })), d.labels.map(function (l, i) { return [l].concat(S.map(function (s) { return s.values[i]; })); }));
  }
});
