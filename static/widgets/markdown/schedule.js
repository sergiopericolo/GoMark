/*
 * schedule — a timetable: days across, time slots down, events spanning slots.
 * data:   { "days": ["Mon", …], "slots": ["09:00", …], "events": [{ "day", "start", "end"?, "title", "where"?, "series"? }] }
 * config: { "compact": false }
 */
WiMark.register('schedule', {
  title: 'Schedule',
  description: 'A weekly timetable; events span slots and keep a series per kind.',
  example: {
    data: {
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      slots: ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00'],
      events: [
        { day: 'Mon', start: '09:00', end: '11:00', title: 'Engine', where: 'room 1', series: 0 },
        { day: 'Tue', start: '10:00', title: 'Themes', series: 1 },
        { day: 'Wed', start: '14:00', end: '15:00', title: 'Widgets', series: 2 },
        { day: 'Thu', start: '09:00', title: 'Review', series: 0 },
        { day: 'Fri', start: '11:00', end: '12:00', title: 'Release', series: 3 }
      ]
    },
    config: { compact: false }
  },
  mount: function (el, data, config) {
    var W = WiMark, h = W.h;
    var days = W.list(data.days), slots = W.list(data.slots);
    var grid = h('div', { class: 'wm-schedule' + (config.compact ? ' wm-compact' : ''), role: 'table',
      style: { gridTemplateColumns: '4.5rem repeat(' + days.length + ', minmax(0, 1fr))', gridTemplateRows: 'auto repeat(' + slots.length + ', minmax(2.4rem, auto))' } });
    grid.appendChild(h('div', { class: 'wm-schedule-corner', role: 'columnheader' }));
    days.forEach(function (d, i) { grid.appendChild(h('div', { class: 'wm-schedule-day', role: 'columnheader', style: { gridColumn: String(i + 2), gridRow: '1' } }, d)); });
    slots.forEach(function (s, j) {
      grid.appendChild(h('div', { class: 'wm-schedule-slot', role: 'rowheader', style: { gridColumn: '1', gridRow: String(j + 2) } }, s));
      days.forEach(function (d, i) { grid.appendChild(h('div', { class: 'wm-schedule-cell', style: { gridColumn: String(i + 2), gridRow: String(j + 2) } })); });
    });
    W.list(data.events).forEach(function (e) {
      var c = days.indexOf(e.day), r0 = slots.indexOf(e.start), r1 = e.end ? slots.indexOf(e.end) : r0 + 1;
      if (c < 0 || r0 < 0) return;
      if (r1 <= r0) r1 = r0 + 1;
      grid.appendChild(h('div', { class: 'wm-schedule-event ' + W.series(W.num(e.series, 0)), role: 'cell',
        style: { gridColumn: String(c + 2), gridRow: (r0 + 2) + ' / ' + (r1 + 2) }, 'data-tip': e.day + ' ' + e.start + (e.end ? '–' + e.end : '') + ' · ' + e.title },
        h('strong', null, e.title || ''), e.where ? h('span', null, e.where) : null));
    });
    el.appendChild(h('div', 'wm-schedule-wrap', grid));
  }
});
