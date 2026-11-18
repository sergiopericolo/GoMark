/*
 * kanban — columns of cards (to do, doing, done…).
 * data:   [{ "column", "state"?, "cards": [{ "title", "text"?, "tags"? }] }]
 * config: { "counts": true }
 */
WiMark.register('kanban', {
  title: 'Kanban board',
  description: 'Columns of cards with counts; each column can carry a state.',
  example: {
    data: [
      { column: 'To do', cards: [{ title: 'Image WiMark', tags: ['widgets'] }, { title: 'AI translate' }] },
      { column: 'Doing', state: 'warning', cards: [{ title: 'Theme classes', text: 'mono · duo · spectrum' }] },
      { column: 'Done', state: 'ok', cards: [{ title: 'Section layouts' }, { title: 'Language switch' }] }
    ],
    config: { counts: true }
  },
  mount: function (el, data, config) {
    var W = WiMark, h = W.h;
    var cols = W.list(data);
    var board = h('div', { class: 'wm-kanban', style: { '--cols': String(Math.max(1, cols.length)) } });
    cols.forEach(function (c) {
      var cards = W.list(c.cards);
      board.appendChild(h('section', 'wm-kanban-col' + (c.state ? ' wm-' + W.state(c.state) : ''),
        h('header', 'wm-kanban-head', c.state ? h('span', { class: 'wm-icon', 'aria-hidden': 'true' }, h('span', null, W.icon(c.state))) : null,
          h('span', 'wm-label', c.column || ''), config.counts !== false ? h('span', 'wm-tag', String(cards.length)) : null),
        h('ul', null, cards.map(function (k) {
          if (typeof k !== 'object') k = { title: k };
          return h('li', 'wm-card wm-kanban-card', h('div', 'wm-kanban-title', W.inline(k.title || '')),
            k.text ? W.paras(k.text) : null,
            W.list(k.tags).length ? h('div', 'wm-row', W.list(k.tags).map(function (t) { return h('span', 'wm-tag', t); })) : null);
        }))));
    });
    el.appendChild(board);
  }
});
