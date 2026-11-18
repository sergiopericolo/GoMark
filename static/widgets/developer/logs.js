/*
 * logs — log lines with level badges and level filters.
 * data:   { "lines": [{ "time"?, "level", "msg", "source"? }] } or { "text": "2026-11-18 INFO msg…" }
 * config: { "filter": true, "wrap": false }
 */
WiMark.register('logs', {
  title: 'Log viewer',
  description: 'Log lines with level badges (icon + label) and toggles per level.',
  example: {
    data: { text: '19:02:11 INFO  build: en → dist/en, 42 pages\n19:02:11 WARN  depth: en/notes/a/b/c/d.md beyond max_depth 3, skipped\n19:02:12 INFO  build: it → dist/it, 42 pages (5 fallback)\n19:02:12 DEBUG images: 3 compressed, 1.2 MB → 310 KB\n19:02:13 ERROR ai: proposal rejected: code block changed in translation' },
    config: { filter: true, wrap: false }
  },
  mount: function (el, data, config) {
    var W = WiMark, h = W.h;
    var lines = W.list(data.lines);
    if (!lines.length) lines = String(data.text || '').split('\n').filter(Boolean).map(function (l) {
      var m = /^(\S+(?:\s\d\d:\d\d:\d\d\S*)?)\s+(TRACE|DEBUG|INFO|WARN|WARNING|ERROR|FATAL)\s+(.*)$/i.exec(l);
      return m ? { time: m[1], level: m[2], msg: m[3] } : { level: 'INFO', msg: l };
    });
    var st = { trace: 'info', debug: 'info', info: 'pos', warn: 'warn', warning: 'warn', error: 'neg', fatal: 'neg' };
    var levels = [], hidden = {};
    lines.forEach(function (l) { var lv = String(l.level || 'info').toLowerCase(); if (levels.indexOf(lv) < 0) levels.push(lv); });
    var body = h('div', 'wm-logs-body' + (config.wrap ? ' wm-wrap' : ''));
    function draw() {
      body.textContent = '';
      lines.forEach(function (l) {
        var lv = String(l.level || 'info').toLowerCase();
        if (hidden[lv]) return;
        body.appendChild(h('div', 'wm-logs-line', l.time ? h('span', 'wm-logs-time', l.time) : null,
          h('span', 'wm-logs-level wm-' + (st[lv] || 'info'), lv.toUpperCase()), l.source ? h('span', 'wm-logs-src', l.source) : null, h('span', 'wm-logs-msg', l.msg || '')));
      });
    }
    if (config.filter !== false && levels.length > 1) {
      el.appendChild(h('div', 'wm-row wm-logs-filter', levels.map(function (lv) {
        var b = h('button', { type: 'button', class: 'wm-btn on', 'aria-pressed': 'true' }, lv);
        b.addEventListener('click', function () { hidden[lv] = !hidden[lv]; b.setAttribute('aria-pressed', String(!hidden[lv])); b.classList.toggle('on', !hidden[lv]); draw(); });
        return b;
      })));
    }
    el.appendChild(h('div', 'wm-code wm-logs', body));
    draw();
  }
});
