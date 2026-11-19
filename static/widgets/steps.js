/*
 * steps — a numbered procedure; each step is "text" or ["title", "text"].
 *   ```wimark-steps {"start": 1}
 *   [["Clone", "`git clone …`"], ["Build", "`go build .`"], "Run the tests."]
 *   ```
 */
WiMark.register('steps', {
  title: 'Steps',
  description: 'A numbered procedure: each step a line of text or a title with its explanation.',
  example: { body: [['Install', '`go install gomark@latest`'], ['Create a site', '`gomark init docs "API docs"`'], ['Write', 'Add pages under `en/`; use WiMarks for math and code.'], ['Publish', '`gomark build` writes static HTML to `dist/`.']] },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var start = W.num(v.start, 1);
    var ol = h('ol', 'wm-steps');
    W.rows(v.items, ['title', 'text']).forEach(function (s, i) {
      var one = s.text === undefined;
      ol.appendChild(h('li', 'wm-step', h('span', { class: 'wm-step-n', 'aria-hidden': 'true' }, String(start + i)),
        h('div', 'wm-step-body', one ? W.prose(s.title) : [h('div', 'wm-step-title', W.inline(s.title)), W.prose(s.text)])));
    });
    el.appendChild(ol);
  }
});
