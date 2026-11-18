/*
 * sortable — a table the reader sorts by clicking a column header.
 * data:   like table
 * config: { "sort": "<column key>"?, "order": "asc" | "desc", "zebra": true }
 */
WiMark.register('sortable', {
  title: 'Sortable table',
  description: 'Click a header to sort; numbers, dates and text each sort naturally.',
  example: {
    data: [
      { Widget: 'line', Class: 'data', Lines: 64, Updated: '2026-11-02' },
      { Widget: 'flowchart', Class: 'developer', Lines: 118, Updated: '2026-10-21' },
      { Widget: 'timeline', Class: 'general', Lines: 49, Updated: '2026-11-18' },
      { Widget: 'diff', Class: 'markdown', Lines: 87, Updated: '2026-09-30' }
    ],
    config: { sort: 'Lines', order: 'desc', zebra: true }
  },
  choices: { order: ['asc', 'desc'] },
  mount: function (el, data, config) {
    var W = WiMark, h = W.h;
    var t = W.tabular(data);
    var col = Math.max(0, t.cols.map(function (c) { return c.key; }).indexOf(config.sort));
    var dir = config.order === 'desc' ? -1 : 1;
    if (config.sort === undefined) col = -1;
    function key(v) {
      if (typeof v === 'number') return v;
      if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)) return W.date(v).getTime();
      return v === null || v === undefined ? '' : String(v).toLowerCase();
    }
    function draw() {
      var rows = t.rows.slice();
      if (col >= 0) rows.sort(function (a, b) {
        var x = key(a[col]), y = key(b[col]);
        return (x < y ? -1 : x > y ? 1 : 0) * dir;
      });
      var head = t.cols.map(function (c, i) {
        var b = h('button', { type: 'button', class: 'wm-sort' }, c.label, h('span', { class: 'wm-sort-mark', 'aria-hidden': 'true' }, i === col ? (dir > 0 ? ' ▲' : ' ▼') : ' ↕'));
        b.addEventListener('click', function () { dir = i === col ? -dir : 1; col = i; draw(); });
        return b;
      });
      var tbl = W.table(head, rows.map(function (r) { return t.cols.map(function (c, i) { return W.cell(r[i], c); }); }),
        { align: t.cols.map(function (c) { return c.align; }), cls: config.zebra !== false ? 'wm-zebra' : '' });
      tbl.querySelectorAll('thead th').forEach(function (th, i) {
        th.setAttribute('aria-sort', i === col ? (dir > 0 ? 'ascending' : 'descending') : 'none');
      });
      el.textContent = '';
      el.appendChild(tbl);
    }
    draw();
  }
});
