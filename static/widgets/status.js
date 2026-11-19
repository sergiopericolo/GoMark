/*
 * status — services with their state, uptime and a history strip.
 *   ```wimark-status
 *   [["API", "ok", "99.98%", "oooooooooxoo"], ["Search", "degraded", "99.1%"]]
 *   ```
 *   history: o up · x down · ! degraded · . no data
 */
WiMark.register('status', {
  title: 'Service status',
  description: 'Services [name, state, uptime, history] with icon and label; history "ooo!x" is a strip of up, degraded, down.',
  example: { body: [['Docs site', 'ok', '100%', 'oooooooooooooooooooooooooooooo'], ['Build API', 'degraded', '99.62%', 'oooooooooooooooooooooooooo!!!o'], ['AI proxy', 'down', '97.80%', 'oooooooxxooooooooooooooooooxxx'], ['Search', 'maintenance', '—', 'oooooooooooooooooooooooooo....']] },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var ul = h('ul', 'wm-status');
    W.rows(v.items, ['name', 'state', 'uptime', 'history']).forEach(function (s) {
      var st = s.state === 'maintenance' ? 'info' : W.state(s.state);
      var strip = h('span', { class: 'wm-status-strip', 'aria-hidden': 'true' }, String(s.history || '').split('').map(function (c) { return h('i', 'wm-status-tick wm-' + ({ o: 'pos', x: 'neg', '!': 'warn' }[c] || 'none')); }));
      ul.appendChild(h('li', 'wm-status-row wm-' + st, h('span', 'wm-icon', h('span', null, W.icon(st))), h('span', 'wm-status-name', W.inline(s.name)),
        h('span', 'wm-status-state', String(s.state || '')), s.history ? strip : null, h('span', 'wm-status-up', s.uptime || '')));
    });
    el.appendChild(ul);
  }
});
