/*
 * palette — the tokens of the active theme: series, states, sequential ramp, interface.
 * data:   {}
 * config: { "groups": ["series", "states", "heat", "ui"] }
 */
WiMark.register('palette', {
  title: 'Theme palette',
  description: 'Shows the active theme’s tokens (what every WiMark reads); switch theme to compare classes.',
  example: { data: {}, config: { groups: ['series', 'states', 'heat', 'ui'] } },
  mount: function (el, data, config) {
    var W = WiMark, h = W.h;
    var groups = W.list(config.groups).length ? W.list(config.groups) : ['series', 'states', 'heat', 'ui'];
    var defs = {
      series: [1, 2, 3, 4, 5, 6, 7, 8].map(function (i) { return { label: 'wm-' + i, cls: 'wm-s' + i, token: 'wm-' + i }; }),
      states: ['pos', 'neg', 'warn', 'info'].map(function (s) { return { label: 'wm-' + s, cls: 'wm-' + s, token: 'wm-' + s, icon: W.icon(s) }; }),
      heat: [0, 1, 2, 3, 4].map(function (i) { return { label: 'wm-heat-' + i, cls: 'wm-h' + i, token: 'wm-heat-' + i }; }),
      ui: ['bg', 'surface', 'ink', 'text', 'gray', 'line', 'wm-accent', 'code-bg'].map(function (t) { return { label: t, cls: 'wm-ui-' + t, token: t }; })
    };
    groups.forEach(function (g) {
      if (!defs[g]) return;
      el.appendChild(h('div', 'wm-label wm-api-label', g));
      el.appendChild(h('div', 'wm-palette', defs[g].map(function (d) {
        return h('div', 'wm-palette-chip', h('span', 'wm-palette-swatch ' + d.cls, d.icon ? h('span', 'wm-palette-icon', d.icon) : null),
          h('code', null, '--' + d.label), h('span', 'wm-muted wm-small', W.token(d.token) || '—'));
      })));
    });
    var cls = document.body.dataset.themeClass;
    if (cls) el.appendChild(h('p', 'wm-muted wm-small', 'theme class: ' + cls));
  }
});
