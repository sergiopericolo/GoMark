/*
 * tree — a hierarchy drawn as a tidy tree.
 * data:   { "label", "children": [{ "label", "children"? }] }
 * config: { "direction": "TB" | "LR" }
 */
WiMark.register('tree', {
  title: 'Tree diagram',
  description: 'A hierarchy as a tidy tree, top-down or left-right; leaves evenly spaced.',
  example: {
    data: {
      label: 'site', children: [
        { label: 'gomark.toml' },
        { label: 'sections', children: [{ label: 'notes.toml' }, { label: 'about.toml' }] },
        { label: 'en', children: [{ label: 'notes' }, { label: 'about' }] },
        { label: 'widgets' }
      ]
    },
    config: { direction: 'TB' }
  },
  choices: { direction: ['TB', 'LR'] },
  mount: function (el, data, config) {
    var W = WiMark, D = W.diagram, svg = W.svg;
    var lr = config.direction === 'LR', leaf = 0, depthMax = 0, all = [];
    var slot = lr ? 40 : 0, levelGap = lr ? 0 : 76;
    function walk(n, d) {
      n.d = d; depthMax = Math.max(depthMax, d); all.push(n);
      n.w = Math.max(60, D.textWidth(n.label, 12) + 22);
      var kids = W.list(n.children);
      if (!kids.length) { n.s = leaf++; return; }
      kids.forEach(function (k) { walk(k, d + 1); });
      n.s = (kids[0].s + kids[kids.length - 1].s) / 2;
    }
    walk(data, 0);
    var widest = Math.max.apply(null, all.map(function (n) { return n.w; }));
    var span = lr ? 40 : widest + 16;
    if (lr) levelGap = widest + 50;
    var Wd = lr ? (depthMax + 1) * levelGap : leaf * span + 20, Hd = lr ? leaf * 40 + 20 : (depthMax + 1) * levelGap;
    var c = W.chart(el, { width: Wd, height: Hd, margin: { top: 0, right: 0, bottom: 0, left: 0 }, label: 'tree' });
    c.svg.style.maxWidth = Wd + 'px';
    all.forEach(function (n) {
      n.cx = lr ? 10 + n.d * levelGap + n.w / 2 : 10 + n.s * span + span / 2;
      n.cy = lr ? 10 + n.s * 40 + 20 : 18 + n.d * levelGap + 18;
    });
    var gE = c.add(svg('g')), gN = c.add(svg('g'));
    all.forEach(function (n) {
      W.list(n.children).forEach(function (k) {
        var d = lr ? 'M' + (n.cx + n.w / 2) + ',' + n.cy + ' C' + (n.cx + n.w / 2 + 25) + ',' + n.cy + ' ' + (k.cx - k.w / 2 - 25) + ',' + k.cy + ' ' + (k.cx - k.w / 2) + ',' + k.cy
          : 'M' + n.cx + ',' + (n.cy + 15) + ' C' + n.cx + ',' + (n.cy + 45) + ' ' + k.cx + ',' + (k.cy - 45) + ' ' + k.cx + ',' + (k.cy - 15);
        gE.appendChild(svg('path', { d: d, class: 'wm-edge' }));
      });
      var accent = n.d === 0;
      gN.appendChild(svg('rect', { x: n.cx - n.w / 2, y: n.cy - 15, width: n.w, height: 30, rx: 4, class: accent ? 'wm-node-accent' : W.list(n.children).length ? 'wm-node' : 'wm-node-soft' }));
      gN.appendChild(svg('text', { x: n.cx, y: n.cy + 4, 'text-anchor': 'middle', class: accent ? 'wm-node-accent-text' : 'wm-node-text', text: n.label }));
    });
  }
});
