/*
 * erd — database tables; "fk table" in a column draws the relation.
 *   ```wimark-erd
 *   {"users": ["id pk", "email unique"], "posts": ["id pk", "user_id fk users", "title"]}
 *   ```
 */
WiMark.register('erd', {
  title: 'Entity relationship',
  description: 'Tables as {"table": ["column type? pk|fk table|unique", …]}; foreign keys become relations, laid out in layers.',
  example: { body: { users: ['id pk', 'email text unique', 'created_at timestamp'], sites: ['id pk', 'owner_id fk users', 'name text'], pages: ['id pk', 'site_id fk sites', 'path text', 'lang text'], builds: ['id pk', 'site_id fk sites', 'started_at timestamp', 'ok bool'] } },
  mount: function (el, v) {
    var W = WiMark, D = W.diagram, svg = W.svg;
    var names = Object.keys(v).filter(function (k) { return Array.isArray(v[k]); }), edges = [];
    var T = names.map(function (n) {
      var rows = v[n].map(function (col) {
        var p = String(col).split(/\s+/), fk = p.indexOf('fk'), tags = [];
        if (p.indexOf('pk') >= 0) tags.push('PK');
        if (fk >= 0) { tags.push('FK'); edges.push({ from: n, to: p[fk + 1] }); }
        if (p.indexOf('unique') >= 0) tags.push('UQ');
        var type = p.filter(function (x, i) { return i > 0 && ['pk', 'fk', 'unique'].indexOf(x) < 0 && (fk < 0 || i !== fk + 1); }).join(' ');
        return { text: p[0] + (type ? ' ' + type : ''), right: tags.join(' ') };
      });
      return { id: n, rows: rows, w: Math.max(140, Math.max.apply(null, rows.map(function (r) { return D.textWidth(r.text + r.right, 12) + 40; }))) };
    });
    var L = D.layers(names, edges.map(function (e) { return { from: e.to, to: e.from }; })), byId = {};
    T.forEach(function (t) { byId[t.id] = t; t.h = 26 + 8 + t.rows.length * 18 + 4; });
    var x = 10, Hmax = 0;
    L.order.forEach(function (layer) {
      var y = 10, wmax = 0;
      layer.forEach(function (id) { var t = byId[id]; t.x = x; t.y = y; y += t.h + 30; wmax = Math.max(wmax, t.w); });
      Hmax = Math.max(Hmax, y);
      x += wmax + 70;
    });
    var c = W.chart(el, { width: x - 60, height: Hmax, margin: { top: 0, right: 0, bottom: 0, left: 0 }, label: 'entity relationship diagram' });
    c.svg.style.maxWidth = (x - 60) + 'px';
    var gE = c.add(svg('g')), gN = c.add(svg('g')), R = {};
    T.forEach(function (t) { R[t.id] = D.box(gN, t.x, t.y, t.w, t.id, [t.rows]); });
    edges.forEach(function (e) { if (R[e.from] && R[e.to]) D.link(gE, R[e.from], R[e.to], { from: 'N', to: '1' }); });
  }
});
