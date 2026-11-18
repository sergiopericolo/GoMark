/*
 * links — a row of call-to-action buttons or a list of described links.
 * data:   [{ "label", "href", "text"?, "primary"? }]
 * config: { "layout": "buttons" | "list" }
 */
WiMark.register('links', {
  title: 'Links',
  description: 'Call-to-action buttons or a described link list.',
  example: {
    data: [
      { label: 'Get started', href: '#', primary: true, text: 'Install and create your first site.' },
      { label: 'Widget catalog', href: '#', text: 'Every WiMark, live, with an editor.' },
      { label: 'Source', href: 'https://github.com', text: 'Read the code.' }
    ],
    config: { layout: 'buttons' }
  },
  choices: { layout: ['buttons', 'list'] },
  mount: function (el, data, config) {
    var W = WiMark, h = W.h;
    var items = W.list(data).filter(function (l) { return W.url(l.href); });
    if (config.layout === 'list') {
      el.appendChild(h('ul', 'wm-links-list', items.map(function (l) {
        var external = /^https?:/i.test(l.href);
        return h('li', null, h('a', { href: W.url(l.href), rel: external ? 'noopener' : null },
          h('span', 'wm-links-label', l.label, external ? ' ↗' : ' →'), l.text ? h('span', 'wm-muted', W.inline(l.text)) : null));
      })));
      return;
    }
    el.appendChild(h('div', 'wm-row wm-links', items.map(function (l) {
      return h('a', { class: 'wm-btn wm-links-btn' + (l.primary ? ' wm-btn-accent' : ''), href: W.url(l.href), title: l.text || null }, l.label);
    })));
  }
});
