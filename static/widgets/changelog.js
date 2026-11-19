/*
 * changelog — versions with typed changes (Keep a Changelog).
 *   ```wimark-changelog
 *   [{"v": "1.1.0", "date": "2026-11-02", "added": ["…"], "fixed": ["…"]}, {"v": "1.0.0", "date": "2026-09-01", "added": ["First release"]}]
 *   ```
 *   kinds: added, changed, deprecated, removed, fixed, security
 */
WiMark.register('changelog', {
  title: 'Changelog',
  description: 'Releases with added, changed, deprecated, removed, fixed and security entries.',
  example: { body: [
    { v: '2.0.0', date: '2026-11-19', added: ['`wimark-` fences with inline JSON options', '120+ WiMarks for math and code'], changed: ['Widgets are one flat list'], removed: ['`widget-` fences'] },
    { v: '1.4.1', date: '2026-10-02', fixed: ['Images are no longer larger after compression'], security: ['Paths outside the site are refused'] }
  ] },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var kinds = { added: 'pos', changed: 'info', deprecated: 'warn', removed: 'neg', fixed: 'pos', security: 'neg' };
    var box = h('div', 'wm-changelog');
    W.list(v.items).forEach(function (r) {
      var sec = h('section', 'wm-changelog-release', h('header', null, h('span', 'wm-changelog-v', r.v || r.version || ''),
        r.date ? h('time', { class: 'wm-muted', datetime: r.date }, W.fmtDate(r.date)) : null, r.note ? h('span', 'wm-muted', W.inline(r.note)) : null));
      Object.keys(kinds).forEach(function (k) {
        var list = W.list(r[k]);
        if (!list.length) return;
        sec.appendChild(h('div', 'wm-changelog-kind', h('span', 'wm-tag wm-' + kinds[k], k),
          h('ul', 'wm-list', list.map(function (x) { return h('li', null, W.inline(x)); }))));
      });
      box.appendChild(sec);
    });
    el.appendChild(box);
  }
});
