/*
 * metrics — key numbers as cards: value, change and its direction.
 *   ```wimark-metrics
 *   [["p99 latency", "42 ms", "-8%", "good"], ["throughput", "12k req/s", "+3%"], ["errors", "0.02%", "+0.01", "bad"]]
 *   ```
 */
WiMark.register('metrics', {
  title: 'Metrics',
  description: 'Key numbers as cards [label, value, change?, good|bad?]: the change gets ▲▼ and a state, never color alone.',
  example: { body: [['build time', '0.99 s', '−41%', 'good'], ['pages', '42', '+6'], ['output size', '3.1 MB', '−18%', 'good'], ['warnings', '2', '+2', 'bad']] },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var grid = h('div', 'wm-metrics');
    W.rows(v.items, ['label', 'value', 'change', 'state']).forEach(function (m) {
      var ch = m.change === undefined ? '' : String(m.change), up = /^\+|^▲/.test(ch), down = /^[-−]|^▼/.test(ch);
      var st = m.state ? W.state(m.state) : 'info';
      grid.appendChild(h('div', 'wm-metric', h('div', 'wm-label', W.inline(m.label)), h('div', 'wm-metric-value', String(m.value === undefined ? '' : m.value)),
        ch ? h('div', 'wm-delta wm-' + st, (up ? '▲ ' : down ? '▼ ' : '') + ch.replace(/^[▲▼]\s*/, '')) : null));
    });
    el.appendChild(grid);
  }
});
