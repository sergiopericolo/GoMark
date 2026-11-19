/*
 * scatter — points (x, y) per group with an optional least-squares fit and R².
 *   ```wimark-scatter {"x": "n", "y": "time (ms)", "fit": true}
 *   {"quicksort": [[1000, 0.08], [2000, 0.17]], "mergesort": [[1000, 0.1], [2000, 0.21]]}
 *   ```
 *   or a plain array [[x, y], …] for one group
 */
WiMark.register('scatter', {
  title: 'Scatter plot',
  description: 'Points per group on two numeric axes, with a least-squares line, its equation and R².',
  example: { opts: { x: 'input size (k)', y: 'time (ms)', fit: true }, body: { quicksort: [[1, 0.9], [2, 1.7], [4, 3.9], [8, 7.6], [16, 16.1], [32, 31.0]], 'merge sort': [[1, 1.2], [2, 2.6], [4, 5.1], [8, 10.4], [16, 20.0], [32, 41.7]] } },
  mount: function (el, v) {
    var W = WiMark, h = W.h, svg = W.svg;
    var groups = v.items ? { '': v.items } : Object.keys(v).filter(function (k) { return Array.isArray(v[k]) && Array.isArray(v[k][0]); }).reduce(function (o, k) { o[k] = v[k]; return o; }, {});
    var names = Object.keys(groups), all = [].concat.apply([], names.map(function (n) { return groups[n]; }));
    var c = W.chart(el, { height: W.num(v.height, 300), margin: { bottom: v.x ? 44 : 32, left: v.y ? 60 : 48 }, label: 'scatter plot' });
    var x = W.scale.linear(W.extent(all.map(function (p) { return +p[0]; })), [0, c.w], true), y = W.scale.linear(W.extent(all.map(function (p) { return +p[1]; })), [c.h, 0], true);
    c.axisY(y);
    c.axisXLinear(x);
    if (v.x) c.add(svg('text', { x: c.w / 2, y: c.h + 38, 'text-anchor': 'middle', text: v.x }));
    if (v.y) c.add(svg('text', { x: -46, y: c.h / 2, transform: 'rotate(-90 -46 ' + c.h / 2 + ')', 'text-anchor': 'middle', text: v.y }));
    var fits = [];
    names.forEach(function (n, si) {
      var P = groups[n].map(function (p) { return [+p[0], +p[1]]; }), cls = W.series(si);
      if (v.fit !== false && P.length > 2) {
        var k = P.length, mx = W.sum(P.map(function (p) { return p[0]; })) / k, my = W.sum(P.map(function (p) { return p[1]; })) / k;
        var sxy = W.sum(P.map(function (p) { return (p[0] - mx) * (p[1] - my); })), sxx = W.sum(P.map(function (p) { return (p[0] - mx) * (p[0] - mx); })), syy = W.sum(P.map(function (p) { return (p[1] - my) * (p[1] - my); }));
        if (sxx) {
          var a = sxy / sxx, b = my - a * mx, r2 = syy ? (sxy * sxy) / (sxx * syy) : 1, d0 = x.domain[0], d1 = x.domain[1];
          c.add(svg('line', { x1: x(d0), y1: y(a * d0 + b), x2: x(d1), y2: y(a * d1 + b), class: 'wm-line wm-trend ' + cls }));
          fits.push(h('span', null, n ? n + ': ' : '', W.tex('y = ' + W.fmt(a, { maximumSignificantDigits: 4 }) + 'x ' + (b < 0 ? '-' : '+') + ' ' + W.fmt(Math.abs(b), { maximumSignificantDigits: 4 }) + ',\\ R^2 = ' + W.fmt(r2, { maximumFractionDigits: 4 }))));
        }
      }
      P.forEach(function (p) { c.add(svg('circle', { cx: x(p[0]), cy: y(p[1]), r: 4.5, class: 'wm-dot ' + cls, 'data-tip': (n ? n + ' · ' : '') + '(' + W.fmt(p[0]) + ', ' + W.fmt(p[1]) + ')' })); });
    });
    if (names.length > 1) el.appendChild(W.legend(names.map(function (n, i) { return { label: n, i: i }; })));
    if (fits.length) el.appendChild(h('div', 'wm-fits', fits));
  }
});
