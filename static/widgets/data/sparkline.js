/*
 * sparkline — many small trends in a table: name, line, last value, min and max.
 * data:   [{ "label", "values": [] }]
 * config: { "minmax": true }
 */
WiMark.register('sparkline', {
  title: 'Sparklines',
  description: 'Small inline trends in rows with last value, change, minimum and maximum.',
  example: {
    data: [
      { label: 'pages', values: [12, 18, 15, 24, 31, 38, 42] },
      { label: 'build ms', values: [180, 170, 150, 160, 140, 135, 120] },
      { label: 'widgets', values: [4, 4, 12, 40, 70, 96, 100] }
    ],
    config: { minmax: true }
  },
  mount: function (el, data, config) {
    var W = WiMark, h = W.h, svg = W.svg;
    var rows = W.list(data).map(function (r) {
      var v = W.list(r.values).map(Number).filter(isFinite), ext = W.extent(v), sw = 140, sh = 26;
      var pts = v.map(function (x, i) { return ((i * sw) / Math.max(1, v.length - 1)) + ',' + (sh - 3 - ((x - ext[0]) / (ext[1] - ext[0] || 1)) * (sh - 6)); });
      var last = v[v.length - 1], first = v[0];
      var line = svg('svg', { class: 'wm-spark', viewBox: '-3 0 ' + (sw + 6) + ' ' + sh, 'aria-hidden': 'true' },
        svg('polyline', { points: pts.join(' '), class: 'wm-line wm-s1' }),
        pts.length ? svg('circle', { cx: pts[pts.length - 1].split(',')[0], cy: pts[pts.length - 1].split(',')[1], r: 3, class: 'wm-dot wm-s1' }) : null);
      var change = first ? Math.round((100 * (last - first)) / Math.abs(first)) : 0;
      var cells = [h('strong', null, r.label || ''), line, W.fmt(last), (change > 0 ? '▲ +' : change < 0 ? '▼ ' : '■ ') + change + '%'];
      if (config.minmax !== false) cells.push(W.fmt(ext[0]), W.fmt(ext[1]));
      return cells;
    });
    el.appendChild(W.table(['', '', 'last', 'change'].concat(config.minmax !== false ? ['min', 'max'] : []), rows,
      { align: [null, null, 'right', 'right', 'right', 'right'], cls: 'wm-sparkline-table' }));
  }
});
