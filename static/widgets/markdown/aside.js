/*
 * aside — main text with a side note in the margin.
 * data:   { "text", "note", "title"? }
 * config: { "side": "right" | "left", "width": 33 }   (width: % of the note)
 */
WiMark.register('aside', {
  title: 'Margin note',
  description: 'Main text with a side note (left or right) that stacks on narrow screens.',
  example: {
    data: {
      text: 'Every section has its own `sections/<id>.toml`. It sets the layout, the column widths, the index side and even the fonts — without touching code.',
      title: 'Tip', note: 'Run `gomark config sections.<id>.index left` to move the outline.'
    },
    config: { side: 'right', width: 33 }
  },
  choices: { side: ['right', 'left'] },
  mount: function (el, data, config) {
    var W = WiMark, h = W.h;
    var w = Math.max(15, Math.min(50, W.num(config.width, 33)));
    var note = h('aside', 'wm-aside-note', data.title ? h('div', 'wm-label', data.title) : null, W.paras(data.note || ''));
    var main = h('div', 'wm-aside-main', W.paras(data.text || ''));
    var left = config.side === 'left';
    el.appendChild(h('div', { class: 'wm-aside', style: { gridTemplateColumns: left ? w + '% minmax(0, 1fr)' : 'minmax(0, 1fr) ' + w + '%' } },
      left ? [note, main] : [main, note]));
  }
});
