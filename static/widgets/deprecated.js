/*
 * deprecated — a deprecation notice: since when, what to use, when it goes.
 *   ```wimark-deprecated {"since": "2.0", "use": "`Site.Build`", "removal": "3.0"}
 *   Optional explanation.
 *   ```
 */
WiMark.register('deprecated', {
  title: 'Deprecated',
  description: 'A deprecation notice with the version, the replacement and the planned removal.',
  input: 'text',
  example: { opts: { since: '2.0', use: '`Site.Build(lang, out)`', removal: '3.0' }, body: '`BuildAll` ignored the language list; `Build` with an empty language builds every one.' },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    el.appendChild(h('aside', { class: 'wm-deprecated wm-warn', role: 'note' },
      h('div', 'wm-deprecated-head', h('span', 'wm-icon', h('span', null, '!')), h('strong', null, 'Deprecated'),
        v.since ? h('span', 'wm-tag', 'since v' + String(v.since).replace(/^v/, '')) : null,
        v.removal ? h('span', 'wm-tag', 'removed in v' + String(v.removal).replace(/^v/, '')) : null),
      v.use ? h('div', null, 'Use ', W.inline(v.use), ' instead.') : null,
      v.text ? W.prose(v.text) : null));
  }
});
