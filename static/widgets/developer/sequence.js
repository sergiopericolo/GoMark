/*
 * sequence — a sequence diagram: actors, lifelines and ordered messages.
 * data:   { "actors": ["A", "B"], "messages": [{ "from", "to", "text", "reply"?, "note"? }] }
 * config: { "numbered": true }
 */
WiMark.register('sequence', {
  title: 'Sequence diagram',
  description: 'Actors with lifelines and numbered messages, replies dashed, self-calls looped.',
  example: {
    data: {
      actors: ['Author', 'gomark', 'AI provider'],
      messages: [
        { from: 'Author', to: 'gomark', text: 'ai translate notes/x.md -lang it' },
        { from: 'gomark', to: 'gomark', text: 'check paths, size' },
        { from: 'gomark', to: 'AI provider', text: 'prompt + document' },
        { from: 'AI provider', to: 'gomark', text: 'translation', reply: true },
        { from: 'gomark', to: 'gomark', text: 'validate output' },
        { from: 'gomark', to: 'Author', text: 'proposal + diff', reply: true }
      ]
    },
    config: { numbered: true }
  },
  mount: function (el, data, config) {
    var W = WiMark, D = W.diagram, svg = W.svg;
    var actors = W.list(data.actors), msgs = W.list(data.messages);
    var colW = Math.max(150, Math.max.apply(null, msgs.map(function (m) { return D.textWidth(m.text, 11) + 40; }).concat([0])));
    var Wd = colW * actors.length, top = 46, row = 40, Hd = top + 20 + msgs.length * row + 46;
    var c = W.chart(el, { width: Wd, height: Hd, margin: { top: 0, right: 0, bottom: 0, left: 0 }, label: 'sequence diagram' });
    var x = function (a) { return colW / 2 + actors.indexOf(a) * colW; };
    actors.forEach(function (a) {
      var w = Math.max(80, D.textWidth(a, 12) + 24);
      c.add(svg('line', { x1: x(a), x2: x(a), y1: top, y2: Hd - 40, class: 'wm-guide' }));
      [6, Hd - 38].forEach(function (y) {
        c.add(svg('rect', { x: x(a) - w / 2, y: y, width: w, height: 32, rx: 4, class: 'wm-node' }));
        c.add(svg('text', { x: x(a), y: y + 20, 'text-anchor': 'middle', class: 'wm-node-text', text: a }));
      });
    });
    msgs.forEach(function (m, i) {
      var y = top + 30 + i * row, x1 = x(m.from), x2 = x(m.to);
      var txt = (config.numbered !== false ? (i + 1) + '. ' : '') + (m.text || '');
      if (m.from === m.to) {
        c.add(svg('path', { d: 'M' + x1 + ',' + (y - 6) + ' h34 v16 h-30', class: 'wm-edge wm-edge-arrow' }));
        c.add(svg('text', { x: x1 + 40, y: y + 4, class: 'wm-edge-text', text: txt }));
        return;
      }
      c.add(svg('line', { x1: x1, x2: x2 + (x2 > x1 ? -2 : 2), y1: y, y2: y, class: 'wm-edge wm-edge-arrow' + (m.reply ? ' wm-edge-dash' : '') }));
      c.add(svg('text', { x: (x1 + x2) / 2, y: y - 7, 'text-anchor': 'middle', class: 'wm-edge-text', text: txt }));
    });
  }
});
