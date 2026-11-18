/*
 * filtertable — a table with a search box (and an optional column filter).
 * data:   like table
 * config: { "placeholder"?, "filter_column"?: "<column key>", "zebra": true }
 */
WiMark.register('filtertable', {
  title: 'Filterable table',
  description: 'Search across rows; optionally filter by the values of one column.',
  example: {
    data: {
      columns: ['Command', 'Group', 'Description'],
      rows: [
        ['build', 'site', 'Build every language'], ['serve', 'site', 'Serve the output'],
        ['new', 'content', 'Create a page or folder'], ['mv', 'content', 'Move a page with its translations'],
        ['theme', 'settings', 'List, set or check themes'], ['ai', 'ai', 'Translate, convert, create widgets']
      ]
    },
    config: { placeholder: 'filter commands…', filter_column: 'Group', zebra: true }
  },
  mount: function (el, data, config) {
    var W = WiMark, h = W.h;
    var t = W.tabular(data);
    var fc = t.cols.map(function (c) { return c.key; }).indexOf(config.filter_column);
    var input = h('input', { type: 'search', class: 'wm-input', placeholder: config.placeholder || W.t('search'), 'aria-label': W.t('search') });
    var select = null;
    if (fc >= 0) {
      var values = t.rows.map(function (r) { return String(r[fc]); }).filter(function (v, i, a) { return a.indexOf(v) === i; }).sort();
      select = h('select', { class: 'wm-input', 'aria-label': t.cols[fc].label }, h('option', { value: '' }, W.t('all')),
        values.map(function (v) { return h('option', { value: v }, v); }));
    }
    var count = h('span', 'wm-muted wm-small');
    var holder = h('div');
    function draw() {
      var q = input.value.trim().toLowerCase(), sel = select ? select.value : '';
      var rows = t.rows.filter(function (r) {
        return (!sel || String(r[fc]) === sel) && (!q || r.join(' ').toLowerCase().indexOf(q) >= 0);
      });
      count.textContent = rows.length + ' / ' + t.rows.length;
      holder.textContent = '';
      holder.appendChild(W.table(t.cols.map(function (c) { return c.label; }),
        rows.map(function (r) { return t.cols.map(function (c, i) { return W.cell(r[i], c); }); }),
        { align: t.cols.map(function (c) { return c.align; }), cls: config.zebra !== false ? 'wm-zebra' : '' }));
    }
    input.addEventListener('input', draw);
    if (select) select.addEventListener('change', draw);
    el.appendChild(h('div', 'wm-filter-bar', input, select, count));
    el.appendChild(holder);
    draw();
  }
});
