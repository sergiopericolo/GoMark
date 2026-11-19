/*
 * linkedlist — nodes and next pointers; doubly linked, cycles, named pointers.
 *   ```wimark-linkedlist {"double": false, "cycle": 1, "ptr": {"head": 0, "slow": 2}}
 *   [3, 7, 1, 9]
 *   ```
 */
WiMark.register('linkedlist', {
  title: 'Linked list',
  description: 'A singly or doubly linked list with named pointers (head, tail, slow, fast) and an optional cycle back to a node.',
  example: { opts: { ptr: { head: 0, slow: 2, fast: 4 }, cycle: 2 }, body: [3, 7, 1, 9, 4, 6] },
  mount: function (el, v) {
    var W = WiMark, svg = W.svg;
    var items = W.list(v.items), ptr = v.ptr || {}, bw = 52, bh = 34, gap = 36;
    var Wd = items.length * (bw + gap) + 40, Hd = 120 + (v.cycle !== undefined && v.cycle !== null ? 30 : 0);
    var c = W.chart(el, { width: Wd, height: Hd, margin: { top: 0, right: 0, bottom: 0, left: 0 }, label: 'linked list' });
    c.svg.style.maxWidth = Wd + 'px';
    var X = function (i) { return 20 + i * (bw + gap); }, y = 44;
    items.forEach(function (x, i) {
      c.add(svg('rect', { x: X(i), y: y, width: bw, height: bh, rx: 4, class: 'wm-node' }));
      c.add(svg('line', { x1: X(i) + bw - 14, x2: X(i) + bw - 14, y1: y, y2: y + bh, class: 'wm-edge' }));
      c.add(svg('text', { x: X(i) + (bw - 14) / 2, y: y + bh / 2 + 4, 'text-anchor': 'middle', class: 'wm-node-text', text: String(x) }));
      if (i < items.length - 1) {
        c.add(svg('line', { x1: X(i) + bw - 7, y1: y + bh / 2 - (v.double ? 5 : 0), x2: X(i + 1) - 2, y2: y + bh / 2 - (v.double ? 5 : 0), class: 'wm-edge wm-edge-arrow' }));
        if (v.double) c.add(svg('line', { x1: X(i + 1), y1: y + bh / 2 + 5, x2: X(i) + bw + 2, y2: y + bh / 2 + 5, class: 'wm-edge wm-edge-arrow' }));
      } else if (v.cycle === undefined || v.cycle === null) {
        c.add(svg('text', { x: X(i) + bw + 8, y: y + bh / 2 + 4, class: 'wm-edge-text', text: '∅' }));
      }
      var names = Object.keys(ptr).filter(function (k) { return ptr[k] === i; });
      if (names.length) {
        c.add(svg('text', { x: X(i) + bw / 2 - 7, y: 16, 'text-anchor': 'middle', class: 'wm-value', text: names.join(', ') }));
        c.add(svg('line', { x1: X(i) + bw / 2 - 7, y1: 22, x2: X(i) + bw / 2 - 7, y2: y - 3, class: 'wm-edge wm-edge-arrow' }));
      }
    });
    if (v.cycle !== undefined && v.cycle !== null && items.length) {
      var last = items.length - 1, to = W.num(v.cycle), yb = y + bh + 30;
      c.add(svg('path', { d: 'M' + (X(last) + bw - 7) + ',' + (y + bh) + ' C' + (X(last) + bw) + ',' + yb + ' ' + (X(to) + bw / 2) + ',' + yb + ' ' + (X(to) + bw / 2 - 7) + ',' + (y + bh + 3), class: 'wm-edge wm-edge-dash wm-edge-arrow' }));
      c.add(svg('text', { x: (X(last) + X(to)) / 2 + bw / 2, y: yb + 10, 'text-anchor': 'middle', class: 'wm-edge-text', text: 'cycle' }));
    }
  }
});
