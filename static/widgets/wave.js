/*
 * wave — a digital timing diagram, one compact string per signal.
 *   ```wimark-wave
 *   [["clk", "p......."], ["req", "01..0..."], ["data", "x.=.=.x.", "A B"], ["ack", "0..10..."]]
 *   ```
 *   p clock · 0 1 levels · x unknown · z high impedance · = data (labels in the 3rd slot) · . repeat
 */
WiMark.register('wave', {
  title: 'Timing diagram',
  description: 'Digital signals from WaveDrom-like strings: p clock, 0/1 levels, x unknown, z high-Z, = data with labels, . repeats.',
  example: { opts: { title: 'SPI read' }, body: [['clk', 'p.........'], ['cs', '10.......1'], ['mosi', 'x=.=.x....', 'CMD ADDR'], ['miso', 'z....=.=.z', 'D0 D1'], ['ready', '0.......10']] },
  mount: function (el, v) {
    var W = WiMark, svg = W.svg;
    var sigs = W.rows(v.items, ['name', 'wave', 'labels']), n = Math.max.apply(null, sigs.map(function (s) { return String(s.wave).length; }).concat([1]));
    var lw = Math.max.apply(null, sigs.map(function (s) { return W.diagram.textWidth(s.name, 12); }).concat([20])) + 16, step = 40, rh = 34, hh = 20;
    var c = W.chart(el, { width: lw + n * step + 10, height: sigs.length * rh + 30, margin: { top: 20, right: 10, bottom: 10, left: lw }, title: v.title, label: 'timing diagram' });
    c.svg.style.maxWidth = (lw + n * step + 10) + 'px';
    for (var t = 0; t <= n; t++) c.add(svg('line', { x1: t * step, x2: t * step, y1: -6, y2: sigs.length * rh, class: 'wm-gridline' }));
    sigs.forEach(function (s, i) {
      var y0 = i * rh + 4, hi = y0, lo = y0 + hh, w = String(s.wave), labels = String(s.labels || '').split(/\s+/).filter(Boolean), li = 0, cur = null, d = '';
      c.add(svg('text', { x: -10, y: y0 + hh / 2 + 4, 'text-anchor': 'end', class: 'wm-title', text: s.name }));
      if (w.charAt(0) === 'p' || w.charAt(0) === 'n') {
        for (var k = 0; k < n; k++) {
          var x = k * step, a = w.charAt(0) === 'p' ? hi : lo, b = w.charAt(0) === 'p' ? lo : hi;
          d += (k ? ' L' : 'M') + x + ',' + a + ' L' + (x + step / 2) + ',' + a + ' L' + (x + step / 2) + ',' + b + ' L' + (x + step) + ',' + b + ' L' + (x + step) + ',' + a;
        }
        c.add(svg('path', { d: d, class: 'wm-wave' }));
        return;
      }
      var segs = [];
      for (var j = 0; j < n; j++) {
        var ch = w.charAt(j) || '.';
        if (ch !== '.' || !cur) { cur = { ch: ch === '.' ? 'x' : ch, from: j, to: j + 1 }; segs.push(cur); } else cur.to = j + 1;
      }
      segs.forEach(function (sg, si) {
        var x0 = sg.from * step, x1 = sg.to * step, prev = segs[si - 1];
        if (sg.ch === '0' || sg.ch === '1' || sg.ch === 'l' || sg.ch === 'h') {
          var yv = sg.ch === '1' || sg.ch === 'h' ? hi : lo, py = prev && (prev.ch === '1' || prev.ch === 'h') ? hi : prev && (prev.ch === '0' || prev.ch === 'l') ? lo : yv;
          c.add(svg('path', { d: 'M' + x0 + ',' + py + ' L' + x0 + ',' + yv + ' L' + x1 + ',' + yv, class: 'wm-wave' }));
        } else if (sg.ch === 'z') {
          c.add(svg('line', { x1: x0, x2: x1, y1: (hi + lo) / 2, y2: (hi + lo) / 2, class: 'wm-wave wm-wave-z' }));
        } else {
          var bus = 'M' + (x0 + 4) + ',' + hi + ' L' + (x1 - 4) + ',' + hi + ' L' + x1 + ',' + (hi + lo) / 2 + ' L' + (x1 - 4) + ',' + lo + ' L' + (x0 + 4) + ',' + lo + ' L' + x0 + ',' + (hi + lo) / 2 + ' Z';
          c.add(svg('path', { d: bus, class: sg.ch === 'x' ? 'wm-wave-x' : 'wm-wave-bus ' + W.series(i) }));
          if (sg.ch === '=' && labels[li] !== undefined) c.add(svg('text', { x: (x0 + x1) / 2, y: (hi + lo) / 2 + 4, 'text-anchor': 'middle', class: 'wm-value', text: labels[li++] }));
        }
      });
    });
  }
});
