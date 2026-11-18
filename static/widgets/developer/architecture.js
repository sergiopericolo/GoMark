/*
 * architecture — a layered architecture: bands of components and the links between them.
 * data:   { "layers": [{ "name", "items": ["A", "B"] }], "links"?: [{ "from", "to", "label"? }] }
 * config: { "accent": "" }   (accent: an item to highlight)
 */
WiMark.register('architecture', {
  title: 'Architecture layers',
  description: 'Horizontal bands of components (front end, engine, storage…) with links across them.',
  example: {
    data: {
      layers: [
        { name: 'front end', items: ['CLI', 'catalog', 'browser'] },
        { name: 'engine', items: ['config', 'render', 'images', 'ai guard'] },
        { name: 'storage', items: ['gomark.toml', 'sections/*.toml', 'content', 'dist/'] }
      ],
      links: [{ from: 'CLI', to: 'render' }, { from: 'render', to: 'dist/', label: 'writes' }, { from: 'CLI', to: 'ai guard' }, { from: 'config', to: 'gomark.toml', label: 'reads' }]
    },
    config: { accent: 'render' }
  },
  mount: function (el, data, config) {
    var W = WiMark, D = W.diagram, svg = W.svg;
    var layers = W.list(data.layers), Wd = 720, bandH = 84, gap = 26, labelW = 110;
    var c = W.chart(el, { width: Wd, height: layers.length * (bandH + gap) - gap + 4, margin: { top: 2, right: 2, bottom: 2, left: 2 }, label: 'architecture' });
    var rect = {}, gB = c.add(svg('g')), gE = c.add(svg('g')), gN = c.add(svg('g'));
    layers.forEach(function (L, i) {
      var y = i * (bandH + gap), items = W.list(L.items);
      gB.appendChild(svg('rect', { x: 0, y: y, width: Wd - 4, height: bandH, rx: 6, class: 'wm-node-soft' }));
      gB.appendChild(svg('text', { x: 14, y: y + bandH / 2 + 4, class: 'wm-title', text: L.name || '' }));
      var slot = (Wd - 4 - labelW - 10) / Math.max(1, items.length);
      items.forEach(function (it, j) {
        var w = Math.min(slot - 14, Math.max(80, D.textWidth(it, 12) + 24)), x = labelW + j * slot + (slot - w) / 2, yy = y + bandH / 2 - 17;
        var acc = it === config.accent;
        gN.appendChild(svg('rect', { x: x, y: yy, width: w, height: 34, rx: 4, class: acc ? 'wm-node-accent' : 'wm-node' }));
        gN.appendChild(svg('text', { x: x + w / 2, y: yy + 21, 'text-anchor': 'middle', class: acc ? 'wm-node-accent-text' : 'wm-node-text', text: it }));
        rect[it] = { x: x, y: yy, w: w, h: 34, cx: x + w / 2, cy: yy + 17 };
      });
    });
    W.list(data.links).forEach(function (l) {
      if (rect[l.from] && rect[l.to]) D.link(gE, rect[l.from], rect[l.to], { label: l.label });
    });
  }
});
