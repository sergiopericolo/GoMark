/*
 * radar — several measures on spokes; one polygon per series (up to three read well).
 * data:   { "axes": ["speed", …], "series": [{ "name", "values": [] }] }
 * config: { "max": 0, "rings": 4 }   (max 0 = the largest value)
 */
WiMark.register('radar', {
  title: 'Radar chart',
  description: 'Profiles over several measures; best with up to three series.',
  example: {
    data: { axes: ['speed', 'docs', 'themes', 'widgets', 'i18n', 'AI'], series: [{ name: 'v1.1', values: [9, 5, 3, 3, 6, 0] }, { name: 'v1.2', values: [9, 8, 9, 10, 9, 8] }] },
    config: { max: 10, rings: 5 }
  },
  mount: function (el, data, config) {
    var W = WiMark, svg = W.svg;
    var axes = W.list(data.axes), S = W.list(data.series), n = axes.length;
    var max = W.num(config.max, 0) || Math.max.apply(null, [].concat.apply([1], S.map(function (s) { return W.list(s.values).map(Number); })));
    var c = W.chart(el, { width: 520, height: 380, margin: { top: 30, right: 80, bottom: 30, left: 80 }, label: 'radar chart' });
    c.svg.style.maxWidth = '520px';
    var cx = c.w / 2, cy = c.h / 2, R = Math.min(cx, cy);
    var pt = function (i, r) { var a = -Math.PI / 2 + (2 * Math.PI * i) / n; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
    var rings = Math.max(1, W.num(config.rings, 4));
    for (var k = 1; k <= rings; k++) {
      c.add(svg('polygon', { points: axes.map(function (_, i) { return pt(i, (R * k) / rings).join(','); }).join(' '), class: 'wm-gridline wm-ring' }));
    }
    axes.forEach(function (a, i) {
      var p = pt(i, R), q = pt(i, R + 16);
      c.add(svg('line', { x1: cx, y1: cy, x2: p[0], y2: p[1], class: 'wm-gridline' }));
      c.add(svg('text', { x: q[0], y: q[1] + 4, 'text-anchor': Math.abs(q[0] - cx) < 4 ? 'middle' : q[0] > cx ? 'start' : 'end', text: a }));
    });
    S.forEach(function (s, si) {
      var P = axes.map(function (_, i) { return pt(i, (R * Math.max(0, Math.min(max, W.num(W.list(s.values)[i])))) / max); });
      c.add(svg('polygon', { points: P.map(function (p) { return p.join(','); }).join(' '), class: 'wm-area ' + W.series(si) }));
      c.add(svg('polygon', { points: P.map(function (p) { return p.join(','); }).join(' '), class: 'wm-line ' + W.series(si) }));
      P.forEach(function (p, i) { c.add(svg('circle', { cx: p[0], cy: p[1], r: 4, class: 'wm-dot ' + W.series(si), 'data-tip': s.name + ' · ' + axes[i] + ': ' + W.fmt(W.num(W.list(s.values)[i])) })); });
    });
    el.appendChild(W.legend(S.map(function (s, i) { return { label: s.name, i: i }; }), 'line'));
    W.dataTable(el, [''].concat(S.map(function (s) { return s.name; })), axes.map(function (a, i) { return [a].concat(S.map(function (s) { return W.list(s.values)[i]; })); }));
  }
});
