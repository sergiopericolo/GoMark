/*
 * architecture — layers of components, and the links between them.
 *   ```wimark-architecture {"links": ["Web > API", "API > DB"]}
 *   {"Clients": ["Web", "CLI"], "Services": ["API"], "Storage": ["DB"]}
 *   ```
 */
WiMark.register('architecture', {
  title: 'Architecture',
  description: 'Horizontal bands {"Layer": ["component", …]} with "A > B" links across them (dashed with "A ..> B").',
  example: { opts: { links: ['CLI > engine', 'Catalog > engine', 'engine > goldmark', 'engine > Files', 'engine ..> AI provider', 'engine > dist/'] }, body: { 'Front ends': ['CLI', 'Catalog'], 'Engine': ['engine', 'goldmark'], 'Outside': ['Files', 'AI provider', 'dist/'] } },
  mount: function (el, v) {
    var W = WiMark, D = W.diagram, svg = W.svg;
    var layers = Object.keys(v).filter(function (k) { return Array.isArray(v[k]) && k !== 'links'; });
    var Wd = 640, bandH = 78, gap = 26, Hd = layers.length * (bandH + gap), pos = {};
    var c = W.chart(el, { width: Wd, height: Hd, margin: { top: 0, right: 0, bottom: 0, left: 0 }, label: 'architecture' });
    var gB = c.add(svg('g')), gE = c.add(svg('g')), gN = c.add(svg('g'));
    layers.forEach(function (name, i) {
      var y = i * (bandH + gap) + 4, items = v[name];
      gB.appendChild(svg('rect', { x: 0, y: y, width: Wd, height: bandH, rx: 6, class: 'wm-node-soft' }));
      gB.appendChild(svg('text', { x: 10, y: y + 16, class: 'wm-title', text: name }));
      var slot = (Wd - 130) / items.length;
      items.forEach(function (it, k) {
        var w = Math.min(slot - 16, Math.max(80, D.textWidth(it, 12) + 24)), x = 120 + k * slot + (slot - w) / 2, yy = y + 22;
        gN.appendChild(svg('rect', { x: x, y: yy, width: w, height: 40, rx: 4, class: 'wm-node' }));
        gN.appendChild(svg('text', { x: x + w / 2, y: yy + 24, 'text-anchor': 'middle', class: 'wm-node-text', text: it }));
        pos[it] = { x: x, y: yy, w: w, h: 40, cx: x + w / 2, cy: yy + 20 };
      });
    });
    W.list(v.links).forEach(function (l) {
      var m = /^\s*(.+?)\s*(\.\.>|>)\s*(.+?)\s*(?::\s*(.*))?$/.exec(String(l));
      if (m && pos[m[1]] && pos[m[3]]) D.link(gE, pos[m[1]], pos[m[3]], { dashed: m[2] === '..>', label: m[4] });
    });
  }
});
