/*
 * bitfield — the fields of a register or flags word over numbered bits.
 *   ```wimark-bitfield {"bits": 16, "lsb": "right"}
 *   [["EN", 1], ["MODE", 2], [null, 5], ["DATA", 8, "payload"]]
 *   ```
 *   Fields go from bit 0 up; null is reserved.
 */
WiMark.register('bitfield', {
  title: 'Bit field',
  description: 'Register or flag fields [name, width, note?] from bit 0 upwards over numbered bits; null is reserved.',
  example: { opts: { bits: 32, name: 'CTRL (0x4000_0000)' }, body: [['EN', 1, 'enable'], ['MODE', 2, '00 off · 01 run · 10 sleep'], ['IE', 1, 'interrupt enable'], [null, 4], ['DIV', 8, 'clock divider − 1'], ['COUNT', 16, 'reload value']] },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var fields = W.rows(v.items, ['name', 'width', 'note']), total = W.num(v.bits, W.sum(fields.map(function (f) { return f.width; }))), lane = Math.min(total, 16);
    var at = 0;
    fields.forEach(function (f) { f.lo = at; at += W.num(f.width, 1); f.hi = at - 1; });
    if (v.name) el.appendChild(h('div', 'wm-box-title', W.inline(v.name)));
    for (var top = total - 1; top >= 0; top -= lane) {
      var lo = Math.max(0, top - lane + 1), row = h('div', 'wm-bits-row');
      row.style.gridTemplateColumns = 'repeat(' + (top - lo + 1) + ', minmax(0, 1fr))';
      for (var b = top; b >= lo; b--) row.appendChild(h('span', 'wm-bits-n', String(b)));
      fields.forEach(function (f, i) {
        var a = Math.max(f.lo, lo), z = Math.min(f.hi, top);
        if (a > z) return;
        var cell = h('span', { class: 'wm-bits-field' + (f.name === null || f.name === undefined ? ' wm-bits-rsvd' : ' ' + W.series(i % 8)), 'data-tip': (f.name || 'reserved') + ' [' + f.hi + (f.hi !== f.lo ? ':' + f.lo : '') + ']' + (f.note ? ' — ' + f.note : '') }, f.name || '');
        cell.style.gridColumn = (top - z + 1) + ' / span ' + (z - a + 1);
        cell.style.gridRow = '2';
        row.appendChild(cell);
      });
      el.appendChild(row);
    }
    var named = fields.filter(function (f) { return f.name; });
    el.appendChild(W.table(['bits', 'field', ''], named.map(function (f) { return [f.hi === f.lo ? String(f.lo) : f.hi + ':' + f.lo, h('code', null, f.name), W.inline(f.note || '')]; }), { align: ['right', 'left', 'left'] }));
  }
});
