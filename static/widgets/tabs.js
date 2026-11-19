/*
 * tabs — panes of text in tabs; "=== Title" lines start each pane.
 *   ```wimark-tabs
 *   === Linux
 *   Text.
 *   === macOS
 *   Text.
 *   ```
 */
WiMark.register('tabs', {
  title: 'Tabs',
  description: 'Panes of text behind tabs, each started by a "=== Title" line; keyboard accessible.',
  input: 'text',
  example: { body: '=== Linux\nInstall with your package manager, then run `gomark version`.\n=== macOS\n`brew install gomark` — the binary has no runtime dependencies.\n=== From source\n`go install .` in a clone; Go 1.24 or later.' },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var panes = W.sections(v.text), id = W.uid('tabs');
    var bar = h('div', { class: 'wm-tabs-bar', role: 'tablist' }), box = h('div', 'wm-tabs');
    var btns = panes.map(function (p, i) {
      var b = h('button', { type: 'button', role: 'tab', class: 'wm-tab', id: id + '-t' + i, 'aria-controls': id + '-p' + i }, W.inline(p.title || String(i + 1)));
      b.addEventListener('click', function () { select(i); });
      b.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { var j = (i + (e.key === 'ArrowRight' ? 1 : panes.length - 1)) % panes.length; select(j); btns[j].focus(); }
      });
      bar.appendChild(b);
      return b;
    });
    var bodies = panes.map(function (p, i) { return h('div', { class: 'wm-tab-pane', role: 'tabpanel', id: id + '-p' + i, 'aria-labelledby': id + '-t' + i }, W.prose(p.text)); });
    function select(i) {
      btns.forEach(function (b, k) { b.setAttribute('aria-selected', String(k === i)); b.tabIndex = k === i ? 0 : -1; });
      bodies.forEach(function (b, k) { b.hidden = k !== i; });
    }
    box.appendChild(bar);
    bodies.forEach(function (b) { box.appendChild(b); });
    select(0);
    el.appendChild(box);
  }
});
