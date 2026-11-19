/*
 * gantt — tasks as bars over dates, with progress, milestones and today.
 *   ```wimark-gantt {"today": true}
 *   [["Design", "2026-11-02", "2026-11-13", 100], ["Build", "2026-11-09", "2026-12-04", 40], ["Release", "2026-12-07"]]
 *   ```
 *   [task, start, end?, progress?, group?] — no end makes a milestone.
 */
WiMark.register('gantt', {
  title: 'Gantt chart',
  description: 'Tasks [name, start, end, progress %, group] as bars over dates; no end is a milestone ◆; a line marks today.',
  example: { opts: { today: false }, body: [['Spec', '2026-11-02', '2026-11-09', 100, 'plan'], ['Parser', '2026-11-09', '2026-11-27', 70, 'build'], ['WiMarks', '2026-11-16', '2026-12-11', 35, 'build'], ['Docs', '2026-12-01', '2026-12-15', 0, 'ship'], ['v2.0', '2026-12-16']] },
  mount: function (el, v) {
    var W = WiMark, svg = W.svg;
    var T = W.rows(v.items, ['name', 'start', 'end', 'pct', 'group']).map(function (t) { return { name: t.name, a: W.date(t.start), b: t.end ? W.date(t.end) : null, pct: W.num(t.pct, 0), g: t.group || '' }; }).filter(function (t) { return t.a; });
    var groups = [];
    T.forEach(function (t) { if (groups.indexOf(t.g) < 0) groups.push(t.g); });
    var times = [].concat.apply([], T.map(function (t) { return [+t.a, +(t.b || t.a)]; })), lo = Math.min.apply(null, times), hi = Math.max.apply(null, times), day = 864e5;
    var lw = Math.max.apply(null, T.map(function (t) { return W.diagram.textWidth(t.name, 12); }).concat([40])) + 16;
    var c = W.chart(el, { height: T.length * 28 + 44, margin: { left: lw, top: 24, bottom: 10 }, label: 'gantt chart' });
    var x = W.scale.linear([lo - day, hi + day], [0, c.w]);
    var weeks = Math.ceil((hi - lo) / (7 * day)) + 1, every = Math.max(1, Math.ceil(weeks / 8));
    for (var k = 0; k <= weeks; k += every) {
      var tk = lo + k * 7 * day;
      c.add(svg('line', { x1: x(tk), x2: x(tk), y1: -6, y2: c.h, class: 'wm-gridline' }));
      c.add(svg('text', { x: x(tk), y: -10, 'text-anchor': 'middle', text: W.fmtDate(new Date(tk), { month: 'short', day: 'numeric' }) }));
    }
    T.forEach(function (t, i) {
      var y = i * 28 + 4, cls = W.series(groups.indexOf(t.g));
      c.add(svg('text', { x: -8, y: y + 14, 'text-anchor': 'end', class: 'wm-node-text', text: t.name }));
      if (!t.b) {
        var mx = x(+t.a);
        c.add(svg('polygon', { points: [mx, y + 2, mx + 9, y + 11, mx, y + 20, mx - 9, y + 11].join(' '), class: 'wm-ink', 'data-tip': t.name + ' · ' + W.fmtDate(t.a) }));
        return;
      }
      var x0 = x(+t.a), x1 = x(+t.b + day);
      c.add(svg('rect', { x: x0, y: y, width: Math.max(2, x1 - x0), height: 20, rx: 4, class: 'wm-mark wm-gantt-bar ' + cls, 'data-tip': t.name + ' · ' + W.fmtDate(t.a) + ' → ' + W.fmtDate(t.b) + ' · ' + t.pct + '%' }));
      if (t.pct > 0) c.add(svg('rect', { x: x0, y: y + 15, width: Math.max(0, (x1 - x0) * Math.min(100, t.pct) / 100), height: 5, rx: 2, class: 'wm-gantt-done' }));
    });
    if (v.today) { var now = Date.now(); if (now >= lo - day && now <= hi + day) c.add(svg('line', { x1: x(now), x2: x(now), y1: -6, y2: c.h, class: 'wm-guide wm-today' })); }
    if (groups.length > 1 || groups[0]) el.appendChild(W.legend(groups.filter(Boolean).map(function (g) { return { label: g, i: groups.indexOf(g) }; })));
  }
});
