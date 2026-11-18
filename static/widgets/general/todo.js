/*
 * todo — a checklist the reader can tick; ticks are kept in this browser.
 * data:   [{ "text", "done"?, "due"?, "tag"? }] or ["text", …]
 * config: { "interactive": true, "progress": true, "persist": true }
 */
WiMark.register('todo', {
  title: 'Todo list',
  description: 'A checklist with progress; the reader can tick items (kept in the browser).',
  example: {
    data: [
      { text: 'Write the **introduction**', done: true },
      { text: 'Add a `widget-chart` example', tag: 'docs' },
      { text: 'Translate into Italian', due: '2026-12-01' },
      'Publish'
    ],
    config: { interactive: true, progress: true, persist: true }
  },
  mount: function (el, data, config) {
    var W = WiMark, h = W.h;
    var items = W.list(data).map(function (it) { return typeof it === 'string' ? { text: it } : it; });
    var key = 'todo:' + items.map(function (it) { return it.text; }).join('|').slice(0, 200);
    var saved = config.persist !== false ? W.store(key) : null;
    var state = items.map(function (it, i) { return saved && typeof saved[i] === 'boolean' ? saved[i] : !!it.done; });
    var bar = h('div', 'wm-todo-bar', h('div', 'wm-todo-fill'));
    var count = h('span', 'wm-todo-count');
    function update() {
      var n = state.filter(Boolean).length;
      count.textContent = n + ' / ' + items.length;
      bar.firstChild.style.width = (items.length ? (100 * n) / items.length : 0) + '%';
      if (config.persist !== false) W.store(key, state);
    }
    var ul = h('ul', 'wm-todo');
    items.forEach(function (it, i) {
      var box = h('input', { type: 'checkbox', checked: state[i], disabled: config.interactive === false });
      var li = h('li', 'wm-todo-item' + (state[i] ? ' done' : ''));
      box.addEventListener('change', function () { state[i] = box.checked; li.classList.toggle('done', box.checked); update(); });
      li.appendChild(h('label', null, box, h('span', 'wm-todo-text', W.inline(it.text || '')),
        it.tag ? h('span', 'wm-tag', it.tag) : null,
        it.due ? h('time', { class: 'wm-muted wm-small', datetime: it.due }, W.fmtDate(it.due)) : null));
      ul.appendChild(li);
    });
    if (config.progress !== false) el.appendChild(h('div', 'wm-todo-head', bar, count));
    el.appendChild(ul);
    update();
  }
});
