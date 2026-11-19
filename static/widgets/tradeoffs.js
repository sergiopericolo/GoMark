/*
 * tradeoffs — advantages and costs side by side.
 *   ```wimark-tradeoffs {"title": "Static site"}
 *   {"pros": ["No server"], "cons": ["No search without JS"]}
 *   ```
 */
WiMark.register('tradeoffs', {
  title: 'Trade-offs',
  description: 'Pros and cons of a design choice side by side, with icons.',
  example: { opts: { title: 'Rendering math at build time' }, body: { pros: ['No JavaScript on the page', 'Faster first paint'], cons: ['Slower builds', 'Needs a TeX engine in CI', 'No copy-as-LaTeX'] } },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    function col(list, st, label) {
      return h('div', 'wm-tradeoffs-col wm-' + st, h('div', 'wm-tradeoffs-head', h('span', 'wm-icon', h('span', null, W.icon(st))), label),
        h('ul', 'wm-list', W.list(list).map(function (x) { return h('li', null, W.inline(x)); })));
    }
    if (v.title) el.appendChild(h('div', 'wm-box-title', W.inline(v.title)));
    el.appendChild(h('div', 'wm-tradeoffs', col(v.pros, 'pos', v.pros_label || 'Pros'), col(v.cons, 'neg', v.cons_label || 'Cons')));
  }
});
