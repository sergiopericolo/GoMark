/*
 * csv — paste CSV (quotes, any separator) and get a formatted table.
 *   ```wimark-csv {"sep": ",", "caption": "Measurements", "sort": true}
 *   n,time_ms
 *   1000,0.8
 *   ```
 */
WiMark.register('csv', {
  title: 'CSV table',
  description: 'CSV or TSV text (quoted fields; the separator is guessed when omitted) as a sortable table.',
  input: 'text',
  example: { opts: { caption: 'Binary search vs linear scan', sort: true }, body: 'n,linear (µs),binary (µs)\n1000,1.9,0.05\n10000,19.4,0.07\n100000,196,0.09\n1000000,1980,0.11' },
  mount: function (el, v) {
    var W = WiMark;
    var rows = W.parseCSV(v.text, v.sep), head = rows.shift() || [];
    W.grid(el, head, rows, { caption: v.caption, align: W.aligns(v.align), sort: v.sort, filter: v.filter, total: v.total, zebra: v.zebra });
  }
});
