/*
 * keys — keyboard shortcuts as keycaps; "Mod" is ⌘ on Mac, Ctrl elsewhere.
 *   ```wimark-keys {"title": "Editor"}
 *   [["Mod+S", "Save"], ["Mod+Shift+P", "Command palette"], ["g g", "Go to top"]]
 *   ```
 */
WiMark.register('keys', {
  title: 'Shortcuts',
  description: 'Keyboard shortcuts as keycaps; "+" joins keys, a space makes a sequence, Mod adapts to the OS.',
  example: { opts: { title: 'Catalog' }, body: [['Mod+K', 'Search WiMarks'], ['Mod+Shift+L', 'Next theme'], ['g g', 'Back to the top'], ['Esc', 'Close the editor'], ['?', 'Show this list']] },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
    var names = { mod: mac ? '⌘' : 'Ctrl', cmd: '⌘', shift: mac ? '⇧' : 'Shift', alt: mac ? '⌥' : 'Alt', option: '⌥', ctrl: mac ? '⌃' : 'Ctrl', enter: '↵', up: '↑', down: '↓', left: '←', right: '→', tab: '⇥' };
    function keys(combo) {
      var out = [];
      String(combo).split(' ').forEach(function (chord, ci) {
        if (ci) out.push(h('span', 'wm-muted', ' then '));
        chord.split('+').forEach(function (k, ki) {
          if (ki) out.push(h('span', 'wm-key-plus', '+'));
          out.push(h('kbd', 'wm-key', names[k.toLowerCase()] || k));
        });
      });
      return out;
    }
    if (v.title) el.appendChild(h('div', 'wm-box-title', W.inline(v.title)));
    var dl = h('dl', 'wm-keys');
    W.rows(v.items, ['keys', 'action']).forEach(function (r) {
      dl.appendChild(h('div', 'wm-keys-row', h('dt', null, keys(r.keys)), h('dd', null, W.inline(r.action))));
    });
    el.appendChild(dl);
  }
});
