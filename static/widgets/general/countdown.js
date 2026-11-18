/*
 * countdown — time left until a date; shows a message once it has passed.
 * data:   { "date": "2026-12-31T23:59:00", "label"?, "done"? }
 * config: { "units": ["days", "hours", "minutes", "seconds"] }
 */
WiMark.register('countdown', {
  title: 'Countdown',
  description: 'Live time left until a date, then a message.',
  example: {
    data: { date: '2027-01-01T00:00:00', label: 'Until the next release', done: 'Released!' },
    config: { units: ['days', 'hours', 'minutes', 'seconds'] }
  },
  mount: function (el, data, config) {
    var W = WiMark, h = W.h;
    var target = W.date(data.date);
    if (!target) throw new Error('data.date is not a valid date');
    var size = { days: 86400, hours: 3600, minutes: 60, seconds: 1 };
    var units = W.list(config.units).filter(function (u) { return size[u]; });
    if (!units.length) units = ['days', 'hours', 'minutes', 'seconds'];
    var cells = {};
    var row = h('div', { class: 'wm-countdown-row', role: 'timer', 'aria-live': 'off' });
    units.forEach(function (u) {
      cells[u] = h('span', 'wm-countdown-num', '0');
      row.appendChild(h('div', 'wm-card wm-countdown-cell', cells[u], h('span', 'wm-label', u)));
    });
    var msg = h('div', 'wm-countdown-done');
    el.appendChild(h('div', 'wm-countdown', data.label ? h('div', 'wm-figure-title', W.inline(data.label)) : null, row, msg,
      h('time', { class: 'wm-muted wm-small', datetime: target.toISOString() }, target.toLocaleString(document.documentElement.lang || undefined))));
    var timer;
    function tick() {
      var left = Math.max(0, Math.floor((target - new Date()) / 1000));
      units.forEach(function (u, i) {
        var v = i === 0 ? Math.floor(left / size[u]) : Math.floor((left % size[units[i - 1]]) / size[u]);
        cells[u].textContent = String(v).padStart(i === 0 ? 1 : 2, '0');
      });
      if (left === 0) {
        msg.textContent = data.done || '';
        row.classList.add('wm-countdown-over');
        clearInterval(timer);
      }
      if (!el.isConnected) clearInterval(timer);
    }
    tick();
    timer = setInterval(tick, 1000);
  }
});
