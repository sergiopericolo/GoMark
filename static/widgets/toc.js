/*
 * toc — the page's headings as numbered contents, built in the browser.
 *   ```wimark-toc {"depth": 3, "title": "Contents", "numbers": true}
 *   ```
 */
WiMark.register('toc', {
  title: 'Contents',
  description: 'Numbered contents of the page headings (h2–h4), built when the page loads.',
  example: { opts: { depth: 3, title: 'Contents' } },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var depth = Math.max(2, Math.min(4, W.num(v.depth, 3)));
    var root = el.closest('.page-body') || document.querySelector('.page-body') || document.body;
    var sel = []; for (var d = 2; d <= depth; d++) sel.push('h' + d);
    var hs = Array.from(root.querySelectorAll(sel.join(','))).filter(function (x) { return !x.closest('.wm'); });
    var nav = h('nav', { class: 'wm-toc', 'aria-label': v.title || 'Contents' }, h('div', 'wm-box-title', W.inline(v.title || 'Contents')));
    if (!hs.length) { nav.appendChild(h('p', 'wm-muted', 'no headings on this page')); el.appendChild(nav); return; }
    var counters = [0, 0, 0], ol = h('ol', 'wm-toc-list');
    hs.forEach(function (x) {
      var lvl = +x.tagName.charAt(1) - 2;
      counters[lvl]++;
      for (var k = lvl + 1; k < 3; k++) counters[k] = 0;
      if (!x.id) x.id = W.uid('h');
      var num = counters.slice(0, lvl + 1).join('.');
      ol.appendChild(h('li', 'wm-toc-l' + lvl, h('a', { href: '#' + x.id }, v.numbers !== false ? h('span', 'wm-toc-n', num) : null, x.textContent)));
    });
    nav.appendChild(ol);
    el.appendChild(nav);
  }
});
