/*
 * classdiagram — UML-style classes with fields and methods, and their relations.
 * data:   { "classes": [{ "name", "kind"?: "interface" | "abstract", "fields"?: [], "methods"?: [] }],
 *           "relations": [{ "from", "to", "type": "extends" | "implements" | "uses" | "has", "label"? }] }
 * config: { "columns": 3 }
 */
WiMark.register('classdiagram', {
  title: 'Class diagram',
  description: 'Classes with fields and methods; extends, implements, uses and has relations.',
  example: {
    data: {
      classes: [
        { name: 'Renderer', kind: 'interface', methods: ['Render(page) []byte'] },
        { name: 'Site', fields: ['Dir string', 'Config *Config'], methods: ['Build(lang, out)', 'Render(lang, path)'] },
        { name: 'Config', fields: ['Site Meta', 'Sections []Section'], methods: ['normalize()', 'validate() error'] }
      ],
      relations: [{ from: 'Site', to: 'Renderer', type: 'implements' }, { from: 'Site', to: 'Config', type: 'has', label: '1' }]
    },
    config: { columns: 3 }
  },
  mount: function (el, data, config) {
    var W = WiMark, D = W.diagram;
    var cls = W.list(data.classes), cols = Math.max(1, W.num(config.columns, 3));
    var bw = Math.max(180, Math.max.apply(null, cls.map(function (k) {
      return Math.max.apply(null, W.list(k.fields).concat(W.list(k.methods), [k.name + '  «interface»']).map(function (s) { return D.textWidth(s, 12) + 30; }));
    }).concat([0])));
    var hs = cls.map(function (k) { return 26 + (W.list(k.fields).length ? 8 + W.list(k.fields).length * 18 : 0) + (W.list(k.methods).length ? 8 + W.list(k.methods).length * 18 : 0) + 8; });
    var rows = Math.ceil(cls.length / cols), rowH = [];
    for (var r = 0; r < rows; r++) rowH.push(Math.max.apply(null, hs.slice(r * cols, r * cols + cols)));
    var gx = 70, gy = 54, Wd = Math.min(cols, cls.length) * (bw + gx) - gx + 20, Hd = W.sum(rowH) + gy * (rows - 1) + 20;
    var c = W.chart(el, { width: Wd, height: Hd, margin: { top: 0, right: 0, bottom: 0, left: 0 }, label: 'class diagram' });
    c.svg.style.maxWidth = Wd + 'px';
    var gE = c.add(W.svg('g')), gN = c.add(W.svg('g')), rect = {};
    cls.forEach(function (k, i) {
      var r2 = Math.floor(i / cols), y = 10 + W.sum(rowH.slice(0, r2)) + gy * r2;
      var title = k.kind ? '«' + k.kind + '» ' + k.name : k.name;
      rect[k.name] = D.box(gN, 10 + (i % cols) * (bw + gx), y, bw, title, [W.list(k.fields), W.list(k.methods)]);
    });
    W.list(data.relations).forEach(function (rel) {
      var a = rect[rel.from], b = rect[rel.to];
      if (!a || !b) return;
      var t = rel.type || 'uses';
      D.link(gE, a, b, { label: rel.label || t, dashed: t === 'implements' || t === 'uses', arrow: true, cls: 'wm-rel-' + t });
    });
  }
});
