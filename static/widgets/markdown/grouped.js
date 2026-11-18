/*
 * grouped — a table whose rows are grouped under headings, with optional subtotals.
 * data:   { "columns": […], "groups": [{ "title", "rows": [[…] | {…}] }] }
 * config: { "subtotals": true, "label": "Subtotal" }
 */
WiMark.register('grouped', {
  title: 'Grouped table',
  description: 'Rows grouped under headings, with optional subtotals of numeric columns.',
  example: {
    data: {
      columns: ['Item', { key: 'Hours', label: 'Hours' }, { key: 'Cost', label: 'Cost', format: 'currency:EUR' }],
      groups: [
        { title: 'Design', rows: [['Themes', 12, 960], ['Widgets look', 20, 1600]] },
        { title: 'Engine', rows: [['Sections', 8, 640], ['Languages', 10, 800], ['Images', 6, 480]] }
      ]
    },
    config: { subtotals: true, label: 'Subtotal' }
  },
  mount: function (el, data, config) {
    var W = WiMark, h = W.h;
    var groups = W.list(data.groups);
    var first = W.tabular({ columns: data.columns, rows: [].concat.apply([], groups.map(function (g) { return W.list(g.rows); })) });
    var cols = first.cols;
    var tbl = h('table', 'wm-table wm-grouped');
    tbl.appendChild(h('thead', null, h('tr', null, cols.map(function (c) { return h('th', { scope: 'col', class: c.align ? 'wm-' + c.align : null }, c.label); }))));
    groups.forEach(function (g) {
      var t = W.tabular({ columns: data.columns, rows: g.rows });
      var body = h('tbody');
      body.appendChild(h('tr', 'wm-group-row', h('th', { scope: 'rowgroup', colspan: cols.length }, g.title || '')));
      t.rows.forEach(function (r) {
        body.appendChild(h('tr', null, cols.map(function (c, i) { return h('td', c.align ? 'wm-' + c.align : null, W.cell(r[i], c)); })));
      });
      if (config.subtotals !== false) {
        body.appendChild(h('tr', 'wm-subtotal', cols.map(function (c, i) {
          if (i === 0) return h('td', null, config.label || W.t('total'));
          var nums = t.rows.map(function (r) { return r[i]; });
          return h('td', c.align ? 'wm-' + c.align : null, nums.every(function (v) { return typeof v === 'number'; }) ? W.cell(W.sum(nums), c) : '');
        })));
      }
      tbl.appendChild(body);
    });
    el.appendChild(h('div', 'wm-table-wrap', tbl));
  }
});
