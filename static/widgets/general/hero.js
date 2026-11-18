/*
 * hero — a large opening block: eyebrow, title, subtitle, text and actions.
 * data:   { "eyebrow"?, "title", "subtitle"?, "text"?, "actions"?: [{ "label", "href", "primary"? }] }
 * config: { "align": "left" | "center", "framed": true }
 */
WiMark.register('hero', {
  title: 'Hero',
  description: 'A large opening block with title, subtitle and call-to-action buttons.',
  example: {
    data: {
      eyebrow: 'v1.2', title: 'Markdown in, static site out.', subtitle: 'One binary, no runtime.',
      text: 'Sections, languages, themes and a hundred widgets — all from plain text.',
      actions: [{ label: 'Get started', href: '#', primary: true }, { label: 'Catalog', href: '#' }]
    },
    config: { align: 'left', framed: true }
  },
  choices: { align: ['left', 'center'] },
  mount: function (el, data, config) {
    var W = WiMark, h = W.h;
    el.appendChild(h('header', 'wm-hero wm-hero-' + (config.align === 'center' ? 'center' : 'left') + (config.framed !== false ? ' wm-card' : ''),
      data.eyebrow ? h('div', 'wm-label', data.eyebrow) : null,
      h('div', { class: 'wm-hero-title', role: 'heading', 'aria-level': '2' }, W.inline(data.title || '')),
      data.subtitle ? h('div', 'wm-hero-sub', W.inline(data.subtitle)) : null,
      data.text ? W.paras(data.text) : null,
      W.list(data.actions).length ? h('div', 'wm-row', W.list(data.actions).map(function (a) {
        return W.url(a.href) ? h('a', { class: 'wm-btn' + (a.primary ? ' wm-btn-accent' : ''), href: W.url(a.href) }, a.label) : null;
      })) : null));
  }
});
