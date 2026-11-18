/*
 * json — a collapsible JSON viewer with types and item counts.
 * data:   { "json": <any value> } (or any value)
 * config: { "open": 2, "title": "" }   (open: levels expanded at first)
 */
WiMark.register('json', {
  title: 'JSON viewer',
  description: 'Explore nested JSON: fold objects and arrays, see types and sizes, copy the whole.',
  example: {
    data: { json: { site: { title: 'Blog', theme: 'spectrum', languages: ['en', 'it'] }, sections: [{ id: 'notes', max_depth: 3, layout: 'columns' }, { id: 'about', max_depth: 1, layout: 'page' }], draft: false, pages: 42, author: null } },
    config: { open: 2, title: 'site.json' }
  },
  mount: function (el, data, config) {
    var W = WiMark, h = W.h;
    var value = data && Object.prototype.hasOwnProperty.call(data, 'json') ? data.json : data;
    var open = W.num(config.open, 2);
    function leaf(v) {
      var t = v === null ? 'null' : typeof v;
      return h('span', 'wm-json-' + t, t === 'string' ? JSON.stringify(v) : String(v));
    }
    function node(key, v, depth) {
      var k = key === null ? null : h('span', 'wm-json-key', typeof key === 'number' ? key + ': ' : JSON.stringify(key) + ': ');
      if (v === null || typeof v !== 'object') return h('div', 'wm-json-row', k, leaf(v));
      var arr = Array.isArray(v), keys = arr ? v.map(function (_, i) { return i; }) : Object.keys(v);
      var det = h('details', { class: 'wm-json-node', open: depth < open },
        h('summary', null, k, h('span', 'wm-json-brace', arr ? '[' : '{'), h('span', 'wm-json-count', ' ' + keys.length + (arr ? ' items ' : ' keys ')), h('span', 'wm-json-brace wm-json-close', arr ? ']' : '}')),
        h('div', 'wm-json-children', keys.map(function (kk) { return node(kk, v[kk], depth + 1); })));
      return det;
    }
    var btn = h('button', { type: 'button', class: 'wm-btn' }, W.t('copy'));
    btn.addEventListener('click', function () { W.copy(JSON.stringify(value, null, 2), btn); });
    el.appendChild(h('div', 'wm-code wm-json', h('div', 'wm-code-head', h('span', null, config.title || 'json'), btn), h('div', 'wm-json-body', node(null, value, 0))));
  }
});
