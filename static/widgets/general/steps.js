/*
 * steps — a numbered process; each step can be done, current or todo.
 * data:   [{ "title", "text"?, "state"?: "done" | "current" | "todo" }]
 * config: { "layout": "vertical" | "horizontal", "numbered": true }
 */
WiMark.register('steps', {
  title: 'Steps',
  description: 'A numbered process with done / current / todo states.',
  example: {
    data: [
      { title: 'Install', text: '`go install .`', state: 'done' },
      { title: 'Create a site', text: '`gomark init blog`', state: 'done' },
      { title: 'Write', text: 'Add pages with `gomark new`.', state: 'current' },
      { title: 'Publish', text: '`gomark build && gomark publish`' }
    ],
    config: { layout: 'vertical', numbered: true }
  },
  choices: { layout: ['vertical', 'horizontal'] },
  mount: function (el, data, config) {
    var W = WiMark, h = W.h;
    var ol = h('ol', 'wm-steps wm-steps-' + (config.layout === 'horizontal' ? 'horizontal' : 'vertical'));
    W.list(data).forEach(function (s, i) {
      var st = s.state === 'done' ? 'done' : s.state === 'current' ? 'current' : 'todo';
      var mark = st === 'done' ? '✓' : config.numbered === false ? '' : String(i + 1);
      var li = h('li', { class: 'wm-step wm-step-' + st, 'aria-current': st === 'current' ? 'step' : null },
        h('span', { class: 'wm-step-mark', 'aria-hidden': 'true' }, mark),
        h('div', 'wm-step-body', h('div', 'wm-step-title', W.inline(s.title || '')), s.text ? W.paras(s.text) : null));
      ol.appendChild(li);
    });
    el.appendChild(ol);
  }
});
