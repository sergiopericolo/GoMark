/*
 * growth — how running times grow: O(1), O(log n), O(n), O(n log n), O(n²)…
 *   ```wimark-growth {"n": 32}
 *   ["log n", "n", "n log n", "n^2", "2^n"]
 *   ```
 */
WiMark.register('growth', {
  title: 'Growth rates',
  description: 'Complexity classes as curves of n on one chart, optionally on a log scale.',
  example: { opts: { n: 24, log: false }, body: ['1', 'log n', 'sqrt(n)', 'n', 'n log n', 'n^2', '2^n'] },
  mount: function (el, v) {
    var W = WiMark, svg = W.svg;
    var names = W.list(v.items).map(String), N = Math.max(4, W.num(v.n, 32));
    var fns = names.map(function (s) { return W.math.compile(s.replace(/\blog\s*n\b/g, 'log2(n)').replace(/\blog\s*\(/g, 'log2('), ['n']); });
    var top = W.num(v.max, Math.min(1e6, Math.max.apply(null, fns.map(function (f) { var y = f(N); return isFinite(y) && names.length && y < N * N * 4 ? y : 0; }).concat([N * 1.2]))));
    var c = W.chart(el, { height: W.num(v.height, 300), margin: { right: 90 }, label: 'growth rates' });
    var x = W.scale.linear([1, N], [0, c.w]);
    var y = v.log ? (function () { var f = function (t) { return c.h - (Math.log10(Math.max(1, t)) / Math.log10(Math.max(10, top))) * c.h; }; f.domain = [1, top]; f.ticks = function () { var out = []; for (var p = 1; p <= top; p *= 10) out.push(p); return out; }; return f; })() : W.scale.linear([0, top], [c.h, 0]);
    c.axisY(y);
    c.axisXLinear(x, { format: function (t) { return W.fmt(t); } });
    var clip = W.uid('clip');
    c.add(svg('clipPath', { id: clip }, svg('rect', { x: 0, y: -2, width: c.w + 4, height: c.h + 4 })));
    fns.forEach(function (f, i) {
      c.add(svg('path', { d: W.plotPath(f, 1, N, x, y, 300), class: 'wm-line ' + W.series(i), 'clip-path': 'url(#' + clip + ')', 'data-tip': 'O(' + names[i] + ')' }));
      var yN = f(N), py = yN > top ? 0 : y(yN), px = yN > top ? c.w : x(N);
      if (yN > top) { var lo = 1, hi = N; for (var k = 0; k < 40; k++) { var mid = (lo + hi) / 2; if (f(mid) > top) hi = mid; else lo = mid; } px = x(lo); }
      c.add(svg('text', { x: Math.min(c.w + 6, px + 6), y: py + 4 + (yN > top ? 10 : 0), class: 'wm-value', text: 'O(' + names[i] + ')' }));
    });
  }
});
