/*
 * cards — a grid of cards with title, text, meta, tags and an optional link.
 * data:   [{ "title", "text"?, "meta"?, "tags"?: [], "href"?, "image"? }]
 * config: { "columns": 3 }
 */
WiMark.register('cards', {
  title: 'Cards',
  description: 'A responsive grid of cards; each can link somewhere and carry tags.',
  example: {
    data: [
      { title: 'Sections', text: 'Folders with their own **layout** and theme.', meta: 'engine', tags: ['toml'] },
      { title: 'WiMark', text: 'A hundred widgets that follow the theme.', meta: 'widgets', href: '#' },
      { title: 'Languages', text: 'Every page in every language, with a notice.', meta: 'i18n' }
    ],
    config: { columns: 3 }
  },
  mount: function (el, data, config) {
    var W = WiMark, h = W.h;
    var grid = h('div', { class: 'wm-grid wm-cards', style: { '--cols': String(Math.max(1, W.num(config.columns, 3))) } });
    W.list(data).forEach(function (c) {
      var href = W.url(c.href);
      var card = h(href ? 'a' : 'div', { class: 'wm-card wm-cards-item' + (href ? ' wm-cards-link' : ''), href: href || null },
        c.image ? h('img', { src: W.asset(c.image), alt: '', loading: 'lazy' }) : null,
        c.meta ? h('div', 'wm-label', c.meta) : null,
        h('div', 'wm-cards-title', W.inline(c.title || '')),
        c.text ? W.paras(c.text) : null,
        W.list(c.tags).length ? h('div', 'wm-row', W.list(c.tags).map(function (t) { return h('span', 'wm-tag', t); })) : null,
        href ? h('span', { class: 'wm-cards-arrow', 'aria-hidden': 'true' }, '→') : null);
      grid.appendChild(card);
    });
    el.appendChild(grid);
  }
});
