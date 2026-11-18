/*
 * gantt — tasks on a calendar: bars from start to end, milestones, groups, today line.
 * data:   [{ "name", "start", "end"? | "days"?, "group"?, "done"?: 0..1, "milestone"? }]
 * config: { "today": true, "group_series": true }
 */
WiMark.register('gantt', {
  title: 'Gantt chart',
  description: 'Tasks as bars over dates with progress, milestones, groups (one series each) and today.',
  example: {
    data: [
      { name: 'Themes', group: 'design', start: '2026-10-01', end: '2026-10-20', done: 1 },
      { name: 'WiMarks', group: 'widgets', start: '2026-10-12', end: '2026-11-25', done: 0.8 },
      { name: 'Catalog', group: 'widgets', start: '2026-11-01', days: 18, done: 0.6 },
      { name: 'AI guard', group: 'engine', start: '2026-11-10', end: '2026-12-05', done: 0.3 },
      { name: 'Release', group: 'engine', start: '2026-12-08', milestone: true }
    ],
    config: { today: true, group_series: true }
  },
  mount: function (el, data, config) {
    var W = WiMark, svg = W.svg;
    var day = 864e5;
    var tasks = W.list(data).map(function (t) {
      var s = W.date(t.start), e = t.end ? W.date(t.end) : s && t.days ? new Date(s.getTime() + W.num(t.days) * day) : s;
      return { t: t, s: s, e: e };
    }).filter(function (x) { return x.s; });
    if (!tasks.length) throw new Error('no task has a valid start date');
    var groups = [];
    tasks.forEach(function (x) { if (groups.indexOf(x.t.group || '') < 0) groups.push(x.t.group || ''); });
    var lo = Math.min.apply(null, tasks.map(function (x) { return x.s.getTime(); })) - 2 * day;
    var hi = Math.max.apply(null, tasks.map(function (x) { return x.e.getTime(); })) + 3 * day;
    var labelW = Math.max(90, Math.max.apply(null, tasks.map(function (x) { return W.diagram.textWidth(x.t.name, 12); })) + 20);
    var c = W.chart(el, { width: 720, height: tasks.length * 30 + 50, margin: { top: 28, right: 12, bottom: 16, left: labelW }, label: 'gantt chart' });
    var x = W.scale.linear([lo, hi], [0, c.w]);
    var weeks = Math.ceil((hi - lo) / (7 * day)), step = weeks > 16 ? 28 : weeks > 6 ? 7 : 1;
    var first = new Date(lo);
    first.setHours(0, 0, 0, 0);
    if (step === 7) while (first.getDay() !== 1) first.setDate(first.getDate() + 1); // weeks start on Monday
    for (var t = first.getTime(); t <= hi; t += step * day) {
      var d = new Date(t);
      c.add(svg('line', { x1: x(t), x2: x(t), y1: -6, y2: c.h, class: 'wm-gridline' }));
      c.add(svg('text', { x: x(t) + 3, y: -10, text: W.fmtDate(d, { month: 'short', day: 'numeric' }) }));
    }
    tasks.forEach(function (k, i) {
      var y = i * 30 + 4, cls = config.group_series !== false ? W.series(groups.indexOf(k.t.group || '')) : W.series(0);
      var tip = k.t.name + ' · ' + W.fmtDate(k.s) + (k.t.milestone ? '' : ' → ' + W.fmtDate(k.e)) + (k.t.done !== undefined ? ' · ' + Math.round(W.num(k.t.done) * 100) + '%' : '');
      c.add(svg('text', { x: -10, y: y + 15, 'text-anchor': 'end', class: 'wm-value', text: k.t.name }));
      if (k.t.milestone) {
        var mx = x(k.s.getTime());
        c.add(svg('polygon', { points: [mx, y + 2, mx + 10, y + 11, mx, y + 20, mx - 10, y + 11].join(' '), class: 'wm-mark ' + cls, 'data-tip': tip }));
        return;
      }
      var x0 = x(k.s.getTime()), w = Math.max(4, x(k.e.getTime()) - x0);
      c.add(svg('rect', { x: x0, y: y, width: w, height: 22, rx: 4, class: 'wm-outline ' + cls }));
      c.add(svg('rect', { x: x0, y: y, width: w * Math.max(0, Math.min(1, W.num(k.t.done, 1))), height: 22, rx: 4, class: 'wm-mark ' + cls, 'data-tip': tip }));
      c.add(svg('rect', { x: x0, y: y, width: w, height: 22, rx: 4, class: 'wm-hit', 'data-tip': tip }));
    });
    var now = Date.now();
    if (config.today !== false && now > lo && now < hi) {
      c.add(svg('line', { x1: x(now), x2: x(now), y1: -6, y2: c.h, class: 'wm-stroke-ink wm-today' }));
    }
    if (groups.length > 1 && config.group_series !== false) el.appendChild(W.legend(groups.map(function (g, i) { return { label: g || '—', i: i }; })));
  }
});
