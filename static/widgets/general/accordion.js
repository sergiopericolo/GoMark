/*
 * accordion — collapsible sections; one or many open at a time.
 * data:   [{ "title", "text" }]
 * config: { "open": 0, "single": true }   (open: index of the open item, -1 = none)
 */
WiMark.register('accordion', {
  title: 'Accordion',
  description: 'Collapsible sections; optionally only one open at a time.',
  example: {
    data: [
      { title: 'What is GoMark?', text: 'A static site generator: **Markdown in, HTML out**.' },
      { title: 'Does it need a server?', text: 'No. The output works from any folder, even `file://`.' },
      { title: 'Can I add widgets?', text: 'Yes: put a `.js` file in `<site>/widgets/`.' }
    ],
    config: { open: 0, single: true }
  },
  mount: function (el, data, config) {
    var W = WiMark, h = W.h;
    var box = h('div', 'wm-accordion');
    var all = [];
    W.list(data).forEach(function (it, i) {
      var d = h('details', { class: 'wm-accordion-item', open: W.num(config.open, -1) === i },
        h('summary', null, h('span', 'wm-accordion-title', W.inline(it.title || '')), h('span', { class: 'wm-accordion-chev', 'aria-hidden': 'true' })),
        h('div', 'wm-accordion-body', W.paras(it.text || '')));
      d.addEventListener('toggle', function () {
        if (d.open && config.single !== false) all.forEach(function (o) { if (o !== d) o.open = false; });
      });
      all.push(d);
      box.appendChild(d);
    });
    el.appendChild(box);
  }
});
