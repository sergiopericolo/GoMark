/*
 * line — series over an ordered axis.
 *   ```wimark-line {"x": ["v1.0", "v1.1", "v1.2"], "y": "ms"}
 *   {"parse": [12, 10, 7], "render": [30, 26, 25]}
 *   ```
 *   or a plain array of numbers for one series
 */
WiMark.register('line', {
  title: 'Line chart',
  description: 'One line per series over labels; dashes and end labels keep series apart in every theme.',
  example: { opts: { x: ['1.0', '1.1', '1.2', '1.3', '1.4', '2.0'], y: 'build time (ms)' }, body: { 'small site': [120, 110, 96, 90, 72, 40], 'docs site': [820, 760, 700, 610, 590, 300] } },
  mount: function (el, v) {
    var W = WiMark, svg = W.svg;
    var S = v.items ? [{ name: '', values: v.items }] : Object.keys(v).filter(function (k) { return Array.isArray(v[k]) && k !== 'x' && typeof v[k][0] === 'number'; }).map(function (k) { return { name: k, values: v[k] }; });
    var n = Math.max.apply(null, S.map(function (s) { return s.values.length; }).concat([0])), labels = W.list(v.x).length ? W.list(v.x).map(String) : S[0].values.map(function (_, i) { return String(i + 1); });
    var direct = S.length > 1 && S.length <= 4;
    var c = W.chart(el, { height: W.num(v.height, 280), margin: { right: direct ? 96 : 16 }, label: 'line chart' });
    var ext = W.extent([].concat.apply([], S.map(function (s) { return s.values.map(Number); })));
    if (v.zero !== false) ext = [Math.min(0, ext[0]), Math.max(0, ext[1])];
    var y = W.scale.linear(ext, [c.h, 0], true), x = function (i) { return n > 1 ? (i * c.w) / (n - 1) : c.w / 2; };
    c.axisY(y);
    c.axisX(labels, x);
    if (v.y) c.add(svg('text', { x: 0, y: -4, class: 'wm-value', text: v.y }));
    S.forEach(function (s, si) {
      var cls = W.series(si), pts = s.values.map(function (val, i) { return [x(i), y(+val), +val, i]; }).filter(function (p) { return isFinite(p[2]); });
      if (!pts.length) return;
      c.add(svg('path', { d: 'M' + pts.map(function (p) { return p[0] + ',' + p[1]; }).join(' L'), class: 'wm-line ' + cls }));
      pts.forEach(function (p) {
        c.add(svg('circle', { cx: p[0], cy: p[1], r: 3.5, class: 'wm-dot ' + cls }));
        c.add(svg('circle', { cx: p[0], cy: p[1], r: 11, class: 'wm-hit', 'data-tip': (s.name ? s.name + ' · ' : '') + labels[p[3]] + ': ' + W.fmt(p[2]) }));
      });
      if (direct) { var last = pts[pts.length - 1]; c.add(svg('text', { x: last[0] + 10, y: last[1] + 4, class: 'wm-value', text: s.name })); }
    });
    if (S.length > 1) el.appendChild(W.legend(S.map(function (s, i) { return { label: s.name, i: i }; }), 'line'));
    W.dataTable(el, [''].concat(S.map(function (s) { return s.name; })), labels.map(function (l, i) { return [l].concat(S.map(function (s) { return s.values[i]; })); }));
  }
});
