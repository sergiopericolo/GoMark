/*
 * stacked — bars split into parts: totals and their composition.
 * data:   { "labels": [], "series": [{ "name", "values": [] }] }
 * config: { "percent": false, "height": 280, "totals": true }
 */
WiMark.register('stacked', {
  title: 'Stacked bars',
  description: 'Totals and their parts; in percent mode every bar is 100%.',
  example: {
    data: { labels: ['en', 'it', 'de', 'fr'], series: [{ name: 'written', values: [42, 30, 8, 5] }, { name: 'fallback', values: [0, 12, 34, 37] }, { name: 'draft', values: [6, 4, 2, 1] }] },
    config: { percent: false, height: 280, totals: true }
  },
  mount: function (el, data, config) {
    var W = WiMark, svg = W.svg;
    var d = W.seriesData(data), S = d.series;
    var totals = d.labels.map(function (_, i) { return W.sum(S.map(function (s) { return Math.max(0, W.num(s.values[i])); })); });
    var c = W.chart(el, { height: W.num(config.height, 280), label: 'stacked bars' });
    var y = W.scale.linear([0, config.percent ? 1 : Math.max.apply(null, totals.concat([1]))], [c.h, 0], !config.percent);
    c.axisY(y, config.percent ? { format: function (v) { return Math.round(v * 100) + '%'; } } : {});
    var band = W.scale.band(d.labels, [0, c.w], 0.3);
    d.labels.forEach(function (lab, i) {
      var b = band(i), acc = 0;
      S.forEach(function (s, si) {
        var v = Math.max(0, W.num(s.values[i])), part = config.percent ? v / (totals[i] || 1) : v;
        if (!part) return;
        var y1 = y(acc + part), hh = y(acc) - y1;
        c.add(svg('rect', { x: b.x, y: y1, width: b.w, height: Math.max(1, hh), rx: 2, class: 'wm-mark ' + W.series(si),
          'data-tip': s.name + ' · ' + lab + ': ' + W.fmt(v) + ' (' + Math.round((100 * v) / (totals[i] || 1)) + '%)' }));
        acc += part;
      });
      if (config.totals !== false && !config.percent) c.add(svg('text', { x: b.x + b.w / 2, y: y(acc) - 5, 'text-anchor': 'middle', class: 'wm-value', text: W.compact(totals[i]) }));
    });
    c.axisX(d.labels, function (i) { return band(i).x + band(i).w / 2; });
    el.appendChild(W.legend(S.map(function (s, i) { return { label: s.name, i: i }; })));
    W.dataTable(el, [''].concat(S.map(function (s) { return s.name; }), [W.t('total')]), d.labels.map(function (l, i) { return [l].concat(S.map(function (s) { return s.values[i]; }), [totals[i]]); }));
  }
});
