/*
 * statemachine — states on a circle and the transitions between them.
 * data:   { "states": [{ "id", "label"?, "initial"?, "final"? }], "transitions": [{ "from", "to", "label"? }] }
 * config: { "size": 420 }
 */
WiMark.register('statemachine', {
  title: 'State machine',
  description: 'States on a circle with curved, labelled transitions, initial and final states, self loops.',
  example: {
    data: {
      states: [{ id: 'draft', initial: true }, { id: 'proposed' }, { id: 'checked' }, { id: 'applied', final: true }, { id: 'rejected', final: true }],
      transitions: [
        { from: 'draft', to: 'proposed', label: 'ai run' }, { from: 'proposed', to: 'checked', label: 'guards ok' },
        { from: 'proposed', to: 'rejected', label: 'guard fails' }, { from: 'checked', to: 'applied', label: 'apply' },
        { from: 'checked', to: 'rejected', label: 'discard' }, { from: 'checked', to: 'checked', label: 'show' }
      ]
    },
    config: { size: 440 }
  },
  mount: function (el, data, config) {
    var W = WiMark, D = W.diagram, svg = W.svg;
    var states = W.list(data.states), size = Math.max(260, W.num(config.size, 440));
    var R = size / 2 - 70, cx = size / 2 + 40, cy = size / 2, r = 30, pos = {};
    states.forEach(function (s, i) {
      var a = -Math.PI / 2 + (2 * Math.PI * i) / Math.max(1, states.length);
      pos[s.id] = { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a), s: s };
    });
    var c = W.chart(el, { width: size + 80, height: size, margin: { top: 0, right: 0, bottom: 0, left: 0 }, label: 'state machine' });
    c.svg.style.maxWidth = (size + 80) + 'px';
    var gE = c.add(svg('g')), gN = c.add(svg('g')), gL = c.add(svg('g'));
    W.list(data.transitions).forEach(function (t) {
      var a = pos[t.from], b = pos[t.to];
      if (!a || !b) return;
      if (a === b) {
        var ox = (a.x - cx) / R, oy = (a.y - cy) / R;
        var lx = a.x + ox * (r + 26), ly = a.y + oy * (r + 26);
        gE.appendChild(svg('circle', { cx: lx, cy: ly, r: 18, class: 'wm-edge' }));
        if (t.label) D.label(gL, lx + ox * 34, ly + oy * 30, t.label);
        return;
      }
      var dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
      var bend = 28, mx = (a.x + b.x) / 2 - uy * bend, my = (a.y + b.y) / 2 + ux * bend;
      var sx = a.x + ux * r, sy = a.y + uy * r, ex = b.x - ux * (r + 2), ey = b.y - uy * (r + 2);
      gE.appendChild(svg('path', { d: 'M' + sx + ',' + sy + ' Q' + mx + ',' + my + ' ' + ex + ',' + ey, class: 'wm-edge wm-edge-arrow' }));
      if (t.label) D.label(gL, (sx + 2 * mx + ex) / 4, (sy + 2 * my + ey) / 4, t.label);
    });
    states.forEach(function (s) {
      var p = pos[s.id];
      if (s.initial) {
        gE.appendChild(svg('circle', { cx: p.x - r - 34, cy: p.y, r: 6, class: 'wm-ink' }));
        gE.appendChild(svg('line', { x1: p.x - r - 28, y1: p.y, x2: p.x - r - 2, y2: p.y, class: 'wm-edge wm-edge-arrow' }));
      }
      gN.appendChild(svg('circle', { cx: p.x, cy: p.y, r: r, class: s.final ? 'wm-node-accent' : 'wm-node' }));
      if (s.final) gN.appendChild(svg('circle', { cx: p.x, cy: p.y, r: r - 4, class: 'wm-stroke-on-accent' }));
      gN.appendChild(svg('text', { x: p.x, y: p.y + 4, 'text-anchor': 'middle', class: s.final ? 'wm-node-accent-text' : 'wm-node-text', text: s.label || s.id }));
    });
  }
});
