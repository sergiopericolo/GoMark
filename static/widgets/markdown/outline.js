/*
 * outline — a nested list the reader can fold, with optional numbering.
 * data:   [{ "text", "children"?: […] }] or ["text", …]
 * config: { "open": 1, "numbered": true }   (open: levels open at first)
 */
WiMark.register('outline', {
  title: 'Outline',
  description: 'A foldable nested list with hierarchical numbering.',
  example: {
    data: [
      { text: 'Site', children: [{ text: 'gomark.toml' }, { text: 'sections/', children: ['notes.toml', 'about.toml'] }] },
      { text: 'Content', children: [{ text: 'en/', children: ['notes/…', 'about/index.md'] }, { text: 'it/', children: ['notes/…'] }] },
      'Output: dist/'
    ],
    config: { open: 1, numbered: true }
  },
  mount: function (el, data, config) {
    var W = WiMark, h = W.h;
    var open = W.num(config.open, 1);
    function render(items, depth, prefix) {
      var ul = h('ul', 'wm-outline-list');
      W.list(items).forEach(function (it, i) {
        if (typeof it !== 'object') it = { text: it };
        var num = config.numbered !== false ? h('span', 'wm-outline-n', prefix + (i + 1) + '.') : null;
        var kids = W.list(it.children);
        if (kids.length) {
          ul.appendChild(h('li', null, h('details', { open: depth < open },
            h('summary', null, num, h('span', null, W.inline(it.text || ''))), render(kids, depth + 1, prefix + (i + 1) + '.'))));
        } else {
          ul.appendChild(h('li', 'wm-outline-leaf', num, h('span', null, W.inline(it.text || ''))));
        }
      });
      return ul;
    }
    el.appendChild(h('div', 'wm-outline', render(data, 0, '')));
  }
});
