/*
 * badges — shields: label | value, with an optional state and link.
 *   ```wimark-badges
 *   [["build", "passing", "ok"], ["coverage", "87%", "warn"], ["go", "1.24"], ["license", "MIT", "", "LICENSE"]]
 *   ```
 */
WiMark.register('badges', {
  title: 'Badges',
  description: 'Shields-style label | value badges; a state adds an icon, a fourth slot a link.',
  example: { body: [['build', 'passing', 'ok'], ['tests', '412 / 412', 'ok'], ['coverage', '78%', 'warn'], ['go', '1.24'], ['license', 'MIT', '', 'https://opensource.org/license/mit']] },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var row = h('div', 'wm-badges');
    W.rows(v.items, ['label', 'value', 'state', 'href']).forEach(function (b) {
      var st = b.state ? W.state(b.state) : '';
      var badge = h('span', 'wm-badge' + (st ? ' wm-' + st : ''), h('span', 'wm-badge-label', b.label),
        h('span', 'wm-badge-value', st ? h('span', { class: 'wm-badge-icon', 'aria-hidden': 'true' }, W.icon(st) + ' ') : null, b.value === undefined ? '' : String(b.value)));
      row.appendChild(W.url(b.href) ? h('a', { href: W.url(b.href), class: 'wm-badge-link' }, badge) : badge);
    });
    el.appendChild(row);
  }
});
