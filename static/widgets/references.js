/*
 * references — a numbered bibliography; cite entries with [key] links.
 *   ```wimark-references
 *   [["knuth97", "D. E. Knuth", "The Art of Computer Programming, Vol. 1", "1997", "https://…"]]
 *   ```
 */
WiMark.register('references', {
  title: 'References',
  description: 'A numbered bibliography: [key, authors, title, year, url?]; each entry gets the anchor #ref-key.',
  example: { body: [['knuth97', 'D. E. Knuth', '*The Art of Computer Programming*, Vol. 1, 3rd ed. Addison-Wesley', 1997], ['clrs', 'T. H. Cormen, C. E. Leiserson, R. L. Rivest, C. Stein', '*Introduction to Algorithms*, 4th ed. MIT Press', 2022], ['turing36', 'A. M. Turing', 'On computable numbers, with an application to the Entscheidungsproblem', 1936, 'https://doi.org/10.1112/plms/s2-42.1.230']] },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var ol = h('ol', 'wm-refs');
    W.rows(v.items, ['key', 'authors', 'title', 'year', 'url']).forEach(function (r, i) {
      var title = W.url(r.url) ? h('a', { href: W.url(r.url) }, W.inline(r.title)) : W.inline(r.title);
      ol.appendChild(h('li', { id: 'ref-' + r.key }, h('span', 'wm-refs-n', '[' + (i + 1) + ']'),
        h('span', null, r.authors ? h('span', 'wm-refs-authors', W.inline(r.authors), '. ') : null, title, r.year ? ' (' + r.year + ').' : '.', h('code', 'wm-refs-key', r.key))));
    });
    el.appendChild(h('div', 'wm-box-title', W.inline(v.title || 'References')));
    el.appendChild(ol);
  }
});
