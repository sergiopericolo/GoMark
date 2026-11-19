/*
 * bar — bars per label; several series become groups.
 *   ```wimark-bar {"y": "ops/s"}
 *   [["map", 120], ["btree", 95], ["skiplist", 80]]
 *   ```
 *   or {"x": ["a", "b"], "read": [1, 2], "write": [3, 4]} for groups; "horizontal": true for long labels
 */
WiMark.register('bar', {
  title: 'Bar chart',
  description: 'Bars from [label, value] pairs or grouped series; "horizontal" for long, ranked labels.',
  example: { opts: { x: ['map', 'B-tree', 'skip list', 'hash trie'], y: 'Mops/s' }, body: { read: [42, 31, 27, 38], write: [18, 22, 20, 15] } },
  mount: function (el, v) {
    var W = WiMark, svg = W.svg;
    var labels, S;
    if (v.items) { var r = W.rows(v.items, ['label', 'value']); labels = r.map(function (x) { return String(x.label); }); S = [{ name: '', values: r.map(function (x) { return +x.value; }) }]; }
    else { labels = W.list(v.x).map(String); S = Object.keys(v).filter(function (k) { return Array.isArray(v[k]) && k !== 'x' && typeof v[k][0] === 'number'; }).map(function (k) { return { name: k, values: v[k].map(Number) }; }); }
    var all = [].concat.apply([0], S.map(function (s) { return s.values; })), ext = W.extent(all);
    if (v.horizontal) {
      var lw = Math.min(200, Math.max.apply(null, labels.map(function (l) { return W.diagram.textWidth(l, 11); })) + 12);
      var c = W.chart(el, { height: labels.length * 30 * Math.max(1, S.length * 0.7) + 30, margin: { left: lw, right: 50, bottom: 24 }, label: 'bar chart' });
      var xs = W.scale.linear([Math.min(0, ext[0]), ext[1]], [0, c.w], true), band = W.scale.band(labels, [0, c.h], 0.25);
      c.axisXLinear(xs);
      labels.forEach(function (lab, i) {
        var b = band(i), hh = b.w / S.length;
        c.add(svg('text', { x: -8, y: b.x + b.w / 2 + 4, 'text-anchor': 'end', text: lab }));
        S.forEach(function (s, si) {
          var val = s.values[i];
          c.add(svg('rect', { x: xs(Math.min(0, val)), y: b.x + si * hh, width: Math.max(1, Math.abs(xs(val) - xs(0))), height: Math.max(1, hh - 1), rx: 3, class: 'wm-mark ' + W.series(si), 'data-tip': (s.name ? s.name + ' · ' : '') + lab + ': ' + W.fmt(val) }));
          c.add(svg('text', { x: xs(Math.max(0, val)) + 5, y: b.x + si * hh + hh / 2 + 4, class: 'wm-value', text: W.compact(val) }));
        });
      });
    } else {
      var c2 = W.chart(el, { height: W.num(v.height, 280), label: 'bar chart' });
      var y = W.scale.linear([Math.min(0, ext[0]), Math.max(0, ext[1])], [c2.h, 0], true), band2 = W.scale.band(labels, [0, c2.w], 0.25);
      c2.axisY(y);
      if (v.y) c2.add(svg('text', { x: 0, y: -4, class: 'wm-value', text: v.y }));
      labels.forEach(function (lab, i) {
        var b = band2(i), w = b.w / Math.max(1, S.length);
        S.forEach(function (s, si) {
          var val = s.values[i];
          if (!isFinite(val)) return;
          var y0 = y(Math.max(0, val)), hgt = Math.abs(y(val) - y(0));
          c2.add(svg('rect', { x: b.x + si * w, y: y0, width: Math.max(1, w - 1), height: Math.max(1, hgt), rx: 3, class: 'wm-mark ' + W.series(si), 'data-tip': (s.name ? s.name + ' · ' : '') + lab + ': ' + W.fmt(val) }));
          if (w > 22) c2.add(svg('text', { x: b.x + si * w + w / 2, y: val >= 0 ? y0 - 5 : y0 + hgt + 12, 'text-anchor': 'middle', class: 'wm-value', text: W.compact(val) }));
        });
      });
      c2.axisX(labels, function (i) { return band2(i).x + band2(i).w / 2; });
    }
    if (S.length > 1) el.appendChild(W.legend(S.map(function (s, i) { return { label: s.name, i: i }; })));
    W.dataTable(el, [''].concat(S.map(function (s) { return s.name; })), labels.map(function (l, i) { return [l].concat(S.map(function (s) { return s.values[i]; })); }));
  }
});
