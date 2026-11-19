/*
 * timeline — dated events on a vertical line.
 *   ```wimark-timeline
 *   [["1936", "Turing machine", "Computability defined."], ["1945", "von Neumann architecture"]]
 *   ```
 */
WiMark.register('timeline', {
  title: 'Timeline',
  description: 'Dated events on a line: ["date", "title", "text"?, "state"?].',
  example: { body: [['1936', 'Turing machines', 'A definition of computability.'], ['1957', 'FORTRAN', 'The first widely used compiled language.'], ['1972', 'C and Unix', 'Portable systems code.'], ['1991', 'Linux 0.01'], ['2009', 'Go announced', 'Fast builds, simple concurrency.', 'done']] },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var ol = h('ol', 'wm-timeline');
    W.rows(v.items, ['date', 'title', 'text', 'state']).forEach(function (e) {
      var st = e.state ? ' wm-' + W.state(e.state) : '';
      ol.appendChild(h('li', 'wm-timeline-item' + st, h('span', { class: 'wm-timeline-dot', 'aria-hidden': 'true' }),
        h('span', 'wm-timeline-date', String(e.date === undefined ? '' : e.date)), h('div', 'wm-timeline-title', W.inline(e.title)),
        e.text ? h('div', 'wm-timeline-text', W.inline(e.text)) : null));
    });
    el.appendChild(ol);
  }
});
