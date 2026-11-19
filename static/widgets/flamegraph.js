/*
 * flamegraph — a profile from folded stacks "a;b;c count", widths by samples.
 *   ```wimark-flamegraph {"unit": "ms"}
 *   main;parse;lex 30
 *   main;parse;ast 20
 *   main;render 45
 *   ```
 */
WiMark.register('flamegraph', {
  title: 'Flame graph',
  description: 'Folded stacks ("main;parse;lex 30", as from pprof or perf) as a flame graph: width = samples; click to zoom.',
  input: 'text',
  example: { opts: { unit: 'ms' }, body: 'main;Build;section;renderMarkdown;goldmark.Parse 210\nmain;Build;section;renderMarkdown;goldmark.Render 95\nmain;Build;section;processImages;EncodeImage;shrink 160\nmain;Build;section;processImages;EncodeImage;png.Encode 240\nmain;Build;section;processImages;EncodeImage;paletteImage 120\nmain;Build;copyStatic 45\nmain;Build;cleanDir 18\nmain;Open;toml.Decode 12' },
  mount: function (el, v) {
    var W = WiMark, h = W.h, svg = W.svg;
    var root = { name: 'all', n: 0, kids: {} };
    W.lines(v.text).forEach(function (ln) {
      var m = /^(.*\S)\s+(\d+(?:\.\d+)?)$/.exec(ln.trim());
      if (!m) return;
      var n = +m[2], node = root;
      root.n += n;
      m[1].split(';').forEach(function (f) { node = node.kids[f] = node.kids[f] || { name: f, n: 0, kids: {} }; node.n += n; });
    });
    var host = h('div');
    el.appendChild(host);
    function depth(n) { return 1 + Math.max.apply(null, Object.keys(n.kids).map(function (k) { return depth(n.kids[k]); }).concat([0])); }
    function draw(focus) {
      host.textContent = '';
      var rowH = 20, D = depth(focus), Wd = 700;
      var c = W.chart(host, { width: Wd, height: D * rowH + 4, margin: { top: 0, right: 0, bottom: 0, left: 0 }, label: 'flame graph' });
      (function place(n, x, d, w) {
        var y = (D - d - 1) * rowH, cls = 'wm-flame wm-h' + Math.min(4, d % 5);
        var g = svg('g', { class: 'wm-flame-g', 'data-tip': n.name + ' · ' + W.fmt(n.n) + (v.unit ? ' ' + v.unit : '') + ' · ' + W.fmt(n.n / root.n, { style: 'percent', maximumFractionDigits: 1 }) });
        g.appendChild(svg('rect', { x: x, y: y, width: Math.max(0.5, w - 1), height: rowH - 1, rx: 2, class: cls }));
        if (w > 30) g.appendChild(svg('text', { x: x + 4, y: y + 14, class: 'wm-flame-text' + (d % 5 >= 3 ? ' wm-flame-dark' : ''), text: n.name.length * 6.6 > w - 8 ? n.name.slice(0, Math.max(1, Math.floor((w - 8) / 6.6) - 1)) + '…' : n.name }));
        g.addEventListener('click', function () { draw(n === focus ? root : n); });
        c.add(g);
        var off = x;
        Object.keys(n.kids).sort().forEach(function (k) { var kid = n.kids[k], kw = (w * kid.n) / n.n; place(kid, off, d + 1, kw); off += kw; });
      })(focus, 0, 0, Wd);
    }
    draw(root);
    el.appendChild(h('p', 'wm-muted wm-small', W.fmt(root.n) + (v.unit ? ' ' + v.unit : ' samples') + ' · click a frame to zoom, again to reset'));
  }
});
