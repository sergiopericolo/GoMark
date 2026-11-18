/*
 * kpi — headline numbers with change, target and a small trend.
 * data:   [{ "label", "value", "unit"?, "delta"?, "good"?: "up" | "down", "target"?, "note"?, "trend"?: [] }]
 * config: { "columns": 3 }
 */
WiMark.register('kpi', {
  title: 'KPI tiles',
  description: 'Big numbers with ▲▼ change (good or bad by direction), target bar and sparkline.',
  example: {
    data: [
      { label: 'Pages', value: 42, delta: 8, target: 60, note: 'this year', trend: [10, 14, 20, 26, 31, 38, 42] },
      { label: 'Build time', value: 120, unit: 'ms', delta: -15, good: 'down', trend: [180, 170, 150, 160, 140, 135, 120] },
      { label: 'Coverage', value: 87, unit: '%', delta: -2, target: 100, trend: [80, 84, 88, 90, 89, 89, 87] }
    ],
    config: { columns: 3 }
  },
  mount: function (el, data, config) {
    var W = WiMark, h = W.h, svg = W.svg;
    var items = W.list(data);
    var grid = h('div', { class: 'wm-grid wm-kpi', style: { '--cols': String(Math.max(1, W.num(config.columns, Math.min(items.length, 3)))) } });
    items.forEach(function (k) {
      var card = h('div', 'wm-card wm-kpi-card', h('div', 'wm-label', k.label || ''),
        h('div', 'wm-kpi-value', h('span', null, typeof k.value === 'number' ? W.fmt(k.value) : String(k.value === undefined ? '' : k.value)), k.unit ? h('span', 'wm-kpi-unit', k.unit) : null));
      if (k.delta !== undefined) {
        var d = W.num(k.delta), better = k.good === 'down' ? d < 0 : d > 0;
        var st = d === 0 ? 'info' : better ? 'pos' : 'neg';
        card.appendChild(h('div', 'wm-kpi-delta wm-' + st, h('span', { class: 'wm-icon', 'aria-hidden': 'true' }, h('span', null, d > 0 ? '▲' : d < 0 ? '▼' : '■')),
          (d > 0 ? '+' : '') + W.fmt(d) + (k.unit === '%' ? ' pt' : k.unit ? ' ' + k.unit : ''), h('span', 'wm-muted', better ? ' better' : d === 0 ? ' same' : ' worse')));
      }
      var trend = W.list(k.trend).map(Number);
      if (trend.length > 1) {
        var ext = W.extent(trend), sw = 160, sh = 34;
        var pts = trend.map(function (v, i) { return ((i * sw) / (trend.length - 1)) + ',' + (sh - 3 - ((v - ext[0]) / (ext[1] - ext[0] || 1)) * (sh - 6)); });
        card.appendChild(svg('svg', { class: 'wm-kpi-spark', viewBox: '0 0 ' + sw + ' ' + sh, preserveAspectRatio: 'none', 'aria-hidden': 'true' },
          svg('polyline', { points: pts.join(' '), class: 'wm-line wm-s1' })));
      }
      if (k.target) {
        var pct = Math.max(0, Math.min(100, (100 * W.num(k.value)) / W.num(k.target)));
        card.appendChild(h('div', { class: 'wm-progress-track wm-kpi-bar', role: 'progressbar', 'aria-valuenow': W.num(k.value), 'aria-valuemax': W.num(k.target), title: Math.round(pct) + '% of ' + W.fmt(W.num(k.target)) },
          h('div', { class: 'wm-progress-fill', style: { width: pct + '%' } })));
      }
      if (k.note) card.appendChild(h('div', 'wm-muted wm-small', k.note));
      grid.appendChild(card);
    });
    el.appendChild(grid);
  }
});
