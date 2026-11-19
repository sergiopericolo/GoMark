/*
 * props — specification pairs: key, value and an optional note.
 *   ```wimark-props {"title": "Limits", "cols": 1}
 *   [["Max page size", "1 MB"], ["Max depth", "8", "per section"]]
 *   ```
 */
WiMark.register('props', {
  title: 'Properties',
  description: 'Specification-style key / value pairs with notes, in one or two columns.',
  example: { opts: { title: 'Parser limits' }, body: [['Max input', '16 MiB', 'larger files are refused'], ['Nesting depth', '256'], ['Encoding', 'UTF-8', 'BOM stripped'], ['Line endings', 'LF, CRLF'], ['Time', '$O(n)$ in the input size'], ['Thread safety', 'safe for concurrent use']] },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var dl = h('dl', 'wm-props');
    dl.style.setProperty('--cols', String(Math.max(1, W.num(v.cols, 1))));
    W.rows(v.items, ['key', 'value', 'note']).forEach(function (r) {
      dl.appendChild(h('div', 'wm-props-row', h('dt', null, W.inline(r.key)),
        h('dd', null, r.value === undefined ? '' : W.cell(r.value), r.note ? h('span', 'wm-props-note', W.inline(r.note)) : null)));
    });
    if (v.title) el.appendChild(h('div', 'wm-box-title', W.inline(v.title)));
    el.appendChild(dl);
  }
});
