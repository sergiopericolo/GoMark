/*
 * heatmap — a grid of cells shaded on the theme's sequential ramp.
 * data:   { "x": ["Mon", …], "y": ["09", …], "values": [[…], …] }   (values[row][column])
 * config: { "values": true, "legend": true }
 */
WiMark.register('heatmap', {
  title: 'Heatmap',
  description: 'A grid shaded light to dark (one hue), with the numbers and a scale.',
  example: {
    data: {
      x: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], y: ['morning', 'noon', 'afternoon', 'evening'],
      values: [[3, 5, 4, 6, 2, 0, 1], [8, 9, 7, 8, 6, 2, 1], [12, 14, 11, 13, 9, 3, 2], [4, 6, 5, 7, 8, 9, 6]]
    },
    config: { values: true, legend: true }
  },
  mount: function (el, data, config) {
    var W = WiMark, svg = W.svg;
    var xs = W.list(data.x), ys = W.list(data.y), V = W.list(data.values);
    var ext = W.extent([].concat.apply([], V).map(Number));
    var labelW = Math.max(40, Math.max.apply(null, ys.map(function (l) { return W.diagram.textWidth(l, 11); }).concat([0])) + 12);
    var cell = Math.min(56, Math.floor((640 - labelW) / Math.max(1, xs.length)));
    var c = W.chart(el, { width: labelW + cell * xs.length + 4, height: 26 + cell * ys.length * 0.7 + 4, margin: { top: 22, right: 2, bottom: 2, left: labelW }, label: 'heatmap' });
    c.svg.style.maxWidth = (labelW + cell * xs.length + 4) + 'px';
    var ch = cell * 0.7;
    var step = function (v) { return Math.min(4, Math.floor(((v - ext[0]) / (ext[1] - ext[0] || 1)) * 4.999)); };
    xs.forEach(function (l, i) { c.add(svg('text', { x: i * cell + cell / 2, y: -8, 'text-anchor': 'middle', text: l })); });
    ys.forEach(function (l, j) {
      c.add(svg('text', { x: -8, y: j * ch + ch / 2 + 4, 'text-anchor': 'end', text: l }));
      xs.forEach(function (xl, i) {
        var v = W.num(W.list(V[j])[i], NaN);
        if (!isFinite(v)) return;
        var k = step(v);
        c.add(svg('rect', { x: i * cell, y: j * ch, width: cell, height: ch, rx: 3, class: 'wm-cell wm-h' + k, 'data-tip': l + ' · ' + xl + ': ' + W.fmt(v) }));
        if (config.values !== false) c.add(svg('text', { x: i * cell + cell / 2, y: j * ch + ch / 2 + 4, 'text-anchor': 'middle', class: k >= 3 ? 'wm-heat-text-dark' : 'wm-heat-text', text: W.compact(v) }));
      });
    });
    if (config.legend !== false) {
      var h = W.h;
      el.appendChild(h('div', 'wm-heat-legend', h('span', 'wm-muted', W.fmt(ext[0])), [0, 1, 2, 3, 4].map(function (k) { return h('span', 'wm-heat-step wm-h' + k); }), h('span', 'wm-muted', W.fmt(ext[1]))));
    }
    W.dataTable(el, [''].concat(xs), ys.map(function (l, j) { return [l].concat(W.list(V[j])); }));
  }
});
