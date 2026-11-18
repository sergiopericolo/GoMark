/*
 * columns — text in two or more columns: separate blocks, or one text that flows.
 * data:   { "columns": ["text", "text"] } or { "text": "flows across columns" }
 * config: { "count": 2, "rule": true, "gap": "normal" | "wide" }
 */
WiMark.register('columns', {
  title: 'Text columns',
  description: 'Two or more columns of text: separate blocks side by side, or one flowing text.',
  example: {
    data: {
      columns: [
        '**Left.** Markdown has no columns. With this WiMark a page can set two texts side by side.\n\nEach column can hold several paragraphs.',
        '**Right.** On narrow screens the columns stack, so nothing is cut or squeezed.'
      ]
    },
    config: { count: 2, rule: true, gap: 'normal' }
  },
  choices: { gap: ['normal', 'wide'] },
  mount: function (el, data, config) {
    var W = WiMark, h = W.h;
    var n = Math.max(1, Math.min(4, W.num(config.count, 2)));
    var cls = 'wm-columns' + (config.rule !== false ? ' wm-columns-rule' : '') + (config.gap === 'wide' ? ' wm-columns-wide' : '');
    if (data.text) {
      el.appendChild(h('div', { class: cls + ' wm-columns-flow', style: { columnCount: String(n) } }, W.paras(data.text)));
      return;
    }
    var cols = W.list(data.columns || data);
    el.appendChild(h('div', { class: cls + ' wm-columns-grid', style: { '--cols': String(cols.length || n) } },
      cols.map(function (c) { return h('div', 'wm-columns-col', W.paras(c)); })));
  }
});
