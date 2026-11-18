/*
 * tabs — content in tabs; arrow keys move between them.
 * data:   [{ "label", "text" }]
 * config: { "active": 0 }
 */
WiMark.register('tabs', {
  title: 'Tabs',
  description: 'Switch between panes of text; keyboard accessible.',
  example: {
    data: [
      { label: 'macOS', text: '`brew install go` then `go install .`' },
      { label: 'Linux', text: 'Use your package manager for Go, then `go install .`' },
      { label: 'Windows', text: 'Install Go from **go.dev**, then run `go install .` in a terminal.' }
    ],
    config: { active: 0 }
  },
  mount: function (el, data, config) {
    var W = WiMark, h = W.h;
    var items = W.list(data), id = W.uid('tabs');
    var bar = h('div', { class: 'wm-tabs-bar', role: 'tablist' });
    var panes = [], buttons = [];
    function select(i, focus) {
      buttons.forEach(function (b, j) {
        b.setAttribute('aria-selected', String(i === j));
        b.tabIndex = i === j ? 0 : -1;
        panes[j].hidden = i !== j;
      });
      if (focus) buttons[i].focus();
    }
    items.forEach(function (it, i) {
      var b = h('button', { type: 'button', role: 'tab', class: 'wm-tabs-tab', id: id + '-t' + i, 'aria-controls': id + '-p' + i }, it.label || String(i + 1));
      b.addEventListener('click', function () { select(i); });
      b.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') select((i + 1) % items.length, true);
        if (e.key === 'ArrowLeft') select((i - 1 + items.length) % items.length, true);
      });
      buttons.push(b);
      bar.appendChild(b);
      panes.push(h('div', { role: 'tabpanel', class: 'wm-tabs-pane', id: id + '-p' + i, 'aria-labelledby': id + '-t' + i }, W.paras(it.text || '')));
    });
    el.appendChild(h('div', 'wm-tabs', bar, panes));
    if (items.length) select(Math.min(Math.max(0, W.num(config.active, 0)), items.length - 1));
  }
});
