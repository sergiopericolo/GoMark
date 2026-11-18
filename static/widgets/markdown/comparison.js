/*
 * comparison — features against products: ✓ yes, ✕ no, ◐ partial, or text.
 * data:   { "items": ["A", "B"], "features": [{ "name", "group"?, "values": [true, false, "partial", "text"] }] }
 * config: { "highlight": 0 }   (index of the highlighted item, -1 = none)
 */
WiMark.register('comparison', {
  title: 'Feature comparison',
  description: 'Products against features with ✓ ✕ ◐, grouped, one product highlighted.',
  example: {
    data: {
      items: ['GoMark', 'Generator A', 'Generator B'],
      features: [
        { group: 'Content', name: 'Markdown pages', values: [true, true, true] },
        { group: 'Content', name: 'Every page in every language', values: [true, 'plugin', false] },
        { group: 'Look', name: 'Theme classes', values: [true, false, false] },
        { group: 'Look', name: 'Widgets follow the theme', values: [true, 'partial', false] },
        { group: 'Tools', name: 'Single binary', values: [true, true, false] }
      ]
    },
    config: { highlight: 0 }
  },
  mount: function (el, data, config) {
    var W = WiMark, h = W.h;
    var items = W.list(data.items), hi = W.num(config.highlight, -1);
    function val(v) {
      if (v === 'partial') return h('span', { class: 'wm-bool wm-warn', title: 'partial' }, '◐');
      return W.cell(v);
    }
    var tbl = h('table', 'wm-table wm-comparison');
    tbl.appendChild(h('thead', null, h('tr', null, h('th', { scope: 'col' }, ''), items.map(function (it, i) {
      return h('th', { scope: 'col', class: 'wm-center' + (i === hi ? ' wm-hi' : '') }, it);
    }))));
    var body = h('tbody'), group = null;
    W.list(data.features).forEach(function (f) {
      if (f.group && f.group !== group) {
        group = f.group;
        body.appendChild(h('tr', 'wm-group-row', h('th', { scope: 'rowgroup', colspan: items.length + 1 }, group)));
      }
      body.appendChild(h('tr', null, h('th', { scope: 'row' }, W.inline(f.name || '')), items.map(function (it, i) {
        return h('td', 'wm-center' + (i === hi ? ' wm-hi' : ''), val(W.list(f.values)[i]));
      })));
    });
    tbl.appendChild(body);
    el.appendChild(h('div', 'wm-table-wrap', tbl));
  }
});
