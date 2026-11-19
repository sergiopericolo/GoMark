/*
 * sequence — a sequence diagram from lines "A -> B: message".
 *   ```wimark-sequence
 *   Client -> API: POST /login
 *   API -> DB: SELECT user
 *   DB --> API: row
 *   API --> Client: 200 + token
 *   note API: checks the hash
 *   ```
 *   -> call · --> reply (dashed) · A -> A self call · "note X: text"
 */
WiMark.register('sequence', {
  title: 'Sequence diagram',
  description: 'Lines "A -> B: text" (--> for replies, A -> A for self calls, "note A: …") as lifelines with numbered messages.',
  input: 'text',
  example: { body: 'Author -> gomark: ai translate page.md -lang it\ngomark -> gomark: check paths and size\ngomark -> Provider: prompt + document\nProvider --> gomark: translation\nnote gomark: same headings, code, links?\ngomark --> Author: proposal + diff' },
  mount: function (el, v) {
    var W = WiMark, D = W.diagram, svg = W.svg;
    var actors = [], msgs = [];
    var add = function (a) { if (actors.indexOf(a) < 0) actors.push(a); };
    W.lines(v.text).forEach(function (ln) {
      var n = /^\s*note\s+([^:]+):\s*(.*)$/i.exec(ln);
      if (n) { add(n[1].trim()); msgs.push({ note: true, from: n[1].trim(), text: n[2] }); return; }
      var m = /^\s*(.+?)\s*(-->|->)\s*(.+?)\s*:\s*(.*)$/.exec(ln);
      if (!m) { var p = /^\s*participant\s+(.+)$/i.exec(ln); if (p) add(p[1].trim()); return; }
      add(m[1]); add(m[3]);
      msgs.push({ from: m[1], to: m[3], reply: m[2] === '-->', text: m[4] });
    });
    var colW = Math.max(150, Math.max.apply(null, msgs.map(function (m) { return D.textWidth(m.text, 11) + 50; }).concat([0])));
    var Wd = colW * actors.length, top = 46, row = 40, Hd = top + 20 + msgs.length * row + 46;
    var c = W.chart(el, { width: Wd, height: Hd, margin: { top: 0, right: 0, bottom: 0, left: 0 }, label: 'sequence diagram' });
    c.svg.style.maxWidth = Wd + 'px';
    var x = function (a) { return colW / 2 + actors.indexOf(a) * colW; };
    actors.forEach(function (a) {
      var w = Math.max(80, D.textWidth(a, 12) + 24);
      c.add(svg('line', { x1: x(a), x2: x(a), y1: top, y2: Hd - 40, class: 'wm-guide' }));
      [6, Hd - 38].forEach(function (y) {
        c.add(svg('rect', { x: x(a) - w / 2, y: y, width: w, height: 32, rx: 4, class: 'wm-node' }));
        c.add(svg('text', { x: x(a), y: y + 20, 'text-anchor': 'middle', class: 'wm-node-text', text: a }));
      });
    });
    var k = 0;
    msgs.forEach(function (m, i) {
      var y = top + 30 + i * row, x1 = x(m.from), x2 = x(m.to);
      if (m.note) {
        var w = D.textWidth(m.text, 11) + 16;
        c.add(svg('rect', { x: x1 + 8, y: y - 13, width: w, height: 22, rx: 3, class: 'wm-note-box' }));
        c.add(svg('text', { x: x1 + 16, y: y + 2, class: 'wm-edge-text', text: m.text }));
        return;
      }
      k++;
      var txt = (v.numbers !== false ? k + '. ' : '') + m.text;
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
