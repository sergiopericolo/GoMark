/*
 * treemap — rectangles sized by value; "a/b" paths group under "a".
 *   ```wimark-treemap {"unit": "KB"}
 *   [["engine/render.go", 18], ["engine/ai.go", 24], ["static/widgets.js", 40]]
 *   ```
 */
WiMark.register('treemap', {
  title: 'Treemap',
  description: 'Sizes as nested rectangles (squarified); "dir/file" paths group by their first part — bundle and disk usage.',
  example: { opts: { unit: 'KB' }, body: [['engine/render.go', 15], ['engine/ai.go', 22], ['engine/image.go', 11], ['engine/media.go', 8], ['static/widgets.js', 44], ['static/wimark.css', 38], ['static/catalog.js', 9], ['templates/layout.html', 12], ['cli.go', 19]] },
  mount: function (el, v) {
    var W = WiMark, svg = W.svg;
    var groups = {}, order = [];
    W.rows(v.items, ['path', 'value']).forEach(function (r) {
      var parts = String(r.path).split('/'), g = parts.length > 1 ? parts[0] : '';
      if (!(g in groups)) { groups[g] = []; order.push(g); }
      groups[g].push({ label: parts.length > 1 ? parts.slice(1).join('/') : parts[0], value: Math.max(0, +r.value) });
    });
    var total = 0, tops = order.map(function (g) { var s = W.sum(groups[g].map(function (x) { return x.value; })); total += s; return { label: g, value: s, kids: groups[g] }; });
    function squarify(items, x, y, w, h0) {
      items = items.slice().sort(function (a, b) { return b.value - a.value; });
      var out = [], sum = W.sum(items.map(function (i) { return i.value; })) || 1;
      var scale = (w * h0) / sum;
      while (items.length) {
        var short = Math.min(w, h0), row = [], best = Infinity;
        while (items.length) {
          var test = row.concat([items[0]]), s = W.sum(test.map(function (i) { return i.value * scale; }));
          var worst = Math.max.apply(null, test.map(function (i) { var a = i.value * scale; return Math.max((short * short * a) / (s * s), (s * s) / (short * short * a)); }));
          if (worst > best) break;
          best = worst; row = test; items.shift();
        }
        var rs = W.sum(row.map(function (i) { return i.value * scale; })), thick = rs / short, off = 0;
        row.forEach(function (i) {
          var len = (i.value * scale) / thick;
          out.push(w >= h0 ? { it: i, x: x, y: y + off, w: thick, h: len } : { it: i, x: x + off, y: y, w: len, h: thick });
          off += len;
        });
        if (w >= h0) { x += thick; w -= thick; } else { y += thick; h0 -= thick; }
      }
      return out;
    }
    var Wd = 640, Hd = W.num(v.height, 340);
    var c = W.chart(el, { width: Wd, height: Hd, margin: { top: 0, right: 0, bottom: 0, left: 0 }, label: 'treemap' });
    squarify(tops, 0, 0, Wd, Hd).forEach(function (g, gi) {
      var pad = g.it.label ? 18 : 0;
      if (g.it.label) {
        c.add(svg('rect', { x: g.x, y: g.y, width: g.w, height: g.h, class: 'wm-outline' }));
        if (g.w > 40) c.add(svg('text', { x: g.x + 5, y: g.y + 13, class: 'wm-title', text: g.it.label + '/ · ' + W.fmt(g.it.value) + (v.unit ? ' ' + v.unit : '') }));
      }
      squarify(g.it.kids, g.x + 2, g.y + pad, Math.max(1, g.w - 4), Math.max(1, g.h - pad - 2)).forEach(function (r) {
        var pct = W.fmt(r.it.value / (total || 1), { style: 'percent', maximumFractionDigits: 1 });
        c.add(svg('rect', { x: r.x + 1, y: r.y + 1, width: Math.max(0, r.w - 2), height: Math.max(0, r.h - 2), rx: 2, class: 'wm-mark ' + W.series(gi), 'data-tip': (g.it.label ? g.it.label + '/' : '') + r.it.label + ': ' + W.fmt(r.it.value) + (v.unit ? ' ' + v.unit : '') + ' (' + pct + ')' }));
        if (r.w > 50 && r.h > 18) c.add(svg('text', { x: r.x + 6, y: r.y + 15, class: 'wm-on ' + W.series(gi), text: r.it.label.length * 7 > r.w - 8 ? r.it.label.slice(0, Math.max(1, Math.floor((r.w - 8) / 7) - 1)) + '…' : r.it.label }));
      });
    });
  }
});
