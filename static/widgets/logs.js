/*
 * logs — log lines with level badges and a toggle per level.
 *   ```wimark-logs
 *   2026-11-19T10:02:11Z INFO  build started
 *   2026-11-19T10:02:12Z WARN  image too large, resized
 *   ```
 */
WiMark.register('logs', {
  title: 'Logs',
  description: 'Log lines; the level (DEBUG INFO WARN ERROR FATAL, or level=…) becomes a badge with icon, each level can be hidden.',
  input: 'text',
  example: { body: '10:02:11.004 INFO  build started lang=en pages=42\n10:02:11.120 DEBUG cache hit media/plot.png\n10:02:11.380 WARN  media/photo.jpg: 6.1 MB, resized to 1600 px\n10:02:11.910 ERROR en/api/old.md: wimark-chart: unknown WiMark\n10:02:12.002 INFO  built 42 pages in 0.99s' },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var LV = { trace: 'info', debug: 'info', info: 'info', notice: 'info', warn: 'warn', warning: 'warn', error: 'neg', err: 'neg', fatal: 'neg', panic: 'neg', ok: 'pos', success: 'pos' };
    var hidden = {}, rows = [], present = [];
    W.lines(v.text).forEach(function (ln) {
      var m = /\b(?:level=)?(TRACE|DEBUG|INFO|NOTICE|WARN(?:ING)?|ERR(?:OR)?|FATAL|PANIC|OK|SUCCESS)\b/i.exec(ln), lv = m ? m[1].toLowerCase().replace('warning', 'warn').replace(/^err$/, 'error') : '';
      if (lv && present.indexOf(lv) < 0) present.push(lv);
      var st = LV[lv] || 'info';
      var row = h('div', 'wm-log-line', lv ? h('span', 'wm-log-lv wm-' + st, h('span', { 'aria-hidden': 'true' }, W.icon(st) + ' '), lv.toUpperCase()) : h('span', 'wm-log-lv'),
        h('span', 'wm-log-text', m ? ln.slice(0, m.index).trim() : '', m ? h('span', 'wm-log-msg', ' ' + ln.slice(m.index + m[0].length).trim()) : ln));
      row.dataset.level = lv;
      rows.push(row);
    });
    var bar = h('div', 'wm-row wm-log-bar');
    present.forEach(function (lv) {
      var b = h('button', { type: 'button', class: 'wm-btn on', 'aria-pressed': 'true' }, lv + ' · ' + rows.filter(function (r) { return r.dataset.level === lv; }).length);
      b.addEventListener('click', function () {
        hidden[lv] = !hidden[lv];
        b.setAttribute('aria-pressed', String(!hidden[lv]));
        b.classList.toggle('on', !hidden[lv]);
        rows.forEach(function (r) { r.hidden = !!hidden[r.dataset.level]; });
      });
      bar.appendChild(b);
    });
    el.appendChild(bar);
    el.appendChild(h('div', 'wm-code wm-logs', rows));
  }
});
