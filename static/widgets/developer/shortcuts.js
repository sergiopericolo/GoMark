/*
 * shortcuts — keyboard shortcuts as keycaps, grouped; Mod is ⌘ on Mac, Ctrl elsewhere.
 * data:   [{ "keys": "Mod+Shift+K" | ["Mod", "K"], "action", "group"? }]
 * config: { "platform": "auto" | "mac" | "other" }
 */
WiMark.register('shortcuts', {
  title: 'Keyboard shortcuts',
  description: 'Keycaps for shortcuts, grouped; Mod adapts to Mac (⌘) or others (Ctrl).',
  example: {
    data: [
      { group: 'Catalog', keys: 'Mod+F', action: 'Search widgets' },
      { group: 'Catalog', keys: 'Tab', action: 'Next control in an editor' },
      { group: 'Tabs', keys: '→', action: 'Next tab' },
      { group: 'Tabs', keys: '←', action: 'Previous tab' },
      { group: 'Editor', keys: 'Mod+Shift+C', action: 'Copy as Markdown' }
    ],
    config: { platform: 'auto' }
  },
  choices: { platform: ['auto', 'mac', 'other'] },
  mount: function (el, data, config) {
    var W = WiMark, h = W.h;
    var mac = config.platform === 'mac' || (config.platform !== 'other' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent));
    var names = { mod: mac ? '⌘' : 'Ctrl', shift: mac ? '⇧' : 'Shift', alt: mac ? '⌥' : 'Alt', ctrl: mac ? '⌃' : 'Ctrl', enter: '↵', esc: 'Esc' };
    var groups = {}, order = [];
    W.list(data).forEach(function (s) {
      var g = s.group || '';
      if (!groups[g]) { groups[g] = []; order.push(g); }
      groups[g].push(s);
    });
    order.forEach(function (g) {
      if (g) el.appendChild(h('div', 'wm-label wm-api-label', g));
      el.appendChild(h('dl', 'wm-cli-list', groups[g].map(function (s) {
        var keys = Array.isArray(s.keys) ? s.keys : String(s.keys || '').split('+');
        return [h('dt', null, keys.map(function (k, i) {
          return [i ? h('span', 'wm-muted', ' + ') : null, h('kbd', 'wm-kbd', names[String(k).toLowerCase()] || k)];
        })), h('dd', null, W.inline(s.action || ''))];
      })));
    });
  }
});
