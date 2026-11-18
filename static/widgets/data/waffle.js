/*
 * waffle — 100 squares split by share: proportions anyone can count.
 * data:   [{ "label", "value" }]
 * config: { "columns": 10 }
 */
WiMark.register('waffle', {
  title: 'Waffle chart',
  description: 'A grid of 100 squares split by share; each square is 1%.',
  example: {
    data: [{ label: 'written', value: 58 }, { label: 'shown from another language', value: 31 }, { label: 'draft', value: 11 }],
    config: { columns: 10 }
  },
  mount: function (el, data, config) {
    var W = WiMark, svg = W.svg;
    var items = W.list(data).map(function (d) { return { label: d.label, value: Math.max(0, W.num(d.value)) }; });
    var total = W.sum(items.map(function (d) { return d.value; })) || 1;
    // Largest-remainder rounding so the squares always add up to 100.
    var exact = items.map(function (d) { return (100 * d.value) / total; }), counts = exact.map(Math.floor);
    var left = 100 - W.sum(counts);
    exact.map(function (e, i) { return { i: i, r: e - Math.floor(e) }; }).sort(function (a, b) { return b.r - a.r; }).slice(0, left).forEach(function (x) { counts[x.i]++; });
    var cols = Math.max(5, Math.min(25, W.num(config.columns, 10))), rows = Math.ceil(100 / cols), s = 22;
    var c = W.chart(el, { width: cols * s + 4, height: rows * s + 4, margin: { top: 2, right: 2, bottom: 2, left: 2 }, label: 'waffle chart' });
    c.svg.style.maxWidth = (cols * s * 1.4) + 'px';
    var k = 0;
    counts.forEach(function (n, i) {
      for (var j = 0; j < n; j++, k++) {
        c.add(svg('rect', { x: (k % cols) * s, y: Math.floor(k / cols) * s, width: s - 3, height: s - 3, rx: 3, class: 'wm-mark ' + W.series(i), 'data-tip': items[i].label + ': ' + counts[i] + '%' }));
      }
    });
    el.appendChild(W.legend(items.map(function (d, i) { return { label: d.label + ' · ' + counts[i] + '%', i: i }; })));
  }
});
