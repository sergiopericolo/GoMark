/*
 * split — two panes side by side with a chosen ratio (text | text, or text | code).
 * data:   { "left": "text" | { "code", "lang" }, "right": "text" | { "code", "lang" }, "titles"?: ["", ""] }
 * config: { "ratio": "1/1" | "2/1" | "1/2" | "3/2" | "2/3", "divider": true, "align": "top" | "center" }
 */
WiMark.register('split', {
  title: 'Split',
  description: 'Two panes with a chosen width ratio; each pane is text or code.',
  example: {
    data: {
      titles: ['What it does', 'How'],
      left: 'Builds every **language** of the site, each in its own folder, with a switch on every page.',
      right: { code: 'gomark build\n# → dist/en/…  dist/it/…', lang: 'bash' }
    },
    config: { ratio: '1/1', divider: true, align: 'top' }
  },
  choices: { ratio: ['1/1', '2/1', '1/2', '3/2', '2/3'], align: ['top', 'center'] },
  mount: function (el, data, config) {
    var W = WiMark, h = W.h;
    var r = /^(\d+)\/(\d+)$/.exec(config.ratio || '1/1') || [0, 1, 1];
    var titles = W.list(data.titles);
    function pane(v, i) {
      var body = v && typeof v === 'object' && v.code !== undefined ? W.codeBlock(v.code, { lang: v.lang, title: v.title }) : W.paras(v || '');
      return h('div', 'wm-split-pane', titles[i] ? h('div', 'wm-label', titles[i]) : null, body);
    }
    el.appendChild(h('div', {
      class: 'wm-split' + (config.divider !== false ? ' wm-split-divider' : '') + (config.align === 'center' ? ' wm-split-center' : ''),
      style: { gridTemplateColumns: 'minmax(0, ' + r[1] + 'fr) minmax(0, ' + r[2] + 'fr)' }
    }, pane(data.left, 0), pane(data.right, 1)));
  }
});
