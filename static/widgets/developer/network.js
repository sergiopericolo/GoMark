/*
 * network — a graph of nodes and links, placed by a deterministic force layout.
 * data:   { "nodes": [{ "id", "label"?, "group"? }], "links": [{ "from", "to", "label"? }] }
 * config: { "height": 380, "labels": true }
 */
WiMark.register('network', {
  title: 'Network graph',
  description: 'Nodes and links placed by a force layout (same input, same picture); groups as series.',
  example: {
    data: {
      nodes: [
        { id: 'engine', group: 0 }, { id: 'render', group: 0 }, { id: 'config', group: 0 }, { id: 'themes', group: 1 },
        { id: 'wimark', group: 1 }, { id: 'catalog', group: 1 }, { id: 'ai', group: 2 }, { id: 'guard', group: 2 }, { id: 'images', group: 0 }
      ],
      links: [
        { from: 'engine', to: 'render' }, { from: 'engine', to: 'config' }, { from: 'render', to: 'themes' }, { from: 'render', to: 'wimark' },
        { from: 'wimark', to: 'catalog' }, { from: 'catalog', to: 'themes' }, { from: 'engine', to: 'ai' }, { from: 'ai', to: 'guard' },
        { from: 'render', to: 'images' }, { from: 'images', to: 'themes' }
      ]
    },
    config: { height: 380, labels: true }
  },
  mount: function (el, data, config) {
    var W = WiMark, svg = W.svg;
    var nodes = W.list(data.nodes).map(function (n) { return Object.assign({}, n); }), links = W.list(data.links);
    var Wd = 640, Hd = Math.max(220, W.num(config.height, 380)), byId = {};
    nodes.forEach(function (n, i) { byId[n.id] = n; var a = (2 * Math.PI * i) / nodes.length; n.x = Wd / 2 + 120 * Math.cos(a); n.y = Hd / 2 + 120 * Math.sin(a); });
    var L = links.filter(function (l) { return byId[l.from] && byId[l.to]; });
    var k = Math.sqrt((Wd * Hd) / Math.max(1, nodes.length)) * 0.55;
    for (var it = 0, temp = 60; it < 300; it++, temp *= 0.985) {
      nodes.forEach(function (a) { a.dx = 0; a.dy = 0; });
      nodes.forEach(function (a, i) {
        for (var j = i + 1; j < nodes.length; j++) {
          var b = nodes[j], dx = a.x - b.x, dy = a.y - b.y, d = Math.max(1, Math.hypot(dx, dy)), f = (k * k) / d;
          a.dx += (dx / d) * f; a.dy += (dy / d) * f; b.dx -= (dx / d) * f; b.dy -= (dy / d) * f;
        }
      });
      L.forEach(function (l) {
        var a = byId[l.from], b = byId[l.to], dx = a.x - b.x, dy = a.y - b.y, d = Math.max(1, Math.hypot(dx, dy)), f = (d * d) / k;
        a.dx -= (dx / d) * f; a.dy -= (dy / d) * f; b.dx += (dx / d) * f; b.dy += (dy / d) * f;
      });
      nodes.forEach(function (a) {
        var d = Math.max(1, Math.hypot(a.dx, a.dy));
        a.x = Math.min(Wd - 50, Math.max(50, a.x + (a.dx / d) * Math.min(d, temp) + (Wd / 2 - a.x) * 0.01));
        a.y = Math.min(Hd - 24, Math.max(24, a.y + (a.dy / d) * Math.min(d, temp) + (Hd / 2 - a.y) * 0.01));
      });
    }
    var c = W.chart(el, { width: Wd, height: Hd, margin: { top: 0, right: 0, bottom: 0, left: 0 }, label: 'network graph' });
    L.forEach(function (l) {
      var a = byId[l.from], b = byId[l.to];
      c.add(svg('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: 'wm-edge' }));
      if (l.label) W.diagram.label(c.plot, (a.x + b.x) / 2, (a.y + b.y) / 2, l.label);
    });
    var degree = {};
    L.forEach(function (l) { degree[l.from] = (degree[l.from] || 0) + 1; degree[l.to] = (degree[l.to] || 0) + 1; });
    var groups = [];
    nodes.forEach(function (n) {
      var g = n.group === undefined ? 0 : n.group;
      if (groups.indexOf(g) < 0) groups.push(g);
      c.add(svg('circle', { cx: n.x, cy: n.y, r: 7 + 2 * Math.sqrt(degree[n.id] || 0), class: 'wm-dot ' + W.series(groups.indexOf(g)), 'data-tip': (n.label || n.id) + ' · ' + (degree[n.id] || 0) + ' links' }));
      if (config.labels !== false) c.add(svg('text', { x: n.x, y: n.y - 14, 'text-anchor': 'middle', class: 'wm-node-text', text: n.label || n.id }));
    });
  }
});
