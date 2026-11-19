/*
 * flowchart — boxes and arrows from lines "A -> B" or "A -> B: label", auto laid out.
 *   ```wimark-flowchart {"dir": "TB"}
 *   Start -> Read input
 *   Read input -> Valid?
 *   Valid? -> Process: yes
 *   Valid? -> Read input: no
 *   ```
 *   "Name?" is a decision, sources and sinks are rounded, "A -> B -> C" chains, "-.->" dashed.
 */
WiMark.register('flowchart', {
  title: 'Flowchart',
  description: 'Lines "A -> B: label" (chains allowed, -.-> dashed) laid out in layers; "X?" is a decision, start and end are rounded.',
  input: 'text',
  example: { opts: { dir: 'TB' }, body: 'page.md -> parse Markdown -> wimark fence?\nwimark fence? -> image or gallery?: yes\nwimark fence? -> render HTML: no\nimage or gallery? -> compress: yes\nimage or gallery? -> render HTML: no\ncompress -.-> render HTML\nrender HTML -> dist/' },
  choices: { dir: ['TB', 'LR'] },
  mount: function (el, v) {
    var W = WiMark, D = W.diagram, svg = W.svg;
    var ids = [], edges = [];
    W.lines(v.text).forEach(function (ln) {
      var lab = '', m = /^(.*?(?:->|-\.->)\s*[^:]+?)\s*:\s*([^>]*)$/.exec(ln);
      if (m) { ln = m[1]; lab = m[2].trim(); }
      var parts = ln.split(/\s*(-\.->|->)\s*/);
      for (var i = 0; i < parts.length; i += 2) { var id = parts[i].trim(); if (id && ids.indexOf(id) < 0) ids.push(id); }
      for (var j = 1; j < parts.length; j += 2) edges.push({ from: parts[j - 1].trim(), to: parts[j + 1].trim(), dashed: parts[j] === '-.->', label: j === parts.length - 2 ? lab : '' });
    });
    var inc = {}, out = {};
    edges.forEach(function (e) { out[e.from] = 1; inc[e.to] = 1; });
    var nodes = ids.map(function (id) {
      var shape = /\?$/.test(id) ? 'diamond' : !inc[id] || !out[id] ? 'round' : 'box';
      var n = { id: id, shape: shape, w: Math.max(80, D.textWidth(id, 12) + 28), h: shape === 'diamond' ? 52 : 36 };
      if (shape === 'diamond') n.w += 34;
      return n;
    });
    var byId = {};
    nodes.forEach(function (n) { byId[n.id] = n; });
    var L = D.layers(ids, edges), lr = v.dir === 'LR', gapMain = lr ? 70 : 54, gapCross = 28;
    var mains = L.order.map(function (layer) { return Math.max.apply(null, layer.map(function (id) { return lr ? byId[id].w : byId[id].h; }).concat([0])); });
    var cross = L.order.map(function (layer) { return W.sum(layer.map(function (id) { return lr ? byId[id].h : byId[id].w; })) + gapCross * (layer.length - 1); });
    var maxCross = Math.max.apply(null, cross.concat([0])), pos = 10;
    L.order.forEach(function (layer, li) {
      var cc = (maxCross - cross[li]) / 2 + 10;
      layer.forEach(function (id) { var n = byId[id]; if (lr) { n.x = pos + (mains[li] - n.w) / 2; n.y = cc; cc += n.h + gapCross; } else { n.y = pos + (mains[li] - n.h) / 2; n.x = cc; cc += n.w + gapCross; } });
      pos += mains[li] + gapMain;
    });
    var far = edges.filter(function (e) { return Math.abs(L.rank[e.to] - L.rank[e.from]) > 1 || L.rank[e.to] <= L.rank[e.from]; });
    var bulge = far.length ? 80 : 0;
    var Wd = lr ? pos - gapMain + 10 : maxCross + 20 + bulge, Hd = lr ? maxCross + 20 + bulge : pos - gapMain + 10;
    var c = W.chart(el, { width: Wd, height: Hd, margin: { top: 0, right: 0, bottom: 0, left: 0 }, label: 'flowchart' });
    c.svg.style.maxWidth = Wd + 'px';
    var gE = c.add(svg('g')), gN = c.add(svg('g'));
    var rect = function (n) { return { x: n.x, y: n.y, w: n.w, h: n.h, cx: n.x + n.w / 2, cy: n.y + n.h / 2 }; };
    edges.forEach(function (e, k) {
      var a = rect(byId[e.from]), b = rect(byId[e.to]);
      if (far.indexOf(e) < 0) { D.link(gE, a, b, { label: e.label, dashed: e.dashed }); return; }
      var off = 18 + (far.indexOf(e) % 3) * 18, d, lx, ly;
      if (lr) { var by = maxCross + 10 + off; d = 'M' + a.cx + ',' + (a.y + a.h) + ' C' + a.cx + ',' + by + ' ' + b.cx + ',' + by + ' ' + b.cx + ',' + (b.y + b.h); lx = (a.cx + b.cx) / 2; ly = by - 12; }
      else { var bx = maxCross + 10 + off; d = 'M' + (a.x + a.w) + ',' + a.cy + ' C' + bx + ',' + a.cy + ' ' + bx + ',' + b.cy + ' ' + (b.x + b.w) + ',' + b.cy; lx = bx - 14; ly = (a.cy + b.cy) / 2; }
      gE.appendChild(svg('path', { d: d, class: 'wm-edge wm-edge-arrow' + (e.dashed ? ' wm-edge-dash' : '') }));
      if (e.label) D.label(gE, lx, ly, e.label);
    });
    nodes.forEach(function (n) {
      var x = n.x, y = n.y, w = n.w, hh = n.h, cls = n.shape === 'round' && !out[n.id] ? 'wm-node-accent' : 'wm-node';
      if (n.shape === 'diamond') gN.appendChild(svg('polygon', { class: cls, points: [x + w / 2, y, x + w, y + hh / 2, x + w / 2, y + hh, x, y + hh / 2].join(' ') }));
      else gN.appendChild(svg('rect', { class: cls, x: x, y: y, width: w, height: hh, rx: n.shape === 'round' ? hh / 2 : 4 }));
      gN.appendChild(svg('text', { x: x + w / 2, y: y + hh / 2 + 4, 'text-anchor': 'middle', class: cls === 'wm-node-accent' ? 'wm-node-accent-text' : 'wm-node-text', text: n.id }));
    });
  }
});
