/*
 * json — explore JSON: fold objects and arrays, see types and sizes, copy.
 *   ```wimark-json {"open": 2}
 *   {"name": "gomark", "deps": ["goldmark", "toml"]}
 *   ```
 */
WiMark.register('json', {
  title: 'JSON explorer',
  description: 'Nested JSON with folding, types, item counts and copy; "open" sets how many levels start unfolded.',
  input: 'text',
  example: { opts: { open: 2 }, body: '{"site": {"title": "Docs", "theme": "duo", "languages": ["en", "it"]}, "sections": [{"id": "api", "max_depth": 2}, {"id": "guide", "max_depth": 1}], "build": {"pages": 42, "images": 18, "ok": true, "warnings": null}}' },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var data = JSON.parse(v.text || 'null'), open = W.num(v.open, 1);
    function node(val, key, depth) {
      var k = key !== null ? h('span', 'wm-json-key', JSON.stringify(key) + ': ') : null;
      if (val && typeof val === 'object') {
        var arr = Array.isArray(val), keys = Object.keys(val);
        var sum = h('summary', null, k, h('span', 'wm-json-punct', arr ? '[' : '{'), h('span', 'wm-muted wm-json-size', ' ' + keys.length + (arr ? ' items' : ' keys') + ' '), h('span', 'wm-json-punct', arr ? ']' : '}'));
        return h('details', { class: 'wm-json-node', open: depth < open }, sum, h('div', 'wm-json-kids', keys.map(function (kk) { return node(val[kk], arr ? null : kk, depth + 1); })));
      }
      var type = val === null ? 'null' : typeof val;
      return h('div', 'wm-json-leaf', k, h('span', 'wm-json-' + type, JSON.stringify(val)));
    }
    var copy = h('button', { type: 'button', class: 'wm-btn' }, W.t('copy'));
    copy.addEventListener('click', function () { W.copy(JSON.stringify(data, null, 2), copy); });
    el.appendChild(h('div', 'wm-code wm-json', h('div', 'wm-code-head', h('span', null, v.title || 'json'), copy), h('div', 'wm-json-body', node(data, null, 0))));
  }
});
