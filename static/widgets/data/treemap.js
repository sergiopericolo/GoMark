/*
 * treemap — areas proportional to values, squarified; the eight largest get their own series.
 * data:   [{ "label", "value" }]
 * config: { "height": 320 }
 */
WiMark.register('treemap', {
  title: 'Treemap',
  description: 'Rectangles sized by value (squarified layout) with labels where they fit.',
  example: {
    data: [
      { label: 'widgets.js', value: 820 }, { label: 'wimark.css', value: 610 }, { label: 'render.go', value: 420 },
      { label: 'section.go', value: 260 }, { label: 'theme.go', value: 230 }, { label: 'image.go', value: 210 },
      { label: 'catalog.js', value: 200 }, { label: 'ai.go', value: 380 }, { label: 'cli.go', value: 560 }, { label: 'config.go', value: 330 }
    ],
    config: { height: 320 }
  },
  mount: function (el, data, config) {
    var W = WiMark, svg = W.svg;
    var items = W.list(data).map(function (d) { return { label: d.label, value: Math.max(0, W.num(d.value)) }; }).filter(function (d) { return d.value > 0; })
      .sort(function (a, b) { return b.value - a.value; });
    var c = W.chart(el, { height: W.num(config.height, 320), margin: { top: 0, right: 0, bottom: 0, left: 0 }, label: 'treemap' });
    var total = W.sum(items.map(function (d) { return d.value; })) || 1, scale = (c.w * c.h) / total;
    var rect = { x: 0, y: 0, w: c.w, h: c.h }, rest = items.slice(), out = [];
    function worst(row, side) {
      var s = W.sum(row.map(function (d) { return d.value * scale; })), mx = Math.max.apply(null, row.map(function (d) { return d.value * scale; })), mn = Math.min.apply(null, row.map(function (d) { return d.value * scale; }));
      return Math.max((side * side * mx) / (s * s), (s * s) / (side * side * mn));
    }
    while (rest.length) {
      var side = Math.min(rect.w, rect.h), row = [rest[0]], k = 1;
      while (k < rest.length && worst(row.concat([rest[k]]), side) <= worst(row, side)) { row.push(rest[k]); k++; }
      rest = rest.slice(k);
      var area = W.sum(row.map(function (d) { return d.value * scale; })), off = 0;
      if (rect.w >= rect.h) {
        var cw = area / rect.h;
        row.forEach(function (d) { var hh = (d.value * scale) / cw; out.push({ d: d, x: rect.x, y: rect.y + off, w: cw, h: hh }); off += hh; });
        rect = { x: rect.x + cw, y: rect.y, w: rect.w - cw, h: rect.h };
      } else {
        var rh = area / rect.w;
        row.forEach(function (d) { var ww = (d.value * scale) / rh; out.push({ d: d, x: rect.x + off, y: rect.y, w: ww, h: rh }); off += ww; });
        rect = { x: rect.x, y: rect.y + rh, w: rect.w, h: rect.h - rh };
      }
    }
    out.forEach(function (r) {
      var i = items.indexOf(r.d), cls = W.series(i);
      c.add(svg('rect', { x: r.x, y: r.y, width: Math.max(0, r.w), height: Math.max(0, r.h), class: 'wm-mark ' + cls, 'data-tip': r.d.label + ': ' + W.fmt(r.d.value) + ' (' + Math.round((100 * r.d.value) / total) + '%)' }));
      if (r.w > W.diagram.textWidth(r.d.label, 11) + 10 && r.h > 34) {
        c.add(svg('text', { x: r.x + 6, y: r.y + 16, class: 'wm-on wm-treemap-text ' + cls, text: r.d.label }));
        c.add(svg('text', { x: r.x + 6, y: r.y + 30, class: 'wm-on wm-treemap-text ' + cls, text: W.compact(r.d.value) }));
      }
    });
    W.dataTable(el, ['', '', '%'], items.map(function (d) { return [d.label, d.value, Math.round((1000 * d.value) / total) / 10]; }));
  }
});
