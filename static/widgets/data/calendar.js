/*
 * calendar — a year of days as a grid of weeks, shaded by value (contributions style).
 * data:   { "values": { "2026-01-05": 3, … } } or [{ "date", "value" }]
 * config: { "year": 0, "start_monday": true }   (year 0 = the year of the latest date)
 */
WiMark.register('calendar', {
  title: 'Calendar heatmap',
  description: 'Every day of a year as a cell shaded by value; weeks across, weekdays down.',
  example: {
    data: (function () {
      var v = {}, d = new Date(2026, 0, 1);
      for (var i = 0; i < 365; i++, d.setDate(d.getDate() + 1)) {
        var k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        var n = Math.round(Math.max(0, 4 * Math.sin(i / 9) + 3 * Math.sin(i / 2.3) + (d.getDay() % 6 ? 2 : -3)));
        if (n) v[k] = n;
      }
      return { values: v };
    })(),
    config: { year: 2026, start_monday: true }
  },
  mount: function (el, data, config) {
    var W = WiMark, svg = W.svg, h = W.h;
    var vals = {};
    if (Array.isArray(data)) data.forEach(function (d) { vals[d.date] = W.num(d.value); });
    else Object.keys(data.values || {}).forEach(function (k) { vals[k] = W.num(data.values[k]); });
    var keys = Object.keys(vals).sort();
    var year = W.num(config.year, 0) || (keys.length ? +keys[keys.length - 1].slice(0, 4) : new Date().getFullYear());
    var max = Math.max.apply(null, keys.filter(function (k) { return +k.slice(0, 4) === year; }).map(function (k) { return vals[k]; }).concat([1]));
    var cell = 11, gap = 2, mon = config.start_monday !== false;
    var c = W.chart(el, { width: 54 * (cell + gap) + 30, height: 7 * (cell + gap) + 26, margin: { top: 18, right: 2, bottom: 2, left: 28 }, label: 'calendar ' + year });
    var d = new Date(year, 0, 1), week = 0, lastMonth = -1, total = 0;
    var dow = function (dt) { return mon ? (dt.getDay() + 6) % 7 : dt.getDay(); };
    (mon ? ['Mon', '', 'Wed', '', 'Fri', '', ''] : ['', 'Mon', '', 'Wed', '', 'Fri', '']).forEach(function (l, i) {
      if (l) c.add(svg('text', { x: -6, y: i * (cell + gap) + cell - 1, 'text-anchor': 'end', class: 'wm-calendar-text', text: l }));
    });
    while (d.getFullYear() === year) {
      var k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      if (d.getMonth() !== lastMonth) {
        lastMonth = d.getMonth();
        c.add(svg('text', { x: week * (cell + gap), y: -6, class: 'wm-calendar-text', text: d.toLocaleDateString(document.documentElement.lang || undefined, { month: 'short' }) }));
      }
      var v = vals[k] || 0, step = v ? 1 + Math.min(3, Math.floor((v / max) * 3.999)) : 0;
      total += v;
      c.add(svg('rect', { x: week * (cell + gap), y: dow(d) * (cell + gap), width: cell, height: cell, rx: 2, class: 'wm-cell wm-calendar-cell wm-h' + step, 'data-tip': W.fmtDate(k) + ': ' + W.fmt(v) }));
      d.setDate(d.getDate() + 1);
      if (dow(d) === 0) week++;
    }
    el.appendChild(h('div', 'wm-heat-legend', h('span', 'wm-muted', W.fmt(total) + ' in ' + year + ' · less'), [0, 1, 2, 3, 4].map(function (k2) { return h('span', 'wm-heat-step wm-h' + k2); }), h('span', 'wm-muted', 'more')));
  }
});
