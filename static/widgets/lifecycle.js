/*
 * lifecycle — the versions of an API: added, changed, deprecated, removed.
 *   ```wimark-lifecycle {"added": "1.2", "deprecated": "2.0", "removed": "3.0", "use": "`OpenSite`"}
 *   ```
 */
WiMark.register('lifecycle', {
  title: 'API lifecycle',
  description: 'Since when an API exists, when it changed, was deprecated or removed, and what replaces it.',
  example: { opts: { added: '1.2', changed: '1.6', deprecated: '2.0', removed: '3.0', use: '`OpenSite(dir)`' } },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var stages = [['added', 'pos'], ['changed', 'info'], ['deprecated', 'warn'], ['removed', 'neg']].filter(function (s) { return v[s[0]]; });
    var ol = h('ol', 'wm-lifecycle');
    stages.forEach(function (s) {
      ol.appendChild(h('li', 'wm-lifecycle-stage wm-' + s[1], h('span', 'wm-icon', h('span', null, W.icon(s[1]))),
        h('span', 'wm-lifecycle-name', s[0]), h('code', null, 'v' + String(v[s[0]]).replace(/^v/, ''))));
    });
    el.appendChild(h('div', 'wm-box wm-lifecycle-box', ol, v.use ? h('div', 'wm-lifecycle-use', h('span', 'wm-label', 'use instead'), ' ', W.inline(v.use)) : null,
      v.note ? h('p', 'wm-text', W.inline(v.note)) : null));
  }
});
