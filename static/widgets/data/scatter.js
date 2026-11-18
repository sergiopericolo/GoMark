/*
 * scatter — points on two numeric axes; optional least-squares trend line.
 * data:   { "series": [{ "name", "points": [[x, y], …] }] } or { "points": [[x, y], …] }
 * config: { "x_label": "", "y_label": "", "trend": true, "height": 300 }
 */
WiMark.register('scatter', {
  title: 'Scatter plot',
  description: 'Relation between two measures, up to three groups, with an optional trend line.',
  example: {
    data: { series: [
      { name: 'pages', points: [[1, 2.1], [2, 2.9], [3, 4.2], [4, 4.8], [5, 6.1], [6, 6.8], [7, 8.2]] },
      { name: 'widgets', points: [[1, 1], [2, 3.4], [3, 3.1], [4, 5.5], [5, 5.2], [6, 7.9], [7, 7.4]] }
    ] },
    config: { x_label: 'week', y_label: 'hours', trend: true, height: 300 }
  },
  mount: function (el, data, config) {
    var W = WiMark, svg = W.svg;
    var S = data.series ? W.list(data.series) : [{ name: '', points: W.list(data.points) }];
    var pts = [].concat.apply([], S.map(function (s) { return W.list(s.points); }));
    var c = W.chart(el, { height: W.num(config.height, 300), margin: { bottom: config.x_label ? 44 : 32, left: config.y_label ? 60 : 48 }, label: 'scatter plot' });
    var x = W.scale.linear(W.extent(pts.map(function (p) { return W.num(p[0]); })), [0, c.w], true);
    var y = W.scale.linear(W.extent(pts.map(function (p) { return W.num(p[1]); })), [c.h, 0], true);
    c.axisY(y);
    c.axisXLinear(x);
    if (config.x_label) c.add(svg('text', { x: c.w / 2, y: c.h + 38, 'text-anchor': 'middle', text: config.x_label }));
    if (config.y_label) c.add(svg('text', { x: -46, y: c.h / 2, transform: 'rotate(-90 -46 ' + c.h / 2 + ')', 'text-anchor': 'middle', text: config.y_label }));
    S.forEach(function (s, si) {
      var P = W.list(s.points).map(function (p) { return [W.num(p[0]), W.num(p[1])]; });
      if (config.trend !== false && P.length > 2) {
        var n = P.length, mx = W.sum(P.map(function (p) { return p[0]; })) / n, my = W.sum(P.map(function (p) { return p[1]; })) / n;
        var sxy = W.sum(P.map(function (p) { return (p[0] - mx) * (p[1] - my); })), sxx = W.sum(P.map(function (p) { return (p[0] - mx) * (p[0] - mx); }));
        if (sxx) {
          var k = sxy / sxx, q = my - k * mx, x0 = x.domain[0], x1 = x.domain[1];
          c.add(svg('line', { x1: x(x0), y1: y(k * x0 + q), x2: x(x1), y2: y(k * x1 + q), class: 'wm-line wm-trend ' + W.series(si), 'data-tip': (s.name ? s.name + ' · ' : '') + 'y = ' + W.fmt(k) + 'x + ' + W.fmt(q) }));
        }
      }
      P.forEach(function (p) {
        c.add(svg('circle', { cx: x(p[0]), cy: y(p[1]), r: 5, class: 'wm-dot ' + W.series(si), 'data-tip': (s.name ? s.name + ' · ' : '') + '(' + W.fmt(p[0]) + ', ' + W.fmt(p[1]) + ')' }));
      });
    });
    if (S.length > 1) el.appendChild(W.legend(S.map(function (s, i) { return { label: s.name, i: i }; })));
    W.dataTable(el, ['series', 'x', 'y'], [].concat.apply([], S.map(function (s) { return W.list(s.points).map(function (p) { return [s.name || '', p[0], p[1]]; }); })));
  }
});
