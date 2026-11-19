/*
 * checklist — items to tick; ticks are kept in the reader's browser.
 *   ```wimark-checklist {"title": "Before release"}
 *   ["Tests pass", ["Changelog updated", true], "Tag pushed"]
 *   ```
 */
WiMark.register('checklist', {
  title: 'Checklist',
  description: 'Items the reader can tick, with progress; ["item", true] starts ticked. Kept per browser.',
  example: { opts: { title: 'Release checklist' }, body: [['`go test ./...` passes', true], ['`CHANGELOG.md` has the version', true], 'Docs build without warnings', 'Tag `vX.Y.Z` pushed', 'Binaries attached to the release'] },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var items = W.rows(v.items, ['text', 'done']);
    var key = 'checklist:' + (v.title || '') + ':' + items.map(function (i) { return i.text; }).join('|');
    var saved = W.store(key) || {};
    var fill = h('div', 'wm-progress-fill'), count = h('span', 'wm-muted');
    function update() {
      var n = items.filter(function (it, i) { return saved[i] !== undefined ? saved[i] : !!it.done; }).length;
      fill.style.width = (items.length ? (100 * n) / items.length : 0) + '%';
      count.textContent = n + ' / ' + items.length;
    }
    var ul = h('ul', 'wm-checklist');
    items.forEach(function (it, i) {
      var id = W.uid('chk');
      var box = h('input', { type: 'checkbox', id: id, checked: saved[i] !== undefined ? saved[i] : !!it.done });
      box.addEventListener('change', function () { saved[i] = box.checked; W.store(key, saved); update(); });
      ul.appendChild(h('li', null, box, h('label', { for: id }, W.inline(it.text))));
    });
    el.appendChild(h('div', 'wm-checklist-head', v.title ? h('strong', null, W.inline(v.title)) : null, h('div', 'wm-progress', fill), count));
    el.appendChild(ul);
    update();
  }
});
