/*
 * profile — a person or project card: picture, role, facts and links.
 * data:   { "name", "role"?, "text"?, "image"?, "facts"?: [{ "label", "value" }], "links"?: [{ "label", "href" }] }
 * config: { "layout": "horizontal" | "vertical" }
 */
WiMark.register('profile', {
  title: 'Profile',
  description: 'A person or project card with picture, facts and links.',
  example: {
    data: {
      name: 'Ada Lovelace', role: 'Analyst · Writer',
      text: 'Wrote the first published **algorithm** for a machine.',
      facts: [{ label: 'Born', value: '1815' }, { label: 'Field', value: 'Mathematics' }],
      links: [{ label: 'Wikipedia', href: 'https://en.wikipedia.org/wiki/Ada_Lovelace' }]
    },
    config: { layout: 'horizontal' }
  },
  choices: { layout: ['horizontal', 'vertical'] },
  mount: function (el, data, config) {
    var W = WiMark, h = W.h;
    var initials = String(data.name || '?').split(/\s+/).map(function (w) { return w.charAt(0); }).join('').slice(0, 2).toUpperCase();
    var pic = data.image ? h('img', { class: 'wm-profile-pic', src: W.asset(data.image), alt: data.name || '' })
      : h('div', { class: 'wm-profile-pic wm-profile-initials', 'aria-hidden': 'true' }, initials);
    el.appendChild(h('div', 'wm-card wm-profile wm-profile-' + (config.layout === 'vertical' ? 'vertical' : 'horizontal'),
      pic,
      h('div', 'wm-profile-body',
        h('div', 'wm-profile-name', data.name || ''),
        data.role ? h('div', 'wm-muted', data.role) : null,
        data.text ? W.paras(data.text) : null,
        W.list(data.facts).length ? h('dl', 'wm-profile-facts', W.list(data.facts).map(function (f) {
          return [h('dt', 'wm-label', f.label), h('dd', null, W.inline(f.value))];
        })) : null,
        W.list(data.links).length ? h('div', 'wm-row', W.list(data.links).map(function (l) {
          return W.url(l.href) ? h('a', { class: 'wm-tag', href: W.url(l.href) }, l.label) : null;
        })) : null)));
  }
});
