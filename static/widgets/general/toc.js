/*
 * toc — a table of contents of this page's headings (or of the given items).
 * data:   { "items"?: [{ "text", "level", "href" }] }   (empty: read the page)
 * config: { "levels": 3, "numbered": true, "title": "Contents" }
 */
WiMark.register('toc', {
  title: 'Table of contents',
  description: 'Numbered contents of the page headings, built in the browser.',
  example: { data: {}, config: { levels: 3, numbered: true, title: 'Contents' } },
  mount: function (el, data, config) {
    var W = WiMark, h = W.h;
    var max = Math.min(6, Math.max(2, W.num(config.levels, 3)));
    var items = W.list(data.items);
    if (!items.length) {
      var sel = [];
      for (var l = 2; l <= max; l++) sel.push('.page-body h' + l);
      items = Array.prototype.map.call(document.querySelectorAll(sel.join(',')), function (hd) {
        return { text: hd.textContent, level: +hd.tagName.charAt(1), href: hd.id ? '#' + hd.id : '' };
      });
    }
    var nav = h('nav', { class: 'wm-card wm-toc', 'aria-label': config.title || 'Contents' });
    if (config.title) nav.appendChild(h('div', 'wm-label', config.title));
    if (!items.length) { nav.appendChild(h('p', 'wm-muted', '—')); el.appendChild(nav); return; }
    var counters = [0, 0, 0, 0, 0, 0, 0], top = Math.min.apply(null, items.map(function (i) { return W.num(i.level, 2); }));
    var ol = h('ol');
    items.forEach(function (it) {
      var lv = W.num(it.level, 2);
      counters[lv]++;
      for (var k = lv + 1; k < counters.length; k++) counters[k] = 0;
      var num = counters.slice(top, lv + 1).join('.');
      var href = W.url(it.href);
      ol.appendChild(h('li', { class: 'wm-toc-l' + (lv - top), style: { '--indent': String(lv - top) } },
        config.numbered !== false ? h('span', 'wm-toc-n', num) : null,
        href ? h('a', { href: href }, it.text) : h('span', null, it.text)));
    });
    nav.appendChild(ol);
    el.appendChild(nav);
  }
});
