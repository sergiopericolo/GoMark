/*
 * stack — a technology stack, grouped by layer, with versions and notes.
 * data:   [{ "layer", "items": [{ "name", "version"?, "note"?, "href"? } | "name"] }]
 * config: { "layout": "rows" | "grid" }
 */
WiMark.register('stack', {
  title: 'Tech stack',
  description: 'Tools grouped by layer with versions, notes and links.',
  example: {
    data: [
      { layer: 'language', items: [{ name: 'Go', version: '1.24' }, { name: 'JavaScript', note: 'ES5, no build step' }] },
      { layer: 'libraries', items: [{ name: 'goldmark', version: '1.7', href: 'https://github.com/yuin/goldmark' }, { name: 'BurntSushi/toml', version: '1.6' }] },
      { layer: 'browser', items: ['highlight.js', 'MathJax'] },
      { layer: 'AI', items: [{ name: 'Claude API', note: 'optional' }, { name: 'any local CLI', note: 'GOMARK_AI_COMMAND' }] }
    ],
    config: { layout: 'rows' }
  },
  choices: { layout: ['rows', 'grid'] },
  mount: function (el, data, config) {
    var W = WiMark, h = W.h;
    var groups = W.list(data);
    el.appendChild(h('div', { class: 'wm-stack wm-stack-' + (config.layout === 'grid' ? 'grid' : 'rows'), style: { '--cols': String(Math.min(4, groups.length || 1)) } },
      groups.map(function (g) {
        return h('section', 'wm-stack-layer', h('div', 'wm-label', g.layer || ''), h('div', 'wm-row', W.list(g.items).map(function (it) {
          if (typeof it !== 'object') it = { name: it };
          var href = W.url(it.href);
          return h(href ? 'a' : 'span', { class: 'wm-stack-item', href: href || null, title: it.note || null },
            h('strong', null, it.name), it.version ? h('span', 'wm-muted', ' ' + it.version) : null, it.note ? h('span', 'wm-stack-note', ' · ' + it.note) : null);
        })));
      })));
  }
});
