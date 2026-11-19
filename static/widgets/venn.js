/*
 * venn — two or three sets with what lies in each region.
 *   ```wimark-venn {"sets": ["Even", "Prime"]}
 *   {"A": "4, 6, 8", "AB": "2", "B": "3, 5, 7", "out": "1, 9"}
 *   ```
 *   Region keys use A, B, C for the first, second and third set.
 */
WiMark.register('venn', {
  title: 'Venn diagram',
  description: 'Two or three sets as circles; region keys A, B, AB, ABC… hold the elements, "out" the rest.',
  example: { opts: { sets: ['Even', 'Prime', 'Square'], universe: '\\{1, \\dots, 10\\}' }, body: { A: '6, 8, 10', B: '3, 5, 7', C: '9', AB: '2', AC: '4', BC: '', ABC: '', out: '1' } },
  mount: function (el, v) {
    var W = WiMark, svg = W.svg;
    var sets = W.list(v.sets).slice(0, 3), n = Math.max(2, sets.length);
    var Wd = 480, Hd = n === 3 ? 380 : 280, R = n === 3 ? 105 : 110;
    var c = W.chart(el, { width: Wd, height: Hd, margin: { top: 0, right: 0, bottom: 0, left: 0 }, label: 'Venn diagram of ' + sets.join(', ') });
    c.svg.style.maxWidth = Wd + 'px';
    var C = n === 3 ? [[180, 140], [300, 140], [240, 240]] : [[175, 140], [305, 140]];
    c.add(svg('rect', { x: 4, y: 4, width: Wd - 8, height: Hd - 8, rx: 8, class: 'wm-outline' }));
    if (v.universe) c.add(svg('text', { x: 16, y: 24, class: 'wm-value', text: 'U' }));
    C.slice(0, n).forEach(function (p, i) {
      c.add(svg('circle', { cx: p[0], cy: p[1], r: R, class: 'wm-venn ' + W.series(i) }));
      var lx = n === 3 ? [70, 410, 240][i] : [70, 410][i], ly = n === 3 ? [60, 60, 368][i] : 40;
      c.add(svg('text', { x: lx, y: ly, 'text-anchor': 'middle', class: 'wm-title', text: sets[i] || String.fromCharCode(65 + i) }));
    });
    var pos = n === 3
      ? { A: [140, 110], B: [340, 110], C: [240, 300], AB: [240, 100], AC: [185, 215], BC: [295, 215], ABC: [240, 175], out: [60, Hd - 24] }
      : { A: [120, 140], B: [360, 140], AB: [240, 140], out: [60, Hd - 24] };
    var regions = v.regions || v;
    Object.keys(pos).forEach(function (k) {
      var txt = regions[k];
      if (txt === undefined || txt === '') return;
      var lines = String(txt).length > 14 ? String(txt).match(/.{1,14}(\s|,|$)/g) : [String(txt)];
      lines.forEach(function (ln, li) {
        c.add(svg('text', { x: pos[k][0], y: pos[k][1] + (li - (lines.length - 1) / 2) * 14 + 4, 'text-anchor': k === 'out' ? 'start' : 'middle', class: 'wm-node-text', text: ln.trim() }));
      });
    });
    if (v.universe) el.appendChild(W.h('p', 'wm-muted wm-small', W.inline('$U = ' + v.universe + '$')));
  }
});
