/*
 * gauge — one value on a half dial between min and max, with state bands.
 * data:   { "value", "min"?: 0, "max"?: 100, "label"?, "unit"?, "bands"?: [{ "to", "state" }] }
 * config: {}
 */
WiMark.register('gauge', {
  title: 'Gauge',
  description: 'One value on a half dial, with optional state bands (icon + label for the current one).',
  example: {
    data: { value: 72, min: 0, max: 100, label: 'build health', unit: '%', bands: [{ to: 50, state: 'bad' }, { to: 80, state: 'warning' }, { to: 100, state: 'good' }] },
    config: {}
  },
  mount: function (el, data, config) {
    var W = WiMark, svg = W.svg, h = W.h;
    var min = W.num(data.min, 0), max = W.num(data.max, 100), v = Math.max(min, Math.min(max, W.num(data.value)));
    var c = W.chart(el, { width: 320, height: 220, margin: { top: 10, right: 10, bottom: 10, left: 10 }, label: data.label || 'gauge' });
    c.svg.style.maxWidth = '320px';
    var cx = c.w / 2, cy = c.h - 48, R = Math.min(cx, cy) - 4, r = R - 22;
    var ang = function (x) { return Math.PI + (Math.PI * (x - min)) / (max - min || 1); };
    var arc = function (a0, a1, cls, tip) {
      var p = function (rad, a) { return (cx + rad * Math.cos(a)) + ',' + (cy + rad * Math.sin(a)); };
      c.add(svg('path', { d: 'M' + p(R, a0) + ' A' + R + ',' + R + ' 0 0 1 ' + p(R, a1) + ' L' + p(r, a1) + ' A' + r + ',' + r + ' 0 0 0 ' + p(r, a0) + ' Z', class: cls, 'data-tip': tip || null }));
    };
    var bands = W.list(data.bands), from = min, current = null;
    if (bands.length) bands.forEach(function (b) {
      var to = W.num(b.to, max);
      arc(ang(from), ang(to), 'wm-cell wm-band wm-' + W.state(b.state), b.state + ' ' + W.fmt(from) + '–' + W.fmt(to));
      if (v >= from && v <= to && !current) current = b.state;
      from = to;
    });
    else arc(ang(min), ang(max), 'wm-outline');
    arc(ang(min), ang(v), 'wm-mark wm-s1 wm-gauge-fill');
    var a = ang(v);
    c.add(svg('line', { x1: cx, y1: cy, x2: cx + (R + 4) * Math.cos(a), y2: cy + (R + 4) * Math.sin(a), class: 'wm-needle' }));
    c.add(svg('circle', { cx: cx, cy: cy, r: 6, class: 'wm-ink' }));
    c.add(svg('text', { x: cx, y: cy + 38, 'text-anchor': 'middle', class: 'wm-gauge-value', text: W.fmt(v) + (data.unit || '') }));
    c.add(svg('text', { x: cx - R + 11, y: cy + 16, 'text-anchor': 'middle', text: W.fmt(min) }));
    c.add(svg('text', { x: cx + R - 11, y: cy + 16, 'text-anchor': 'middle', text: W.fmt(max) }));
    if (data.label || current) {
      el.appendChild(h('div', 'wm-gauge-label', current ? h('span', 'wm-' + W.state(current), h('span', { class: 'wm-icon', 'aria-hidden': 'true' }, h('span', null, W.icon(current)))) : null,
        h('strong', null, data.label || ''), current ? h('span', 'wm-muted', ' · ' + current) : null));
    }
  }
});
