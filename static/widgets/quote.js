/*
 * quote — a quotation with author and source, for epigraphs and citations.
 *   ```wimark-quote {"by": "Donald Knuth", "source": "Computer Programming as an Art, 1974"}
 *   Premature optimization is the root of all evil.
 *   ```
 */
WiMark.register('quote', {
  title: 'Quote',
  description: 'A quotation with author, source and link: epigraphs and citations.',
  input: 'text',
  example: { opts: { by: 'Edsger W. Dijkstra', source: 'EWD 1036, 1988' }, body: 'Program testing can be used to show the presence of bugs, but never to show their absence.' },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var src = v.source ? (W.url(v.href) ? h('a', { href: W.url(v.href) }, W.inline(v.source)) : W.inline(v.source)) : null;
    el.appendChild(h('figure', 'wm-quote', h('blockquote', null, W.prose(v.text)),
      v.by || src ? h('figcaption', null, '— ', v.by ? h('span', 'wm-quote-by', W.inline(v.by)) : null, v.by && src ? ', ' : '', src ? h('cite', null, src) : null) : null));
  }
});
