/*
 * sparkline — small trends in rows with the last value, change, min and max.
 *   ```wimark-sparkline {"unit": "ms"}
 *   [["p50", [12, 11, 13, 12, 10]], ["p99", [80, 95, 70, 66, 61]]]
 *   ```
 */
WiMark.register('sparkline', {
  title: 'Sparklines',
  description: 'Rows of tiny line charts with the last value, the change, the minimum and the maximum.',
  example: { opts: { unit: 'ms', better: 'lower' }, body: [['p50 latency', [14, 13, 15, 12, 12, 11, 10, 10, 9]], ['p99 latency', [88, 95, 81, 77, 70, 66, 64, 61, 58]], ['errors / min', [2, 1, 3, 0, 1, 4, 9, 6, 2]]] },
  mount: function (el, v) {
    var W = WiMark, h = W.h, svg = W.svg;
    var rows = W.rows(v.items, ['label', 'values']).map(function (r) {
      var xs = W.list(r.values).map(Number), ext = W.extent(xs), Wd = 120, Hd = 26;
      var pts = xs.map(function (x, i) { return (i * Wd) / Math.max(1, xs.length - 1) + ',' + (Hd - 3 - ((x - ext[0]) / (ext[1] - ext[0] || 1)) * (Hd - 6)); });
      var line = svg('svg', { class: 'wm-spark wm-s1', viewBox: '0 0 ' + Wd + ' ' + Hd, width: Wd, height: Hd, 'aria-hidden': 'true' },
        svg('polyline', { points: pts.join(' '), class: 'wm-line' }), svg('circle', { cx: Wd, cy: pts[pts.length - 1].split(',')[1], r: 2.5, class: 'wm-dot' }));
      var first = xs[0], last = xs[xs.length - 1], ch = first ? (last - first) / Math.abs(first) : 0;
      var good = v.better === 'lower' ? ch <= 0 : ch >= 0;
      return [W.inline(r.label), line, W.fmt(last) + (v.unit ? ' ' + v.unit : ''), h('span', 'wm-delta wm-' + (ch === 0 ? 'info' : good ? 'pos' : 'neg'), (ch > 0 ? '▲ ' : ch < 0 ? '▼ ' : '') + W.fmt(Math.abs(ch), { style: 'percent', maximumFractionDigits: 1 })), W.fmt(ext[0]), W.fmt(ext[1])];
    });
    el.appendChild(W.table(['', 'trend', 'last', 'change', 'min', 'max'], rows, { align: ['left', 'left', 'right', 'right', 'right', 'right'] }));
  }
});
