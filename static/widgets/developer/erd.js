/*
 * erd — entities with their fields and the relations between them.
 * data:   { "entities": [{ "name", "fields": [{ "name", "type"?, "pk"?, "fk"? }] }],
 *           "relations": [{ "from", "to", "label"?, "cardinality"?: "1-n" | "1-1" | "n-n" }] }
 * config: { "columns": 3 }
 */
WiMark.register('erd', {
  title: 'Entity-relationship diagram',
  description: 'Tables with keys and types, joined by labelled relations with cardinality.',
  example: {
    data: {
      entities: [
        { name: 'site', fields: [{ name: 'id', type: 'int', pk: true }, { name: 'title', type: 'text' }] },
        { name: 'section', fields: [{ name: 'id', type: 'text', pk: true }, { name: 'site_id', type: 'int', fk: true }, { name: 'max_depth', type: 'int' }] },
        { name: 'page', fields: [{ name: 'path', type: 'text', pk: true }, { name: 'section_id', type: 'text', fk: true }, { name: 'lang', type: 'text' }] }
      ],
      relations: [{ from: 'site', to: 'section', label: 'has', cardinality: '1-n' }, { from: 'section', to: 'page', label: 'holds', cardinality: '1-n' }]
    },
    config: { columns: 3 }
  },
  mount: function (el, data, config) {
    var W = WiMark, D = W.diagram;
    var ents = W.list(data.entities), cols = Math.max(1, W.num(config.columns, 3));
    var bw = Math.max(170, Math.max.apply(null, ents.map(function (e) {
      return Math.max.apply(null, W.list(e.fields).map(function (f) { return D.textWidth((f.pk ? '# ' : f.fk ? '→ ' : '') + f.name + '  ' + (f.type || ''), 12) + 30; }).concat([D.textWidth(e.name, 12) + 30]));
    }).concat([0])));
    var gx = 70, gy = 50;
    var heights = ents.map(function (e) { return 26 + 8 + W.list(e.fields).length * 18 + 8; });
    var rows = Math.ceil(ents.length / cols), rowH = [];
    for (var r = 0; r < rows; r++) rowH.push(Math.max.apply(null, heights.slice(r * cols, r * cols + cols)));
    var Wd = Math.min(cols, ents.length) * (bw + gx) - gx + 20, Hd = W.sum(rowH) + gy * (rows - 1) + 20;
    var c = W.chart(el, { width: Wd, height: Hd, margin: { top: 0, right: 0, bottom: 0, left: 0 }, label: 'entity-relationship diagram' });
    c.svg.style.maxWidth = Wd + 'px';
    var gE = c.add(W.svg('g')), gN = c.add(W.svg('g')), rect = {};
    ents.forEach(function (e, i) {
      var r2 = Math.floor(i / cols), y = 10 + W.sum(rowH.slice(0, r2)) + gy * r2;
      rect[e.name] = D.box(gN, 10 + (i % cols) * (bw + gx), y, bw, e.name, [W.list(e.fields).map(function (f) {
        return { text: (f.pk ? '# ' : f.fk ? '→ ' : '  ') + f.name, right: f.type || '' };
      })]);
    });
    W.list(data.relations).forEach(function (rel) {
      var a = rect[rel.from], b = rect[rel.to];
      if (!a || !b) return;
      var card = String(rel.cardinality || '1-n').split('-');
      D.link(gE, a, b, { label: rel.label, arrow: false, from: card[0], to: card[1] });
    });
  }
});
