/*
 * palette — the active theme's tokens, the only colors a WiMark may use.
 *   ```wimark-palette
 *   ```
 */
WiMark.register('palette', {
  title: 'Theme palette',
  description: 'The tokens of the active theme (series, states, heat steps, surfaces) read live: switch theme to compare.',
  example: {},
  mount: function (el) {
    var W = WiMark, h = W.h;
    var groups = [
      ['series', [1, 2, 3, 4, 5, 6, 7, 8].map(function (i) { return ['wm-' + i, 'wm-s' + i]; })],
      ['states', [['wm-pos', 'wm-pos'], ['wm-warn', 'wm-warn'], ['wm-neg', 'wm-neg'], ['wm-info', 'wm-info']]],
      ['heat', [0, 1, 2, 3, 4].map(function (i) { return ['wm-heat-' + i, 'wm-h' + i]; })],
      ['surfaces', [['bg', 'wm-tok-bg'], ['surface', 'wm-tok-surface'], ['ink', 'wm-tok-ink'], ['gray', 'wm-tok-gray'], ['line', 'wm-tok-line'], ['wm-accent', 'wm-tok-accent']]]
    ];
    groups.forEach(function (g) {
      el.appendChild(h('div', 'wm-label', g[0]));
      el.appendChild(h('div', 'wm-palette', g[1].map(function (t) {
        return h('div', 'wm-palette-chip', h('span', 'wm-palette-swatch ' + t[1]), h('code', null, '--' + t[0]), h('span', 'wm-muted wm-small', W.token(t[0])));
      })));
    });
  }
});
