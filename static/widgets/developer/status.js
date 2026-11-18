/*
 * status — a status page: services, their state, uptime and recent history.
 * data:   [{ "name", "state": "up" | "degraded" | "down" | "maintenance", "uptime"?, "history"?: ["up", …], "note"? }]
 * config: { "days": 30, "summary": true }
 */
WiMark.register('status', {
  title: 'Service status',
  description: 'Services with state (icon + label), uptime and a history strip.',
  example: {
    data: [
      { name: 'Website', state: 'up', uptime: 99.98, history: 'uuuuuuuuuuuuuuuuuuuuuuuuuuuuuu' },
      { name: 'Catalog', state: 'degraded', uptime: 99.2, note: 'slow theme switch', history: 'uuuuuuuuuuuuuuuuuuuuuuuuuuuddu' },
      { name: 'AI proposals', state: 'down', uptime: 97.5, note: 'provider timeout', history: 'uuuuuuuuuuuuuuuuuuuxuuuuuuuuuxx' },
      { name: 'Docs', state: 'maintenance', history: 'uuuuuuuuuuuuuuuuuuuuuuuuuuuuum' }
    ],
    config: { days: 30, summary: true }
  },
  mount: function (el, data, config) {
    var W = WiMark, h = W.h;
    var map = { up: ['pos', 'operational'], degraded: ['warn', 'degraded'], down: ['neg', 'outage'], maintenance: ['info', 'maintenance'] };
    var code = { u: 'up', d: 'degraded', x: 'down', m: 'maintenance' };
    var items = W.list(data), days = Math.max(1, W.num(config.days, 30));
    if (config.summary !== false) {
      var worst = items.some(function (s) { return s.state === 'down'; }) ? 'down' : items.some(function (s) { return s.state === 'degraded'; }) ? 'degraded' : 'up';
      var m = map[worst];
      el.appendChild(h('div', 'wm-status-summary wm-' + m[0], h('span', { class: 'wm-icon', 'aria-hidden': 'true' }, h('span', null, W.icon(m[0]))),
        worst === 'up' ? 'All systems operational' : worst === 'down' ? 'Some systems have an outage' : 'Some systems are degraded'));
    }
    el.appendChild(h('ul', 'wm-status', items.map(function (s) {
      var m = map[s.state] || map.up;
      var hist = (typeof s.history === 'string' ? s.history.split('').map(function (ch) { return code[ch] || 'up'; }) : W.list(s.history)).slice(-days);
      return h('li', 'wm-status-row',
        h('div', 'wm-status-head', h('strong', null, s.name), s.note ? h('span', 'wm-muted wm-small', s.note) : null,
          h('span', 'wm-status-state wm-' + m[0], h('span', { class: 'wm-icon', 'aria-hidden': 'true' }, h('span', null, W.icon(m[0]))), m[1])),
        hist.length ? h('div', { class: 'wm-status-hist', role: 'img', 'aria-label': 'last ' + hist.length + ' days' }, hist.map(function (st, i) {
          var mm = map[st] || map.up;
          return h('span', { class: 'wm-status-day wm-' + mm[0], 'data-tip': (hist.length - i) + ' days ago · ' + mm[1] });
        })) : null,
        s.uptime !== undefined ? h('div', 'wm-muted wm-small', W.fmt(W.num(s.uptime), { maximumFractionDigits: 2 }) + '% uptime') : null);
    })));
  }
});
