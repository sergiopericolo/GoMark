/*
 * codecompare — two code blocks side by side: before / after, A / B.
 * data:   { "left": { "title", "lang", "code" }, "right": { "title", "lang", "code" } }
 * config: { "line_numbers": true, "labels": ["", ""] }
 */
WiMark.register('codecompare', {
  title: 'Code compare',
  description: 'Two code blocks side by side, for before / after or two approaches.',
  example: {
    data: {
      left: { title: 'before — color in JS', lang: 'javascript', code: "paint(bar, 'steelblue');" },
      right: { title: 'after — color from the theme', lang: 'javascript', code: "bar.className = WiMark.series(0);" }
    },
    config: { line_numbers: true, labels: ['✕ avoid', '✓ prefer'] }
  },
  mount: function (el, data, config) {
    var W = WiMark, h = W.h;
    var labels = W.list(config.labels);
    el.appendChild(h('div', { class: 'wm-split', style: { gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)' } },
      [data.left, data.right].map(function (s, i) {
        s = s || {};
        return h('div', 'wm-split-pane', labels[i] ? h('div', 'wm-label', labels[i]) : null,
          W.codeBlock(s.code, { lang: s.lang, title: s.title, numbers: config.line_numbers !== false }));
      })));
  }
});
