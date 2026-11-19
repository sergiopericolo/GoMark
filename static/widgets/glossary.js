/*
 * glossary — terms and definitions, sorted, with a letter index.
 *   ```wimark-glossary
 *   [["AST", "Abstract syntax tree."], ["Idempotent", "Same result when applied twice."]]
 *   ```
 *   An object {"term": "definition"} works too.
 */
WiMark.register('glossary', {
  title: 'Glossary',
  description: 'Terms with definitions, sorted, with a jump-to-letter index; [[Term]] links another entry.',
  example: { body: [['AST', 'Abstract syntax tree: the parsed structure of a source text.'], ['Idempotent', 'An operation $f$ with $f(f(x)) = f(x)$ — applying it twice changes nothing. See [[Pure function]].'], ['Pure function', 'Its result depends only on its arguments, with no side effects.'], ['Big-O', 'An upper bound on growth: $f \\in O(g)$ if $|f| \\le c\\,|g|$ eventually.'], ['Memoization', 'Caching the results of a [[Pure function]].']] },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var items = W.rows(v.items, ['term', 'def']).sort(function (a, b) { return String(a.term).localeCompare(String(b.term)); });
    var slug = function (t) { return 'gl-' + String(t).toLowerCase().replace(/[^a-z0-9]+/g, '-'); };
    var letters = [], dl = h('dl', 'wm-glossary');
    items.forEach(function (it) {
      var L = String(it.term).charAt(0).toUpperCase();
      var dt = h('dt', { id: slug(it.term) }, W.inline(it.term));
      if (letters.indexOf(L) < 0) { letters.push(L); dt.dataset.letter = L; dt.id = slug(it.term); }
      var dd = h('dd');
      String(it.def || '').split(/(\[\[[^\]]+\]\])/).forEach(function (part) {
        var m = /^\[\[([^\]]+)\]\]$/.exec(part);
        dd.appendChild(m ? h('a', { href: '#' + slug(m[1]) }, m[1]) : W.inline(part));
      });
      dl.appendChild(dt);
      dl.appendChild(dd);
    });
    if (letters.length > 3) {
      el.appendChild(h('nav', 'wm-glossary-index', letters.map(function (L) {
        var first = items.filter(function (it) { return String(it.term).charAt(0).toUpperCase() === L; })[0];
        return h('a', { href: '#' + slug(first.term) }, L);
      })));
    }
    el.appendChild(dl);
  }
});
