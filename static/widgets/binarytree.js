/*
 * binarytree — a binary tree from its level-order array (null = no node).
 *   ```wimark-binarytree {"mark": [6, 7]}
 *   [8, 3, 10, 1, 6, null, 14, null, null, 4, 7]
 *   ```
 */
WiMark.register('binarytree', {
  title: 'Binary tree',
  description: 'A binary tree from a level-order array (heaps, BSTs, LeetCode style); "mark" highlights values, "heap" shows indices.',
  example: { opts: { mark: [6, 4] }, body: [8, 3, 10, 1, 6, null, 14, null, null, 4, 7, 13] },
  mount: function (el, v) {
    var W = WiMark, svg = W.svg;
    var arr = W.list(v.items), mark = W.list(v.mark);
    if (!arr.length || arr[0] === null) throw new Error('the array must start with the root');
    var nodes = [{ v: arr[0], d: 0 }], q = [nodes[0]], i = 1;
    while (q.length && i < arr.length) {
      var p = q.shift();
      ['l', 'r'].forEach(function (side) {
        if (i >= arr.length) return;
        var x = arr[i++];
        if (x !== null && x !== undefined) { var n = { v: x, d: p.d + 1, idx: i - 1 }; p[side] = n; nodes.push(n); q.push(n); }
      });
    }
    nodes[0].idx = 0;
    var order = 0, dmax = 0;
    (function walk(n) { if (!n) return; walk(n.l); n.s = order++; dmax = Math.max(dmax, n.d); walk(n.r); })(nodes[0]);
    var sx = 44, sy = 58, Wd = order * sx + 20, Hd = (dmax + 1) * sy + 10;
    var c = W.chart(el, { width: Wd, height: Hd, margin: { top: 0, right: 0, bottom: 0, left: 0 }, label: 'binary tree' });
    c.svg.style.maxWidth = Wd + 'px';
    var X = function (n) { return 10 + n.s * sx + sx / 2; }, Y = function (n) { return 28 + n.d * sy; };
    nodes.forEach(function (n) { [n.l, n.r].forEach(function (k) { if (k) c.add(svg('line', { x1: X(n), y1: Y(n), x2: X(k), y2: Y(k), class: 'wm-edge' })); }); });
    nodes.forEach(function (n) {
      var hit = mark.indexOf(n.v) >= 0;
      c.add(svg('circle', { cx: X(n), cy: Y(n), r: 16, class: hit ? 'wm-node-accent' : 'wm-node', 'data-tip': 'value ' + n.v + ' · index ' + n.idx + ' · depth ' + n.d }));
      c.add(svg('text', { x: X(n), y: Y(n) + 4, 'text-anchor': 'middle', class: hit ? 'wm-node-accent-text' : 'wm-node-text', text: String(n.v) }));
      if (v.heap) c.add(svg('text', { x: X(n) + 18, y: Y(n) - 12, class: 'wm-edge-text', text: String(n.idx) }));
    });
    el.appendChild(W.h('p', 'wm-muted wm-small', nodes.length + ' nodes · height ' + dmax));
  }
});
