/*
 * classdiagram — classes with members; "Child < Parent" extends, "Type : Iface" implements.
 *   ```wimark-classdiagram
 *   {"Shape": ["+area(): float"], "Circle < Shape": ["-r: float", "+area(): float"]}
 *   ```
 */
WiMark.register('classdiagram', {
  title: 'Class diagram',
  description: 'Classes as {"Name < Parent : Interface": ["+field: type", "+method()"]}; fields and methods split, relations drawn.',
  example: { body: { '«interface» Renderer': ['+Render(w, page) error'], 'HTML : Renderer': ['-tmpl: *Template', '+Render(w, page) error'], 'Page': ['+Title: string', '+Body: HTML', '+Widgets: []string'], 'Catalog < HTML': ['-widgets: []Widget', '+Render(w, page) error'] } },
  mount: function (el, v) {
    var W = WiMark, D = W.diagram, svg = W.svg;
    var C = [], edges = [];
    Object.keys(v).filter(function (k) { return Array.isArray(v[k]); }).forEach(function (key) {
      var m = /^(.+?)(?:\s*<\s*([^:]+?))?(?:\s*:\s*(.+))?$/.exec(key), name = m[1].trim(), members = v[key].map(String);
      if (m[2]) edges.push({ from: name, to: m[2].trim(), kind: 'extends' });
      if (m[3]) m[3].split(',').forEach(function (i) { edges.push({ from: name, to: i.trim(), kind: 'implements' }); });
      var fields = members.filter(function (s) { return s.indexOf('(') < 0; }), methods = members.filter(function (s) { return s.indexOf('(') >= 0; });
      C.push({ id: name, secs: [fields, methods], w: Math.max(150, Math.max.apply(null, members.concat([name]).map(function (s) { return D.textWidth(s, 12) + 24; }))) });
    });
    var ids = C.map(function (c) { return c.id; }), byId = {};
    var known = edges.filter(function (e) { return ids.indexOf(e.to) >= 0 || ids.some(function (i) { return i.replace(/«[^»]+»\s*/, '') === e.to; }); });
    known.forEach(function (e) { e.to = ids.filter(function (i) { return i === e.to || i.replace(/«[^»]+»\s*/, '') === e.to; })[0]; });
    var L = D.layers(ids, known.map(function (e) { return { from: e.to, to: e.from }; }));
    C.forEach(function (c) { byId[c.id] = c; c.h = 26 + c.secs.filter(function (s) { return s.length; }).reduce(function (a, s) { return a + 8 + s.length * 18; }, 0); });
    var y = 10, Wmax = 0;
    L.order.forEach(function (layer) {
      var x = 10, hmax = 0;
      layer.forEach(function (id) { var c = byId[id]; c.x = x; c.y = y; x += c.w + 40; hmax = Math.max(hmax, c.h); });
      Wmax = Math.max(Wmax, x);
      y += hmax + 60;
    });
    var c2 = W.chart(el, { width: Wmax - 30, height: y - 50, margin: { top: 0, right: 0, bottom: 0, left: 0 }, label: 'class diagram' });
    c2.svg.style.maxWidth = (Wmax - 30) + 'px';
    var gE = c2.add(svg('g')), gN = c2.add(svg('g')), R = {};
    C.forEach(function (c) { R[c.id] = D.box(gN, c.x, c.y, c.w, c.id, c.secs); });
    known.forEach(function (e) { D.link(gE, R[e.from], R[e.to], { dashed: e.kind === 'implements', cls: 'wm-edge-inherit', label: e.kind === 'implements' ? 'implements' : null }); });
  }
});
