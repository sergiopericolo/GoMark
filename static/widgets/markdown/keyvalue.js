/*
 * keyvalue — a definition table of keys and values, in one or two columns.
 * data:   { "key": "value", … } or [{ "key", "value", "note"? }]
 * config: { "columns": 1, "caption"? }
 */
WiMark.register('keyvalue', {
  title: 'Key / value',
  description: 'Specification-style pairs in one or two columns, with notes.',
  example: {
    data: [
      { key: 'Binary', value: '`gomark`', note: 'one file' },
      { key: 'Go', value: '1.24+' },
      { key: 'Dependencies', value: 'goldmark, toml' },
      { key: 'Output', value: 'static HTML' },
      { key: 'Themes', value: 7 },
      { key: 'WiMarks', value: 100 }
    ],
    config: { columns: 2, caption: 'Specs' }
  },
  mount: function (el, data, config) {
    var W = WiMark, h = W.h;
    var pairs = Array.isArray(data) ? data : W.list(data);
    var dl = h('dl', { class: 'wm-kv', style: { '--cols': String(Math.max(1, W.num(config.columns, 1))) } });
    pairs.forEach(function (p) {
      dl.appendChild(h('div', 'wm-kv-pair', h('dt', null, W.inline(p.key)), h('dd', null, W.cell(p.value), p.note ? h('span', 'wm-muted wm-small', ' · ' + p.note) : null)));
    });
    if (config.caption) el.appendChild(h('div', 'wm-label', config.caption));
    el.appendChild(dl);
  }
});
