/*
 * graph — a graph from edge strings: "a-b" undirected, "a>b" directed, ":w" weight.
 *   ```wimark-graph {"layout": "circle"}
 *   ["a-b", "b-c:3", "c>a", "c-d"]
 *   ```
 */
WiMark.register('graph', {
  title: 'Graph',
  description: 'Vertices and edges from "a-b", "a>b", "a-b:5" strings; circle or force layout; degrees in tooltips.',
  example: { opts: { layout: 'force' }, body: ['A-B:4', 'A-C:2', 'B-C:1', 'B-D:5', 'C-D:8', 'C-E:10', 'D-E:2', 'D-F:6', 'E-F:3'] },
  choices: { layout: ['force', 'circle'] },
  mount: function (el, v) {
    var W = WiMark, svg = W.svg;
    var ids = [], edges = [];
    W.list(v.items).forEach(function (s) {
      var m = /^\s*([^-><:\s]+)\s*(-|>|<>)\s*([^:\s]+)\s*(?::\s*(.+))?$/.exec(String(s));
      if (!m) { if (String(s).trim() && ids.indexOf(String(s).trim()) < 0) ids.push(String(s).trim()); return; }
      [m[1], m[3]].forEach(function (id) { if (ids.indexOf(id) < 0) ids.push(id); });
      edges.push({ a: m[1], b: m[3], dir: m[2] === '>', w: m[4] });
    });
    var Wd = 560, Hd = W.num(v.height, 340), P = {};
    ids.forEach(function (id, i) { var a = -Math.PI / 2 + (2 * Math.PI * i) / ids.length; P[id] = { x: Wd / 2 + (Hd / 2 - 40) * Math.cos(a), y: Hd / 2 + (Hd / 2 - 40) * Math.sin(a) }; });
    if (v.layout !== 'circle') {
      var k = Math.sqrt((Wd * Hd) / Math.max(1, ids.length)) * 0.6;
      for (var it = 0, temp = 50; it < 300; it++, temp *= 0.985) {
        ids.forEach(function (a) { P[a].dx = 0; P[a].dy = 0; });
        ids.forEach(function (a, i) { for (var j = i + 1; j < ids.length; j++) { var p = P[a], q = P[ids[j]], dx = p.x - q.x, dy = p.y - q.y, d = Math.max(1, Math.hypot(dx, dy)), f = (k * k) / d; p.dx += (dx / d) * f; p.dy += (dy / d) * f; q.dx -= (dx / d) * f; q.dy -= (dy / d) * f; } });
        edges.forEach(function (e) { var p = P[e.a], q = P[e.b], dx = p.x - q.x, dy = p.y - q.y, d = Math.max(1, Math.hypot(dx, dy)), f = (d * d) / k; p.dx -= (dx / d) * f; p.dy -= (dy / d) * f; q.dx += (dx / d) * f; q.dy += (dy / d) * f; });
        ids.forEach(function (a) { var p = P[a], d = Math.max(1, Math.hypot(p.dx, p.dy)); p.x = Math.min(Wd - 30, Math.max(30, p.x + (p.dx / d) * Math.min(d, temp))); p.y = Math.min(Hd - 30, Math.max(30, p.y + (p.dy / d) * Math.min(d, temp))); });
      }
    }
    var c = W.chart(el, { width: Wd, height: Hd, margin: { top: 0, right: 0, bottom: 0, left: 0 }, label: 'graph with ' + ids.length + ' vertices and ' + edges.length + ' edges' });
    c.svg.style.maxWidth = Wd + 'px';
    var deg = {}, r = 16;
    edges.forEach(function (e) {
      deg[e.a] = (deg[e.a] || 0) + 1; deg[e.b] = (deg[e.b] || 0) + 1;
      var p = P[e.a], q = P[e.b], d = Math.max(1, Math.hypot(q.x - p.x, q.y - p.y)), ux = (q.x - p.x) / d, uy = (q.y - p.y) / d;
      c.add(svg('line', { x1: p.x + ux * r, y1: p.y + uy * r, x2: q.x - ux * (r + (e.dir ? 3 : 0)), y2: q.y - uy * (r + (e.dir ? 3 : 0)), class: 'wm-edge' + (e.dir ? ' wm-edge-arrow' : '') }));
      if (e.w !== undefined) W.diagram.label(c.plot, (p.x + q.x) / 2, (p.y + q.y) / 2, e.w);
    });
    ids.forEach(function (id) {
      c.add(svg('circle', { cx: P[id].x, cy: P[id].y, r: r, class: 'wm-node', 'data-tip': id + ' · degree ' + (deg[id] || 0) }));
      c.add(svg('text', { x: P[id].x, y: P[id].y + 4, 'text-anchor': 'middle', class: 'wm-node-text', text: id }));
    });
    el.appendChild(W.h('p', 'wm-muted wm-small', '|V| = ' + ids.length + ', |E| = ' + edges.length + (edges.some(function (e) { return e.dir; }) ? ', directed' : '')));
  }
});
