/*
 * mindmap — a radial map: the topic at the centre, branches around it.
 * data:   { "label", "children": [{ "label", "children"? }] }
 * config: { "size": 520 }
 */
WiMark.register('mindmap', {
  title: 'Mind map',
  description: 'A topic at the centre with branches around it; each first-level branch is one series.',
  example: {
    data: {
      label: 'GoMark 1.2', children: [
        { label: 'themes', children: [{ label: 'monochrome' }, { label: 'bicolor' }, { label: 'colored' }] },
        { label: 'sections', children: [{ label: 'columns' }, { label: 'page' }, { label: 'toml' }] },
        { label: 'languages', children: [{ label: 'switch' }, { label: 'fallback' }] },
        { label: 'WiMark', children: [{ label: '100 widgets' }, { label: 'catalog' }] },
        { label: 'AI', children: [{ label: 'translate' }, { label: 'convert' }, { label: 'guards' }] }
      ]
    },
    config: { size: 560 }
  },
  mount: function (el, data, config) {
    var W = WiMark, D = W.diagram, svg = W.svg;
    var size = Math.max(320, W.num(config.size, 560)), cx = size / 2 + 60, cy = size / 2, ring = size / 2 / 2.6;
    function count(n) { var k = W.list(n.children); n.leaves = k.length ? W.sum(k.map(count)) : 1; return n.leaves; }
    count(data);
    var c = W.chart(el, { width: size + 120, height: size, margin: { top: 0, right: 0, bottom: 0, left: 0 }, label: 'mind map' });
    c.svg.style.maxWidth = (size + 120) + 'px';
    var gE = c.add(svg('g')), gN = c.add(svg('g'));
    function place(n, a0, a1, depth, series) {
      var a = (a0 + a1) / 2, r = depth * ring;
      n.x = cx + r * Math.cos(a); n.y = cy + r * Math.sin(a);
      var acc = a0;
      W.list(n.children).forEach(function (k, i) {
        var span = ((a1 - a0) * k.leaves) / n.leaves;
        place(k, acc, acc + span, depth + 1, depth === 0 ? i : series);
        acc += span;
        gE.appendChild(svg('path', { d: 'M' + n.x + ',' + n.y + ' Q' + (cx + (depth + 0.5) * ring * Math.cos((acc - span / 2 + a) / 2)) + ',' + (cy + (depth + 0.5) * ring * Math.sin((acc - span / 2 + a) / 2)) + ' ' + k.x + ',' + k.y,
          class: 'wm-line ' + W.series(depth === 0 ? i : series) }));
      });
      var w = D.textWidth(n.label, depth ? 11.5 : 13) + (depth ? 14 : 24);
      if (depth === 0) {
        gN.appendChild(svg('rect', { x: n.x - w / 2, y: n.y - 17, width: w, height: 34, rx: 17, class: 'wm-node-accent' }));
        gN.appendChild(svg('text', { x: n.x, y: n.y + 4.5, 'text-anchor': 'middle', class: 'wm-node-accent-text', text: n.label }));
      } else {
        gN.appendChild(svg('rect', { x: n.x - w / 2, y: n.y - 11, width: w, height: 22, rx: 11, class: depth === 1 ? 'wm-cell ' + W.series(series) : 'wm-node-soft' }));
        gN.appendChild(svg('text', { x: n.x, y: n.y + 4, 'text-anchor': 'middle', class: depth === 1 ? 'wm-on ' + W.series(series) : 'wm-node-text', text: n.label }));
      }
    }
    place(data, -Math.PI / 2, (3 * Math.PI) / 2, 0, 0);
  }
});
