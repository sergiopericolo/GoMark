/*
 * tests — a test report: pass, fail, skip with durations and failure messages.
 *   ```wimark-tests {"suite": "engine"}
 *   [["TestParse", "pass", "12ms"], ["TestRender", "fail", "3ms", "want 2, got 3"], ["TestRemote", "skip"]]
 *   ```
 */
WiMark.register('tests', {
  title: 'Test report',
  description: 'Test results [name, pass|fail|skip, duration, message?] with totals and failures first.',
  example: { opts: { suite: 'gomark/engine' }, body: [['TestAutoPicksJPEGForPhotos', 'pass', '41ms'], ['TestReencodingNeverGrows', 'pass', '9ms'], ['TestJPEGsAreTurnedUpright', 'pass', '3ms'], ['TestWiMarkFence', 'fail', '1ms', 'missing data-opts in <pre class="wimark-src">'], ['TestWidgetSyntax', 'skip', '', 'node not installed']] },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var map = { pass: 'pos', ok: 'pos', fail: 'neg', error: 'neg', skip: 'warn', todo: 'info' };
    var rows = W.rows(v.items, ['name', 'state', 'time', 'msg']), count = { pass: 0, fail: 0, skip: 0 };
    rows.forEach(function (r) { var s = String(r.state || 'pass').toLowerCase(); r.st = map[s] || 'info'; count[r.st === 'pos' ? 'pass' : r.st === 'neg' ? 'fail' : 'skip']++; });
    rows.sort(function (a, b) { var o = { neg: 0, warn: 1, info: 2, pos: 3 }; return o[a.st] - o[b.st]; });
    el.appendChild(h('div', 'wm-tests-head', v.suite ? h('code', null, v.suite) : null,
      h('span', 'wm-tag wm-pos', '✓ ' + count.pass + ' passed'), count.fail ? h('span', 'wm-tag wm-neg', '✕ ' + count.fail + ' failed') : null, count.skip ? h('span', 'wm-tag wm-warn', '! ' + count.skip + ' skipped') : null));
    el.appendChild(h('ul', 'wm-tests', rows.map(function (r) {
      return h('li', 'wm-test wm-' + r.st, h('span', 'wm-icon', h('span', null, W.icon(r.st))), h('code', 'wm-test-name', r.name), r.time ? h('span', 'wm-muted wm-test-time', r.time) : null,
        r.msg ? h('div', 'wm-test-msg', r.msg) : null);
    })));
  }
});
