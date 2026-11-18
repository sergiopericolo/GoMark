/*
 * codetabs — the same thing in several languages, one tab each.
 * data:   [{ "label", "lang", "code" }]
 * config: { "active": 0, "line_numbers": false }
 */
WiMark.register('codetabs', {
  title: 'Code tabs',
  description: 'Several code blocks in tabs (one per language or file).',
  example: {
    data: [
      { label: 'Go', lang: 'go', code: 'fmt.Println("hello")' },
      { label: 'Python', lang: 'python', code: 'print("hello")' },
      { label: 'JavaScript', lang: 'javascript', code: 'console.log("hello");' }
    ],
    config: { active: 0, line_numbers: false }
  },
  mount: function (el, data, config) {
    var W = WiMark, h = W.h;
    var items = W.list(data), id = W.uid('ct');
    var bar = h('div', { class: 'wm-tabs-bar', role: 'tablist' }), panes = [], btns = [];
    function select(i) {
      btns.forEach(function (b, j) { b.setAttribute('aria-selected', String(i === j)); b.tabIndex = i === j ? 0 : -1; panes[j].hidden = i !== j; });
    }
    items.forEach(function (it, i) {
      var b = h('button', { type: 'button', role: 'tab', class: 'wm-tabs-tab', id: id + 't' + i, 'aria-controls': id + 'p' + i }, it.label || it.lang || String(i + 1));
      b.addEventListener('click', function () { select(i); });
      b.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { select((i + 1) % items.length); btns[(i + 1) % items.length].focus(); }
        if (e.key === 'ArrowLeft') { select((i - 1 + items.length) % items.length); btns[(i - 1 + items.length) % items.length].focus(); }
      });
      btns.push(b);
      bar.appendChild(b);
      panes.push(h('div', { role: 'tabpanel', id: id + 'p' + i, 'aria-labelledby': id + 't' + i },
        W.codeBlock(it.code, { lang: it.lang, title: it.file || it.lang, numbers: !!config.line_numbers })));
    });
    el.appendChild(h('div', 'wm-codetabs', bar, panes));
    if (items.length) select(Math.min(Math.max(0, W.num(config.active, 0)), items.length - 1));
  }
});
