/*
 * bullets — a list with special markers: check, cross, arrow, star, number, or any symbol.
 * data:   [{ "text", "marker"?, "state"?, "children"?: [] }] or ["text", …]
 * config: { "marker": "arrow" | "check" | "cross" | "star" | "dot" | "number" | "dash" }
 */
WiMark.register('bullets', {
  title: 'Special bullets',
  description: 'Nested list with marker per list or per item (✓ ✕ → ★ numbers…), optionally with a state.',
  example: {
    data: [
      { text: 'Write in **Markdown**', marker: 'check', state: 'ok' },
      { text: 'Pick a theme', marker: 'check', state: 'ok', children: ['monochrome', 'bicolor', 'colored'] },
      { text: 'Hardcode colors in widgets', marker: 'cross', state: 'error' },
      'Publish with one command'
    ],
    config: { marker: 'arrow' }
  },
  choices: { marker: ['arrow', 'check', 'cross', 'star', 'dot', 'number', 'dash'] },
  mount: function (el, data, config) {
    var W = WiMark, h = W.h;
    var glyphs = { arrow: '→', check: '✓', cross: '✕', star: '★', dot: '•', dash: '–' };
    function render(items, depth) {
      var ul = h('ul', 'wm-bullets' + (depth ? ' wm-bullets-nested' : ''));
      W.list(items).forEach(function (it, i) {
        if (typeof it !== 'object') it = { text: it };
        var m = it.marker || config.marker || 'arrow';
        var mark = m === 'number' ? (i + 1) + '.' : glyphs[m] || String(m).slice(0, 2);
        ul.appendChild(h('li', it.state ? 'wm-' + W.state(it.state) : null,
          h('span', { class: 'wm-bullets-mark' + (it.state ? ' wm-bullets-state' : ''), 'aria-hidden': 'true' }, mark),
          h('div', null, W.inline(it.text || ''), it.children ? render(it.children, depth + 1) : null)));
      });
      return ul;
    }
    el.appendChild(render(data, 0));
  }
});
