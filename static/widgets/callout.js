/*
 * callout — a boxed note: note, tip, important, warning, danger.
 *   ```wimark-callout {"kind": "warning", "title": "Breaking change"}
 *   Text with **markup**, $math$ and "- " lists.
 *   ```
 */
WiMark.register('callout', {
  title: 'Callout',
  description: 'A boxed note with an icon and a title: note, tip, important, warning, danger.',
  input: 'text',
  example: { opts: { kind: 'warning', title: 'Breaking change' }, body: '`Open` now fails when `gomark.toml` is missing.\n\n- run `gomark init` first\n- or pass `-site <dir>`' },
  choices: { kind: ['note', 'tip', 'important', 'warning', 'danger'] },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var kind = String(v.kind || 'note').toLowerCase();
    var st = { note: 'info', tip: 'pos', important: 'info', warning: 'warn', caution: 'warn', danger: 'neg' }[kind] || W.state(kind);
    el.appendChild(h('aside', { class: 'wm-callout wm-' + st + ' wm-callout-' + kind, role: 'note' },
      h('div', 'wm-callout-head', h('span', 'wm-icon', h('span', null, W.icon(st))),
        h('span', 'wm-callout-title', W.inline(v.title || kind.charAt(0).toUpperCase() + kind.slice(1)))),
      v.text ? h('div', 'wm-callout-body', W.prose(v.text)) : null));
  }
});
