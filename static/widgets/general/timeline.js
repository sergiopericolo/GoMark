/*
 * timeline — dated events along a line.
 * data:   [{ "date", "title", "text"?, "tags"?: [], "state"? }]
 * config: { "order": "as-is" | "asc" | "desc", "layout": "vertical" | "horizontal", "long_dates": false }
 */
WiMark.register('timeline', {
  title: 'Timeline',
  description: 'Dated events along a vertical or horizontal line; optional state per event.',
  example: {
    data: [
      { date: '2023-03-01', title: 'Idea', text: 'Markdown in, **static site** out.', tags: ['go'] },
      { date: '2024-06-15', title: 'Engine', text: 'Sections, depth rule, widgets.', tags: ['engine', 'widgets'], state: 'done' },
      { date: '2025-01-10', title: 'Themes', text: 'Monochrome, bicolor and colored.', state: 'warn' },
      { date: '2026-11-18', title: 'First release', state: 'info' }
    ],
    config: { order: 'asc', layout: 'vertical', long_dates: false }
  },
  choices: { order: ['as-is', 'asc', 'desc'], layout: ['vertical', 'horizontal'] },
  mount: function (el, data, config) {
    var W = WiMark, h = W.h;
    var items = W.list(data).slice();
    if (config.order === 'asc' || config.order === 'desc') {
      items.sort(function (a, b) {
        var da = W.date(a.date), db = W.date(b.date);
        var d = (da ? da.getTime() : 0) - (db ? db.getTime() : 0);
        return config.order === 'asc' ? d : -d;
      });
    }
    var list = h('ol', 'wm-timeline wm-timeline-' + (config.layout === 'horizontal' ? 'horizontal' : 'vertical'));
    items.forEach(function (it) {
      var dateText = W.date(it.date) && /^\d{4}-\d{2}-\d{2}/.test(String(it.date))
        ? W.fmtDate(it.date, config.long_dates ? { year: 'numeric', month: 'long', day: 'numeric' } : undefined)
        : String(it.date || '');
      var li = h('li', 'wm-timeline-item' + (it.state ? ' wm-' + W.state(it.state) : ''),
        h('span', { class: 'wm-timeline-dot', 'aria-hidden': 'true' }, it.state ? W.icon(it.state) : ''),
        h('time', { class: 'wm-timeline-date', datetime: it.date || '' }, dateText),
        h('div', 'wm-timeline-title', W.inline(it.title || '')));
      if (it.text) li.appendChild(W.paras(it.text));
      if (W.list(it.tags).length) li.appendChild(h('div', 'wm-row', W.list(it.tags).map(function (t) { return h('span', 'wm-tag', t); })));
      list.appendChild(li);
    });
    el.appendChild(list);
  }
});
