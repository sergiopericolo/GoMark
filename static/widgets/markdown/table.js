/*
 * table — a Markdown table with column formats, alignment, caption and stripes.
 * data:   { "columns": ["a", { "key", "label", "align", "format" }], "rows": [[…] | {…}] }
 *         or [{…}, …] or [["header", …], [row], …]
 * config: { "caption"?, "zebra": true, "compact": false, "row_header": false }
 *         formats: "percent", "currency:EUR", "date"; booleans show ✓ / ✕
 */
WiMark.register('table', {
  title: 'Table',
  description: 'A richer Markdown table: column formats, alignment, caption, stripes, row headers.',
  example: {
    data: {
      columns: ['Language', { key: 'pages', label: 'Pages' }, { key: 'done', label: 'Translated', format: 'percent' }, { key: 'cost', label: 'Cost', format: 'currency:EUR' }, 'Reviewed'],
      rows: [['English', 120, 1, 0, true], ['Italiano', 96, 0.8, 340, true], ['Deutsch', 31, 0.26, 410.5, false]]
    },
    config: { caption: 'Translation status', zebra: true, compact: false, row_header: true }
  },
  mount: function (el, data, config) {
    var W = WiMark;
    var t = W.tabular(data);
    el.appendChild(W.table(t.cols.map(function (c) { return c.label; }),
      t.rows.map(function (r) { return t.cols.map(function (c, i) { return W.cell(r[i], c); }); }),
      { caption: config.caption, rowHeader: !!config.row_header, align: t.cols.map(function (c) { return c.align; }),
        cls: (config.zebra !== false ? 'wm-zebra' : '') + (config.compact ? ' wm-compact' : '') }));
  }
});
