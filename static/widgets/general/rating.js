/*
 * rating — scores shown as stars, dots or segments.
 * data:   [{ "label", "value", "max"? }]
 * config: { "max": 5, "symbol": "star" | "dot" | "bar", "show_value": true }
 */
WiMark.register('rating', {
  title: 'Rating',
  description: 'Scores as stars, dots or segments, with half steps.',
  example: {
    data: [
      { label: 'Speed', value: 5 },
      { label: 'Docs', value: 3.5 },
      { label: 'Ease of use', value: 4 }
    ],
    config: { max: 5, symbol: 'star', show_value: true }
  },
  choices: { symbol: ['star', 'dot', 'bar'] },
  mount: function (el, data, config) {
    var W = WiMark, h = W.h;
    var glyph = { star: '★', dot: '●', bar: '▮' }[config.symbol] || '★';
    var tbl = h('div', 'wm-rating');
    W.list(data).forEach(function (r) {
      var max = W.num(r.max, W.num(config.max, 5)), v = Math.max(0, Math.min(max, W.num(r.value)));
      var row = h('div', { class: 'wm-rating-row', role: 'img', 'aria-label': (r.label || '') + ': ' + v + ' / ' + max });
      row.appendChild(h('span', 'wm-rating-label', W.inline(r.label || '')));
      var marks = h('span', { class: 'wm-rating-marks', 'aria-hidden': 'true' });
      for (var i = 1; i <= max; i++) {
        var cls = v >= i ? 'full' : v >= i - 0.5 ? 'half' : 'empty';
        marks.appendChild(h('span', 'wm-rating-mark ' + cls, glyph));
      }
      row.appendChild(marks);
      if (config.show_value !== false) row.appendChild(h('span', 'wm-muted wm-right', W.fmt(v) + '/' + max));
      tbl.appendChild(row);
    });
    el.appendChild(tbl);
  }
});
