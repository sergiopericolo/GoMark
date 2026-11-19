/*
 * coverage — test coverage per package with thresholds.
 *   ```wimark-coverage {"good": 80, "warn": 60}
 *   [["engine", 87.4], ["cli", 41.2], ["static", 63]]
 *   ```
 */
WiMark.register('coverage', {
  title: 'Coverage',
  description: 'Coverage per package or file as bars, graded against "good" and "warn" thresholds, with the total.',
  example: { opts: { good: 80, warn: 60 }, body: [['engine', 84.1, 2310], ['engine/ai', 71.5, 960], ['cli', 42.0, 610], ['static (js)', 63.3, 1840]] },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var good = W.num(v.good, 80), warn = W.num(v.warn, 60), rows = W.rows(v.items, ['name', 'pct', 'lines']);
    var st = function (p) { return p >= good ? 'pos' : p >= warn ? 'warn' : 'neg'; };
    var weighted = rows.every(function (r) { return r.lines; }), tw = W.sum(rows.map(function (r) { return weighted ? r.lines : 1; }));
    var total = W.sum(rows.map(function (r) { return +r.pct * (weighted ? r.lines : 1); })) / (tw || 1);
    var list = h('ul', 'wm-cov');
    rows.concat([{ name: 'total', pct: total, total: true }]).forEach(function (r) {
      var p = +r.pct, fill = h('span', 'wm-cov-fill wm-' + st(p));
      fill.style.width = Math.max(0, Math.min(100, p)) + '%';
      var bar = h('span', 'wm-cov-bar', fill, h('span', 'wm-cov-mark'));
      bar.lastChild.style.left = good + '%';
      list.appendChild(h('li', 'wm-cov-row' + (r.total ? ' wm-cov-total' : ''), h('code', null, r.name), bar,
        h('span', 'wm-cov-pct wm-' + st(p), h('span', { 'aria-hidden': 'true' }, W.icon(st(p)) + ' '), W.fmt(p, { maximumFractionDigits: 1 }) + '%')));
    });
    el.appendChild(list);
  }
});
