/*
 * changelog — versions with typed changes (added, changed, fixed, removed, security, deprecated).
 * data:   [{ "version", "date"?, "changes": [{ "type", "text" }] }]
 * config: { "group": true }   (group: changes grouped by type inside each version)
 */
WiMark.register('changelog', {
  title: 'Changelog',
  description: 'Versions with typed changes, Keep-a-Changelog style.',
  example: {
    data: [
      { version: '1.2.0', date: '2026-11-18', changes: [
        { type: 'added', text: 'Theme classes: monochrome, bicolor, colored.' },
        { type: 'added', text: '100 WiMarks with a catalog.' },
        { type: 'changed', text: '`gomark build` publishes every language.' },
        { type: 'removed', text: 'The Chart.js `chart` widget.' }
      ] },
      { version: '1.1.0', date: '2026-06-01', changes: [{ type: 'fixed', text: 'Depth rule for folders.' }, { type: 'security', text: 'Links are filtered.' }] }
    ],
    config: { group: true }
  },
  mount: function (el, data, config) {
    var W = WiMark, h = W.h;
    var order = ['added', 'changed', 'deprecated', 'removed', 'fixed', 'security'];
    var states = { added: 'pos', changed: 'info', deprecated: 'warn', removed: 'neg', fixed: 'info', security: 'warn' };
    var box = h('div', 'wm-changelog');
    W.list(data).forEach(function (v) {
      var changes = W.list(v.changes).map(function (c) { return typeof c === 'string' ? { type: 'changed', text: c } : c; });
      var types = config.group === false ? [null] : order.concat(changes.map(function (c) { return c.type; }).filter(function (t, i, a) { return order.indexOf(t) < 0 && a.indexOf(t) === i; }));
      var sec = h('section', 'wm-changelog-version', h('header', 'wm-row', h('strong', 'wm-changelog-v', v.version || ''),
        v.date ? h('time', { class: 'wm-muted', datetime: v.date }, W.fmtDate(v.date)) : null));
      types.forEach(function (type) {
        var list = changes.filter(function (c) { return type === null || c.type === type; });
        if (!list.length) return;
        sec.appendChild(h('ul', null, list.map(function (c) {
          var t = String(c.type || 'changed').toLowerCase();
          return h('li', null, h('span', 'wm-changelog-type wm-' + (states[t] || 'info'), t), h('span', null, W.inline(c.text || '')));
        })));
      });
      box.appendChild(sec);
    });
    el.appendChild(box);
  }
});
