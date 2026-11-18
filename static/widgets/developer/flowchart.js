/*
 * flowchart — boxes and arrows, laid out automatically in layers.
 * data:   { "nodes": [{ "id", "label"?, "shape"?: "box" | "round" | "diamond" | "circle", "accent"? }],
 *           "edges": [{ "from", "to", "label"?, "dashed"? }] }
 * config: { "direction": "TB" | "LR" }
 */
WiMark.register('flowchart', {
  title: 'Flowchart',
  description: 'Nodes and arrows auto-laid out in layers (top-down or left-right), with shapes and labels.',
  example: {
    data: {
      nodes: [
        { id: 'md', label: 'page.md', shape: 'round' }, { id: 'parse', label: 'parse Markdown' },
        { id: 'wm', label: 'widget block?', shape: 'diamond' }, { id: 'img', label: 'image WiMark' },
        { id: 'html', label: 'render HTML' }, { id: 'out', label: 'dist/', shape: 'round', accent: true }
      ],
      edges: [
        { from: 'md', to: 'parse' }, { from: 'parse', to: 'wm' }, { from: 'wm', to: 'img', label: 'image' },
        { from: 'wm', to: 'html', label: 'other' }, { from: 'img', to: 'html', dashed: true }, { from: 'html', to: 'out' }
      ]
    },
    config: { direction: 'TB' }
  },
  choices: { direction: ['TB', 'LR'] },
  mount: function (el, data, config) {
    var W = WiMark, D = W.diagram, svg = W.svg;
    var nodes = W.list(data.nodes), edges = W.list(data.edges);
    var byId = {};
    nodes.forEach(function (n) { byId[n.id] = n; n.w = Math.max(80, D.textWidth(n.label || n.id, 12) + 28); n.h = n.shape === 'diamond' ? 52 : n.shape === 'circle' ? n.w : 36; if (n.shape === 'diamond') n.w += 30; });
    var L = D.layers(nodes.map(function (n) { return n.id; }), edges);
    var lr = config.direction === 'LR', gapMain = lr ? 70 : 54, gapCross = 28;
    var mains = L.order.map(function (layer) { return Math.max.apply(null, layer.map(function (id) { return lr ? byId[id].w : byId[id].h; }).concat([0])); });
    var crossLen = L.order.map(function (layer) { return W.sum(layer.map(function (id) { return lr ? byId[id].h : byId[id].w; })) + gapCross * (layer.length - 1); });
    var maxCross = Math.max.apply(null, crossLen.concat([0]));
    var pos = 10;
    L.order.forEach(function (layer, li) {
      var c = (maxCross - crossLen[li]) / 2 + 10;
      layer.forEach(function (id) {
        var n = byId[id];
        if (lr) { n.x = pos + (mains[li] - n.w) / 2; n.y = c; c += n.h + gapCross; }
        else { n.y = pos + (mains[li] - n.h) / 2; n.x = c; c += n.w + gapCross; }
      });
      pos += mains[li] + gapMain;
    });
    // Edges that skip layers bend around the nodes in between: leave room for them.
    var long = edges.filter(function (e) { return byId[e.from] && byId[e.to] && Math.abs(L.rank[e.to] - L.rank[e.from]) > 1; });
    var bulge = long.length ? 70 : 0;
    var Wd = lr ? pos - gapMain + 10 : maxCross + 20 + bulge, Hd = lr ? maxCross + 20 + bulge : pos - gapMain + 10;
    var c = W.chart(el, { width: Wd, height: Hd, margin: { top: 0, right: 0, bottom: 0, left: 0 }, label: 'flowchart' });
    c.svg.style.maxWidth = Wd + 'px';
    var gE = c.add(svg('g')), gN = c.add(svg('g'));
    edges.forEach(function (e) {
      var a = byId[e.from], b = byId[e.to];
      if (!a || !b) return;
      var ra = { x: a.x, y: a.y, w: a.w, h: a.h, cx: a.x + a.w / 2, cy: a.y + a.h / 2 };
      var rb = { x: b.x, y: b.y, w: b.w, h: b.h, cx: b.x + b.w / 2, cy: b.y + b.h / 2 };
      if (long.indexOf(e) < 0) { D.link(gE, ra, rb, { label: e.label, dashed: e.dashed }); return; }
      var d, lx, ly, cls = 'wm-edge wm-edge-arrow' + (e.dashed ? ' wm-edge-dash' : '');
      if (lr) {
        var y0 = ra.y + ra.h, y1 = rb.y + rb.h, by = maxCross + 10 + bulge;
        d = 'M' + ra.cx + ',' + y0 + ' C' + ra.cx + ',' + by + ' ' + rb.cx + ',' + by + ' ' + rb.cx + ',' + y1;
        lx = (ra.cx + rb.cx) / 2; ly = by - 18;
      } else {
        var x0 = ra.x + ra.w, x1 = rb.x + rb.w, bx = maxCross + 10 + bulge;
        d = 'M' + x0 + ',' + ra.cy + ' C' + bx + ',' + ra.cy + ' ' + bx + ',' + rb.cy + ' ' + x1 + ',' + rb.cy;
        lx = bx - 18; ly = (ra.cy + rb.cy) / 2;
      }
      gE.appendChild(svg('path', { d: d, class: cls }));
      if (e.label) D.label(gE, lx, ly, e.label);
    });
    nodes.forEach(function (n) {
      var cls = n.accent ? 'wm-node-accent' : 'wm-node', x = n.x, y = n.y, w = n.w, hh = n.h;
      if (n.shape === 'diamond') gN.appendChild(svg('polygon', { class: cls, points: [x + w / 2, y, x + w, y + hh / 2, x + w / 2, y + hh, x, y + hh / 2].join(' ') }));
      else if (n.shape === 'circle') gN.appendChild(svg('circle', { class: cls, cx: x + w / 2, cy: y + hh / 2, r: w / 2 }));
      else gN.appendChild(svg('rect', { class: cls, x: x, y: y, width: w, height: hh, rx: n.shape === 'round' ? hh / 2 : 4 }));
      gN.appendChild(svg('text', { x: x + w / 2, y: y + hh / 2 + 4, 'text-anchor': 'middle', class: n.accent ? 'wm-node-accent-text' : 'wm-node-text', text: n.label || n.id }));
    });
  }
});
