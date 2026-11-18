/*
 * badges — small labels, optionally split as label | value, with a state.
 * data:   [{ "label", "value"?, "state"?, "href"? }] or ["label", …]
 * config: { "size": "normal" | "large" }
 */
WiMark.register('badges', {
  title: 'Badges',
  description: 'Shields-style labels (label | value) with optional state and link.',
  example: {
    data: [
      { label: 'build', value: 'passing', state: 'ok' },
      { label: 'coverage', value: '87%', state: 'warning' },
      { label: 'go', value: '1.24' },
      { label: 'license', value: 'MIT', href: 'https://opensource.org/licenses/MIT' },
      'stable'
    ],
    config: { size: 'normal' }
  },
  choices: { size: ['normal', 'large'] },
  mount: function (el, data, config) {
    var W = WiMark, h = W.h;
    var row = h('div', 'wm-row wm-badges' + (config.size === 'large' ? ' wm-badges-large' : ''));
    W.list(data).forEach(function (b) {
      if (typeof b !== 'object') b = { label: b };
      var parts = [h('span', 'wm-badge-label', b.label)];
      if (b.value !== undefined) {
        parts.push(h('span', 'wm-badge-value' + (b.state ? ' wm-' + W.state(b.state) : ''),
          b.state ? h('span', { class: 'wm-badge-icon', 'aria-hidden': 'true' }, W.icon(b.state) + ' ') : null, String(b.value)));
      }
      var href = W.url(b.href);
      row.appendChild(href ? h('a', { class: 'wm-badge', href: href }, parts) : h('span', 'wm-badge', parts));
    });
    el.appendChild(row);
  }
});
