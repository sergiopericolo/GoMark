/*
 * progress — labelled progress bars.
 * data:   [{ "label", "value", "max"?: 100, "note"?, "state"? }]
 * config: { "format": "percent" | "value" | "both" }
 */
WiMark.register('progress', {
  title: 'Progress bars',
  description: 'Labelled bars showing value against a maximum.',
  example: {
    data: [
      { label: 'Translation (it)', value: 42, max: 60, note: 'pages' },
      { label: 'Widgets', value: 100, max: 100, state: 'ok' },
      { label: 'Tests', value: 18, max: 40, state: 'warning' }
    ],
    config: { format: 'both' }
  },
  choices: { format: ['percent', 'value', 'both'] },
  mount: function (el, data, config) {
    var W = WiMark, h = W.h;
    var ul = h('ul', 'wm-progress');
    W.list(data).forEach(function (p) {
      var max = W.num(p.max, 100) || 100, v = W.num(p.value);
      var pct = Math.max(0, Math.min(100, (100 * v) / max));
      var txt = config.format === 'value' ? W.fmt(v) + ' / ' + W.fmt(max)
        : config.format === 'both' ? Math.round(pct) + '% · ' + W.fmt(v) + ' / ' + W.fmt(max) : Math.round(pct) + '%';
      ul.appendChild(h('li', 'wm-progress-item' + (p.state ? ' wm-' + W.state(p.state) : ''),
        h('div', 'wm-progress-head', h('span', null, W.inline(p.label || '')),
          h('span', 'wm-right', p.state ? h('span', { 'aria-hidden': 'true' }, W.icon(p.state) + ' ') : null, txt, p.note ? ' ' + p.note : '')),
        h('div', { class: 'wm-progress-track', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': max, 'aria-valuenow': v },
          h('div', { class: 'wm-progress-fill', style: { width: pct + '%' } }))));
    });
    el.appendChild(ul);
  }
});
