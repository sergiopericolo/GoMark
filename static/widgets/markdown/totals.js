/*
 * totals — a table with a footer of totals (and averages) for numeric columns.
 * data:   like table
 * config: { "label": "Total", "average": false, "zebra": true }
 */
WiMark.register('totals', {
  title: 'Table with totals',
  description: 'Adds a total (and optionally an average) row for every numeric column.',
  example: {
    data: {
      columns: ['Month', 'Pages', 'Words', { key: 'Share', label: 'Share', format: 'percent' }],
      rows: [['September', 12, 8400, 0.2], ['October', 21, 15100, 0.35], ['November', 27, 19800, 0.45]]
    },
    config: { label: 'Total', average: true, zebra: true }
  },
  mount: function (el, data, config) {
    var W = WiMark, h = W.h;
    var t = W.tabular(data);
    var numeric = t.cols.map(function (c, i) { return t.rows.length && t.rows.every(function (r) { return typeof r[i] === 'number'; }); });
    var wrap = W.table(t.cols.map(function (c) { return c.label; }),
      t.rows.map(function (r) { return t.cols.map(function (c, i) { return W.cell(r[i], c); }); }),
      { align: t.cols.map(function (c) { return c.align; }), cls: config.zebra !== false ? 'wm-zebra' : '' });
    var foot = h('tfoot');
    function line(label, fn) {
      foot.appendChild(h('tr', null, t.cols.map(function (c, i) {
        if (i === 0) return h('th', { scope: 'row' }, label);
        return h('td', 'wm-right', numeric[i] ? W.cell(fn(t.rows.map(function (r) { return r[i]; })), c) : '');
      })));
    }
    line(config.label || W.t('total'), W.sum);
    if (config.average) line('⌀', function (v) { return W.sum(v) / (v.length || 1); });
    wrap.querySelector('table').appendChild(foot);
    el.appendChild(wrap);
  }
});
