/*
 * tree — a hierarchy from indented lines, drawn as a tidy tree.
 *   ```wimark-tree {"dir": "TB"}
 *   expr
 *     term
 *       factor
 *     +
 *     term
 *   ```
 */
WiMark.register('tree', {
  title: 'Tree',
  description: 'Indented lines drawn as a tidy tree, top-down or left-right: parse trees, hierarchies, decision trees.',
  input: 'text',
  example: { opts: { dir: 'TB' }, body: 'expr\n  term\n    factor\n      2\n  +\n  term\n    factor\n      x\n    *\n    factor\n      y' },
  choices: { dir: ['TB', 'LR'] },
  mount: function (el, v) {
    var W = WiMark, D = W.diagram, svg = W.svg;
    var root = { label: '', kids: [] }, stack = [{ ind: -1, n: root }];
    W.lines(v.text).forEach(function (ln) {
      var ind = ln.match(/^\s*/)[0].replace(/\t/g, '  ').length, n = { label: ln.trim(), kids: [] };
      while (stack[stack.length - 1].ind >= ind) stack.pop();
      stack[stack.length - 1].n.kids.push(n);
      stack.push({ ind: ind, n: n });
    });
    var top = root.kids.length === 1 ? root.kids[0] : { label: '·', kids: root.kids };
    var lr = v.dir === 'LR', leaf = 0, dmax = 0, all = [];
    (function walk(n, d) {
      n.d = d; dmax = Math.max(dmax, d); all.push(n);
      n.w = Math.max(30, D.textWidth(n.label, 12) + 18);
      if (!n.kids.length) { n.s = leaf++; return; }
      n.kids.forEach(function (k) { walk(k, d + 1); });
      n.s = (n.kids[0].s + n.kids[n.kids.length - 1].s) / 2;
    })(top, 0);
    var widest = Math.max.apply(null, all.map(function (n) { return n.w; })), span = lr ? 38 : widest + 12, gap = lr ? widest + 40 : 64;
    var Wd = lr ? (dmax + 1) * gap : leaf * span + 20, Hd = lr ? leaf * span + 20 : (dmax + 1) * gap;
    var c = W.chart(el, { width: Wd, height: Hd, margin: { top: 0, right: 0, bottom: 0, left: 0 }, label: 'tree' });
    c.svg.style.maxWidth = Wd + 'px';
    all.forEach(function (n) { n.cx = lr ? 10 + n.d * gap + n.w / 2 : 10 + n.s * span + span / 2; n.cy = lr ? 10 + n.s * span + span / 2 : 30 + n.d * gap; });
    var gE = c.add(svg('g')), gN = c.add(svg('g'));
    all.forEach(function (n) {
      n.kids.forEach(function (k) {
        gE.appendChild(svg('path', { class: 'wm-edge', d: lr ? 'M' + (n.cx + n.w / 2) + ',' + n.cy + ' C' + (n.cx + n.w / 2 + 20) + ',' + n.cy + ' ' + (k.cx - k.w / 2 - 20) + ',' + k.cy + ' ' + (k.cx - k.w / 2) + ',' + k.cy
          : 'M' + n.cx + ',' + (n.cy + 13) + ' C' + n.cx + ',' + (n.cy + 38) + ' ' + k.cx + ',' + (k.cy - 38) + ' ' + k.cx + ',' + (k.cy - 13) }));
      });
      var cls = n.d === 0 ? 'wm-node-accent' : n.kids.length ? 'wm-node' : 'wm-node-soft';
      gN.appendChild(svg('rect', { x: n.cx - n.w / 2, y: n.cy - 13, width: n.w, height: 26, rx: 13, class: cls }));
      gN.appendChild(svg('text', { x: n.cx, y: n.cy + 4, 'text-anchor': 'middle', class: n.d === 0 ? 'wm-node-accent-text' : 'wm-node-text', text: n.label }));
    });
  }
});
