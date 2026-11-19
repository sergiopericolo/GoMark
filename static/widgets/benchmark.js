/*
 * benchmark — results before and after, with the change of each row.
 *   ```wimark-benchmark {"cols": ["v1.4", "v2.0"], "unit": "ns/op", "better": "lower"}
 *   [["Parse", 1200, 980], ["Render", 3400, 3550]]
 *   ```
 */
WiMark.register('benchmark', {
  title: 'Benchmark',
  description: 'Benchmarks [name, base, new, …] in one unit with the change ▲▼ against the first column, good or bad by "better".',
  example: { opts: { cols: ['v1.4', 'v2.0'], unit: 'ns/op', better: 'lower' }, body: [['BenchmarkParse', 1210, 985], ['BenchmarkRender', 3420, 3555], ['BenchmarkEncodePNG', 88100, 41300], ['BenchmarkPalette', 152000, 61900]] },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var cols = W.list(v.cols), lower = v.better !== 'higher';
    var rows = W.list(v.items).map(function (r) {
      r = W.list(r);
      var base = +r[1], vals = r.slice(1).map(Number), last = vals[vals.length - 1], ch = base ? (last - base) / base : 0, good = lower ? ch < 0 : ch > 0;
      var bar = h('span', 'wm-bench-bar');
      var max = Math.max.apply(null, vals);
      vals.forEach(function (x, i) { var b = h('span', 'wm-bench-fill ' + W.series(i)); b.style.width = (max ? (100 * x) / max : 0) + '%'; bar.appendChild(b); });
      return [h('code', null, r[0])].concat(vals.map(function (x) { return W.fmt(x); }), [bar, Math.abs(ch) < 0.005 ? h('span', 'wm-delta wm-info', '~') : h('span', 'wm-delta wm-' + (good ? 'pos' : 'neg'), (ch > 0 ? '▲ +' : '▼ ') + W.fmt(ch, { style: 'percent', maximumFractionDigits: 1 }))]);
    });
    el.appendChild(W.table(['benchmark'].concat(cols.map(function (c) { return c + (v.unit ? ' (' + v.unit + ')' : ''); }), ['', 'change']), rows, { align: ['left'].concat(cols.map(function () { return 'right'; }), ['left', 'right']) }));
    if (cols.length > 1) el.appendChild(W.legend(cols.map(function (c, i) { return { label: c, i: i }; })));
  }
});
