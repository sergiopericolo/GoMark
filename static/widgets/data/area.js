/*
 * area — filled lines; stacked shows how parts build up a total over time.
 * data:   { "labels": [], "series": [{ "name", "values": [] }] }
 * config: { "stacked": true, "height": 260 }
 */
WiMark.register('area', {
  title: 'Area chart',
  description: 'Filled lines over time; stacked mode shows parts adding up to a total.',
  example: {
    data: { labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7'], series: [{ name: 'general', values: [2, 5, 9, 14, 20, 25, 25] }, { name: 'markdown', values: [0, 2, 6, 11, 18, 22, 25] }, { name: 'data', values: [1, 2, 3, 8, 12, 19, 25] }] },
    config: { stacked: true, height: 260 }
  },
  mount: function (el, data, config) {
    var W = WiMark, svg = W.svg;
    var d = W.seriesData(data), S = d.series, n = d.labels.length;
    var base = d.labels.map(function () { return 0; });
    var layers = S.map(function (s) {
      var lo = base.slice(), hi = s.values.map(function (v, i) { return (config.stacked !== false ? lo[i] : 0) + Math.max(0, W.num(v)); });
      if (config.stacked !== false) base = hi;
      return { lo: config.stacked !== false ? lo : d.labels.map(function () { return 0; }), hi: hi };
    });
    var c = W.chart(el, { height: W.num(config.height, 260), label: 'area chart' });
    var y = W.scale.linear([0, Math.max.apply(null, [].concat.apply([1], layers.map(function (l) { return l.hi; })))], [c.h, 0], true);
    var x = function (i) { return n > 1 ? (i * c.w) / (n - 1) : 0; };
    c.axisY(y);
    layers.forEach(function (L, si) {
      var top = L.hi.map(function (v, i) { return x(i) + ',' + y(v); });
      var bottom = L.lo.map(function (v, i) { return x(i) + ',' + y(v); }).reverse();
      c.add(svg('path', { d: 'M' + top.join(' L') + ' L' + bottom.join(' L') + ' Z', class: 'wm-area ' + W.series(si) }));
      c.add(svg('path', { d: 'M' + top.join(' L'), class: 'wm-line ' + W.series(si) }));
      L.hi.forEach(function (v, i) { c.add(svg('circle', { cx: x(i), cy: y(v), r: 9, class: 'wm-hit', 'data-tip': S[si].name + ' · ' + d.labels[i] + ': ' + W.fmt(W.num(S[si].values[i])) })); });
    });
    c.axisX(d.labels, x);
    el.appendChild(W.legend(S.map(function (s, i) { return { label: s.name, i: i }; }), 'line'));
    W.dataTable(el, [''].concat(S.map(function (s) { return s.name; })), d.labels.map(function (l, i) { return [l].concat(S.map(function (s) { return s.values[i]; })); }));
  }
});
