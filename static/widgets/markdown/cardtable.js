/*
 * cardtable — table rows shown as cards: readable on any width.
 * data:   like table
 * config: { "title_column": 0, "columns": 2 }
 */
WiMark.register('cardtable', {
  title: 'Card table',
  description: 'Each row becomes a card with labelled fields — tables that survive phones.',
  example: {
    data: [
      { Name: 'light', Class: 'monochrome', Panels: 'slate', Frame: 'slate-2' },
      { Name: 'duo', Class: 'bicolor', Panels: 'white', Frame: 'slate + amber' },
      { Name: 'spectrum', Class: 'colored', Panels: 'paper', Frame: 'eight hues' }
    ],
    config: { title_column: 0, columns: 3 }
  },
  mount: function (el, data, config) {
    var W = WiMark, h = W.h;
    var t = W.tabular(data), tc = Math.min(Math.max(0, W.num(config.title_column, 0)), t.cols.length - 1);
    var grid = h('div', { class: 'wm-grid wm-cardtable', style: { '--cols': String(Math.max(1, W.num(config.columns, 2))) } });
    t.rows.forEach(function (r) {
      grid.appendChild(h('div', 'wm-card wm-cardtable-card', h('div', 'wm-cards-title', W.cell(r[tc], t.cols[tc])),
        h('dl', null, t.cols.map(function (c, i) {
          return i === tc ? null : h('div', null, h('dt', 'wm-label', c.label), h('dd', null, W.cell(r[i], c)));
        }))));
    });
    el.appendChild(grid);
  }
});
