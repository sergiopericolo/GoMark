/*
 * pipeline — CI/CD stages in order with state and duration.
 *   ```wimark-pipeline
 *   [["lint", "ok", "12s"], ["test", "ok", "1m 40s"], ["build", "running"], ["deploy", "pending"]]
 *   ```
 */
WiMark.register('pipeline', {
  title: 'Pipeline',
  description: 'Stages [name, state, duration, jobs?] joined by arrows: ok, failed, running, pending, skipped — each with icon and label.',
  example: { body: [['lint', 'ok', '14s', ['go vet', 'gofmt']], ['test', 'ok', '1m 52s', ['engine', 'widgets (node)']], ['build', 'ok', '38s', ['darwin', 'linux', 'windows']], ['release', 'running', '', ['notes', 'upload']], ['docs', 'pending']] },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var map = { ok: 'pos', success: 'pos', passed: 'pos', failed: 'neg', fail: 'neg', error: 'neg', running: 'info', pending: 'warn', skipped: 'warn', canceled: 'warn' };
    var ol = h('ol', 'wm-pipeline');
    W.rows(v.items, ['name', 'state', 'time', 'jobs']).forEach(function (s, i) {
      var st = map[String(s.state || '').toLowerCase()] || 'info';
      ol.appendChild(h('li', 'wm-stage wm-' + st + (s.state === 'running' ? ' wm-stage-running' : ''),
        h('div', 'wm-stage-head', h('span', 'wm-icon', h('span', null, s.state === 'running' ? '↻' : W.icon(st))), h('strong', null, s.name)),
        h('div', 'wm-muted wm-small', String(s.state || '') + (s.time ? ' · ' + s.time : '')),
        W.list(s.jobs).length ? h('ul', 'wm-stage-jobs', W.list(s.jobs).map(function (j) { return h('li', null, j); })) : null));
    });
    el.appendChild(ol);
  }
});
