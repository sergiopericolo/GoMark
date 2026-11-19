/*
 * packet — a protocol header in rows of 32 bits, RFC style.
 *   ```wimark-packet {"width": 32}
 *   [["Source port", 16], ["Destination port", 16], ["Sequence number", 32]]
 *   ```
 */
WiMark.register('packet', {
  title: 'Packet header',
  description: 'A protocol header [field, bits] drawn in rows of 32 bits with offsets, like the diagrams of RFCs.',
  example: { opts: { title: 'UDP header (RFC 768)' }, body: [['Source port', 16], ['Destination port', 16], ['Length', 16], ['Checksum', 16], ['Data …', 32]] },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var width = W.num(v.width, 32), fields = W.rows(v.items, ['name', 'bits']);
    if (v.title) el.appendChild(h('div', 'wm-box-title', W.inline(v.title)));
    var grid = h('div', 'wm-packet');
    grid.style.gridTemplateColumns = '4em repeat(' + width + ', minmax(0, 1fr))';
    grid.appendChild(h('span', 'wm-packet-off', 'offset'));
    for (var b = 0; b < width; b++) grid.appendChild(h('span', 'wm-bits-n', b % 8 === 0 || b === width - 1 ? String(b) : ''));
    var at = 0;
    fields.forEach(function (f, i) {
      var left = W.num(f.bits, 8);
      while (left > 0) {
        if (at % width === 0) grid.appendChild(h('span', 'wm-packet-off', String(at / 8)));
        var take = Math.min(left, width - (at % width));
        var cell = h('span', { class: 'wm-packet-field', 'data-tip': f.name + ': ' + f.bits + ' bits at bit ' + at }, f.name);
        cell.style.gridColumn = 'span ' + take;
        grid.appendChild(cell);
        at += take; left -= take;
      }
    });
    el.appendChild(h('div', 'wm-packet-wrap', grid));
    el.appendChild(h('p', 'wm-muted wm-small', W.fmt(at / 8) + ' bytes'));
  }
});
