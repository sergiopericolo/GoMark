/*
 * mindmap — a topic in the centre and branches around it, from indented lines.
 *   ```wimark-mindmap
 *   Linear algebra
 *     Vectors
 *       dot product
 *     Matrices
 *   ```
 */
WiMark.register('mindmap', {
  title: 'Mind map',
  description: 'Indented lines as a radial map: the first line in the centre, each first-level branch in its own series.',
  input: 'text',
  example: { body: 'Linear algebra\n  Vectors\n    dot product\n    cross product\n  Matrices\n    determinant\n    inverse\n  Eigen\n    eigenvalues\n    diagonalization\n  Spaces\n    basis\n    rank' },
  mount: function (el, v) {
    var W = WiMark, D = W.diagram, svg = W.svg;
    var root = { label: '', kids: [] }, stack = [{ ind: -1, n: root }];
    W.lines(v.text).forEach(function (ln) {
      var ind = ln.match(/^\s*/)[0].replace(/\t/g, '  ').length, n = { label: ln.trim(), kids: [] };
      while (stack[stack.length - 1].ind >= ind) stack.pop();
      stack[stack.length - 1].n.kids.push(n);
      stack.push({ ind: ind, n: n });
    });
    var top = root.kids[0] || { label: '', kids: [] }, Wd = 680, Hd = W.num(v.height, 400), cx = Wd / 2, cy = Hd / 2;
    var c = W.chart(el, { width: Wd, height: Hd, margin: { top: 0, right: 0, bottom: 0, left: 0 }, label: 'mind map' });
    var leaves = function (n) { return n.kids.length ? W.sum(n.kids.map(leaves)) : 1; }, total = leaves(top) || 1, gE = c.add(svg('g')), gN = c.add(svg('g'));
    (function place(n, a0, a1, d, cls, px, py) {
      var a = (a0 + a1) / 2, r = d === 0 ? 0 : d === 1 ? 130 : 130 + (d - 1) * 95;
      var x = cx + r * Math.cos(a) * 1.25, y = cy + r * Math.sin(a) * 0.9;
      if (d > 0) gE.appendChild(svg('path', { d: 'M' + px + ',' + py + ' Q' + ((px + x) / 2) + ',' + py + ' ' + x + ',' + y, class: 'wm-line wm-mind-edge ' + cls }));
      var w = D.textWidth(n.label, d === 0 ? 13 : 12) + 20;
      if (d === 0) { gN.appendChild(svg('rect', { x: x - w / 2, y: y - 16, width: w, height: 32, rx: 16, class: 'wm-node-accent' })); gN.appendChild(svg('text', { x: x, y: y + 5, 'text-anchor': 'middle', class: 'wm-node-accent-text', text: n.label })); }
      else if (d === 1) { gN.appendChild(svg('rect', { x: x - w / 2, y: y - 13, width: w, height: 26, rx: 13, class: 'wm-mark ' + cls })); gN.appendChild(svg('text', { x: x, y: y + 4, 'text-anchor': 'middle', class: 'wm-on ' + cls, text: n.label })); }
      else gN.appendChild(svg('text', { x: x + (Math.cos(a) >= 0 ? 4 : -4), y: y + 4, 'text-anchor': Math.cos(a) >= 0 ? 'start' : 'end', class: 'wm-node-text', text: n.label }));
      var at = a0;
      n.kids.forEach(function (k, i) { var span = ((a1 - a0) * leaves(k)) / leaves(n); place(k, at, at + span, d + 1, d === 0 ? W.series(i) : cls, x, y); at += span; });
    })(top, -Math.PI / 2, 1.5 * Math.PI, 0, '', cx, cy);
    void total;
  }
});
