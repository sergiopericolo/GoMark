/*
 * cron — a cron expression explained field by field, with the next runs.
 *   ```wimark-cron {"expr": "0 9-17 * * 1-5", "runs": 5}
 *   ```
 */
WiMark.register('cron', {
  title: 'Cron expression',
  description: 'A five-field cron expression: each field explained, a sentence, and the next runs in the reader’s time zone.',
  example: { opts: { expr: '30 2 * * 1-5', runs: 5 } },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var expr = String(v.expr || v.value || '* * * * *').trim(), parts = expr.split(/\s+/);
    var alias = { '@hourly': '0 * * * *', '@daily': '0 0 * * *', '@midnight': '0 0 * * *', '@weekly': '0 0 * * 0', '@monthly': '0 0 1 * *', '@yearly': '0 0 1 1 *' };
    if (alias[expr]) parts = alias[expr].split(' ');
    if (parts.length !== 5) throw new Error('a cron expression has 5 fields: minute hour day month weekday');
    var F = [['minute', 0, 59], ['hour', 0, 23], ['day of month', 1, 31], ['month', 1, 12], ['day of week', 0, 6]];
    var MON = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'], DOW = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    var sets = parts.map(function (p, i) {
      var lo = F[i][1], hi = F[i][2], out = {};
      p.toLowerCase().split(',').forEach(function (seg) {
        var m = /^(\*|[\w]+)(?:-([\w]+))?(?:\/(\d+))?$/.exec(seg);
        if (!m) throw new Error('cannot read "' + seg + '" in the ' + F[i][0] + ' field');
        var num = function (x) { var k = i === 3 ? MON.indexOf(x) : i === 4 ? DOW.indexOf(x) : -1; return k >= 0 ? k + (i === 3 ? 1 : 0) : +x; };
        var a = m[1] === '*' ? lo : num(m[1]), b = m[2] ? num(m[2]) : m[1] === '*' || m[3] ? hi : a, st = +(m[3] || 1);
        for (var x = a; x <= b; x += st) out[i === 4 && x === 7 ? 0 : x] = true;
      });
      return out;
    });
    var desc = function (i) {
      var p = parts[i];
      if (p === '*') return 'every ' + F[i][0];
      if (/^\*\/\d+$/.test(p)) return 'every ' + p.slice(2) + ' ' + F[i][0] + 's';
      var names = Object.keys(sets[i]).map(Number).sort(function (a, b) { return a - b; }).map(function (x) { return i === 3 ? MON[x - 1] : i === 4 ? DOW[x] : String(x); });
      return names.length > 6 ? p : names.join(', ');
    };
    el.appendChild(h('div', 'wm-cron-expr', parts.map(function (p, i) { return h('div', 'wm-cron-field', h('code', null, p), h('span', 'wm-label', F[i][0])); })));
    el.appendChild(W.table(['field', 'value', 'means'], parts.map(function (p, i) { return [F[i][0], h('code', null, p), desc(i)]; })));
    var runs = [], t = new Date(); t.setSeconds(0, 0); t.setMinutes(t.getMinutes() + 1);
    var domStar = parts[2] === '*', dowStar = parts[4] === '*';
    for (var k = 0; k < 525600 && runs.length < W.num(v.runs, 5); k++) {
      var dom = sets[2][t.getDate()], dow = sets[4][t.getDay()];
      var day = domStar || dowStar ? dom && dow : dom || dow;
      if (sets[0][t.getMinutes()] && sets[1][t.getHours()] && sets[3][t.getMonth() + 1] && day) runs.push(new Date(t));
      t.setMinutes(t.getMinutes() + 1);
    }
    el.appendChild(h('div', 'wm-cron-next', h('span', 'wm-label', 'next runs'), h('ol', 'wm-list', runs.map(function (r) { return h('li', null, h('time', { datetime: r.toISOString() }, r.toLocaleString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }))); }))));
  }
});
