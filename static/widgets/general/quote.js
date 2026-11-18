/*
 * quote — a pull quote with author and source.
 * data:   { "text", "author"?, "source"?, "href"? }
 * config: { "size": "normal" | "large", "align": "left" | "center" }
 */
WiMark.register('quote', {
  title: 'Quote',
  description: 'A pull quote with author, source and link.',
  example: {
    data: { text: 'Simplicity is prerequisite for reliability.', author: 'Edsger W. Dijkstra', source: 'EWD498', href: 'https://www.cs.utexas.edu/~EWD/' },
    config: { size: 'large', align: 'left' }
  },
  choices: { size: ['normal', 'large'], align: ['left', 'center'] },
  mount: function (el, data, config) {
    var W = WiMark, h = W.h;
    var href = W.url(data.href);
    var cite = data.author || data.source ? h('figcaption', null, '— ', data.author ? h('span', 'wm-quote-author', data.author) : null,
      data.source ? [data.author ? ', ' : '', href ? h('a', { href: href }, h('cite', null, data.source)) : h('cite', null, data.source)] : null) : null;
    el.appendChild(h('figure', 'wm-quote wm-quote-' + (config.size === 'large' ? 'large' : 'normal') + ' wm-quote-' + (config.align === 'center' ? 'center' : 'left'),
      h('blockquote', { cite: href || null }, W.paras(data.text || '', 'wm-quote-text')), cite));
  }
});
