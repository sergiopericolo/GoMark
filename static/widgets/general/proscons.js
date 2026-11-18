/*
 * proscons — two lists side by side: advantages and drawbacks.
 * data:   { "pros": [], "cons": [], "title"? }
 * config: { "labels": ["Pros", "Cons"] }
 */
WiMark.register('proscons', {
  title: 'Pros and cons',
  description: 'Advantages and drawbacks side by side, with icons.',
  example: {
    data: {
      title: 'Static sites',
      pros: ['No server to maintain', 'Fast and cacheable', 'Works from `file://`'],
      cons: ['No server-side search', 'Rebuild to update']
    },
    config: { labels: ['Pros', 'Cons'] }
  },
  mount: function (el, data, config) {
    var W = WiMark, h = W.h;
    var labels = W.list(config.labels).length === 2 ? config.labels : ['Pros', 'Cons'];
    function col(items, st, label) {
      return h('div', 'wm-card wm-proscons-col wm-' + st,
        h('div', 'wm-proscons-head', h('span', { class: 'wm-icon', 'aria-hidden': 'true' }, h('span', null, W.icon(st))), h('strong', null, label)),
        h('ul', null, W.list(items).map(function (it) {
          return h('li', null, h('span', { class: 'wm-proscons-mark', 'aria-hidden': 'true' }, st === 'pos' ? '+' : '−'), h('span', null, W.inline(it)));
        })));
    }
    if (data.title) el.appendChild(h('div', 'wm-figure-title', W.inline(data.title)));
    el.appendChild(h('div', { class: 'wm-grid', style: { '--cols': '2' } }, col(data.pros, 'pos', labels[0]), col(data.cons, 'neg', labels[1])));
  }
});
