/*
 * statemachine — states and transitions from lines "A -> B: event".
 *   ```wimark-statemachine
 *   [*] -> idle
 *   idle -> running: start
 *   running -> idle: stop
 *   running -> [*]: crash
 *   ```
 *   [*] -> X marks the initial state, X -> [*] a final one.
 */
WiMark.register('statemachine', {
  title: 'State machine',
  description: 'Lines "A -> B: event" as states on a circle with curved transitions; [*] marks initial and final states.',
  input: 'text',
  example: { body: '[*] -> draft\ndraft -> proposed: ai run\nproposed -> checked: guards ok\nproposed -> rejected: guard fails\nchecked -> checked: show\nchecked -> applied: apply\nchecked -> rejected: discard\napplied -> [*]\nrejected -> [*]' },
  mount: function (el, v) {
    var W = WiMark, D = W.diagram, svg = W.svg;
    var ids = [], init = {}, fin = {}, T = [];
    W.lines(v.text).forEach(function (ln) {
      var m = /^\s*(.+?)\s*->\s*(.+?)\s*(?::\s*(.*))?$/.exec(ln);
      if (!m) return;
      if (m[1] === '[*]') { init[m[2]] = 1; if (ids.indexOf(m[2]) < 0) ids.push(m[2]); return; }
      if (m[2] === '[*]') { fin[m[1]] = 1; if (ids.indexOf(m[1]) < 0) ids.push(m[1]); return; }
      [m[1], m[2]].forEach(function (s) { if (ids.indexOf(s) < 0) ids.push(s); });
      T.push({ from: m[1], to: m[2], label: m[3] || '' });
    });
    var size = Math.max(280, W.num(v.size, 420)), R = size / 2 - 70, cx = size / 2 + 40, cy = size / 2, r = 30, P = {};
    ids.forEach(function (s, i) { var a = -Math.PI / 2 + (2 * Math.PI * i) / Math.max(1, ids.length); P[s] = { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) }; });
    var c = W.chart(el, { width: size + 80, height: size, margin: { top: 0, right: 0, bottom: 0, left: 0 }, label: 'state machine' });
    c.svg.style.maxWidth = (size + 80) + 'px';
    var gE = c.add(svg('g')), gN = c.add(svg('g')), gL = c.add(svg('g'));
    T.forEach(function (t) {
      var a = P[t.from], b = P[t.to];
      if (a === b) {
        var ox = (a.x - cx) / R, oy = (a.y - cy) / R, lx = a.x + ox * (r + 24), ly = a.y + oy * (r + 24);
        gE.appendChild(svg('circle', { cx: lx, cy: ly, r: 16, class: 'wm-edge' }));
        if (t.label) D.label(gL, lx + ox * 32, ly + oy * 28, t.label);
        return;
      }
      var dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len, mx = (a.x + b.x) / 2 - uy * 28, my = (a.y + b.y) / 2 + ux * 28;
      var sx = a.x + ux * r, sy = a.y + uy * r, ex = b.x - ux * (r + 2), ey = b.y - uy * (r + 2);
      gE.appendChild(svg('path', { d: 'M' + sx + ',' + sy + ' Q' + mx + ',' + my + ' ' + ex + ',' + ey, class: 'wm-edge wm-edge-arrow' }));
      if (t.label) D.label(gL, (sx + 2 * mx + ex) / 4, (sy + 2 * my + ey) / 4, t.label);
    });
    ids.forEach(function (s) {
      var p = P[s];
      if (init[s]) {
        gE.appendChild(svg('circle', { cx: p.x - r - 34, cy: p.y, r: 6, class: 'wm-ink' }));
        gE.appendChild(svg('line', { x1: p.x - r - 28, y1: p.y, x2: p.x - r - 2, y2: p.y, class: 'wm-edge wm-edge-arrow' }));
      }
      gN.appendChild(svg('circle', { cx: p.x, cy: p.y, r: r, class: fin[s] ? 'wm-node-accent' : 'wm-node' }));
      if (fin[s]) gN.appendChild(svg('circle', { cx: p.x, cy: p.y, r: r - 4, class: 'wm-stroke-on-accent' }));
      gN.appendChild(svg('text', { x: p.x, y: p.y + 4, 'text-anchor': 'middle', class: fin[s] ? 'wm-node-accent-text' : 'wm-node-text', text: s }));
    });
  }
});
