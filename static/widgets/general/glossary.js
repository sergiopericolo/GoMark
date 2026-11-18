/*
 * glossary — terms and definitions, sorted, with a letter index.
 * data:   [{ "term", "definition", "see"?: [] }]
 * config: { "sort": true, "index": true }
 */
WiMark.register('glossary', {
  title: 'Glossary',
  description: 'Terms with definitions, sorted, with a jump-to-letter index and cross references.',
  example: {
    data: [
      { term: 'Section', definition: 'A top-level folder of every language.', see: ['Depth'] },
      { term: 'Depth', definition: 'Path segments inside a section; `a/b.md` is 2.' },
      { term: 'WiMark', definition: 'A GoMark widget, colored only by the theme.' },
      { term: 'Fallback', definition: 'A page shown from another language, with a notice.' }
    ],
    config: { sort: true, index: true }
  },
  mount: function (el, data, config) {
    var W = WiMark, h = W.h;
    var id = W.uid('gl');
    var items = W.list(data).slice();
    if (config.sort !== false) items.sort(function (a, b) { return String(a.term).localeCompare(String(b.term), undefined, { sensitivity: 'base' }); });
    var slug = function (t) { return id + '-' + String(t).toLowerCase().replace(/[^a-z0-9]+/g, '-'); };
    var letters = [];
    var dl = h('dl', 'wm-glossary');
    items.forEach(function (it) {
      var L = String(it.term || '?').charAt(0).toUpperCase();
      var dt = h('dt', { id: slug(it.term) }, it.term);
      if (letters.indexOf(L) < 0) { letters.push(L); dt.appendChild(h('span', { id: id + '-L' + L })); }
      dl.appendChild(dt);
      dl.appendChild(h('dd', null, W.paras(it.definition || ''),
        W.list(it.see).length ? h('div', 'wm-muted wm-small', '→ ', W.list(it.see).map(function (s, i) {
          return [i ? ', ' : '', h('a', { href: '#' + slug(s) }, s)];
        })) : null));
    });
    if (config.index !== false && letters.length > 1) {
      el.appendChild(h('nav', 'wm-row wm-glossary-index', letters.map(function (L) { return h('a', { class: 'wm-tag', href: '#' + id + '-L' + L }, L); })));
    }
    el.appendChild(dl);
  }
});
