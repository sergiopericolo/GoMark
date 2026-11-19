/*
 * memory — a memory map or struct layout: regions with sizes and addresses.
 *   ```wimark-memory {"base": "0x400000", "unit": "B"}
 *   [["text", 4096, "code"], ["data", 1024], ["bss", 2048], ["heap ↓", 8192], ["stack ↑", 8192]]
 *   ```
 */
WiMark.register('memory', {
  title: 'Memory layout',
  description: 'Regions [name, size, note?] stacked from a base address with start and end offsets: segments, struct padding, file formats.',
  example: { opts: { base: '0x0', title: 'struct Header (Go, 64-bit)', unit: 'B' }, body: [['magic uint32', 4], ['(padding)', 4, 'aligns the next field to 8'], ['size uint64', 8], ['flags uint16', 2], ['kind uint8', 1], ['(padding)', 5, 'struct size rounds to 8'], ['name *byte', 8]] },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var base = parseInt(String(v.base || '0'), /^0x/i.test(String(v.base)) ? 16 : 10) || 0, at = 0;
    var hex = function (n) { var s = (base + n).toString(16).toUpperCase(); while (s.length < 4) s = '0' + s; return '0x' + s; };
    var rows = W.rows(v.items, ['name', 'size', 'note']), total = W.sum(rows.map(function (r) { return r.size; }));
    if (v.title) el.appendChild(h('div', 'wm-box-title', W.inline(v.title)));
    var map = h('div', 'wm-memory');
    rows.forEach(function (r, i) {
      var pad = /padding|reserved|unused/i.test(r.name), size = W.num(r.size);
      var cell = h('div', { class: 'wm-memory-region' + (pad ? ' wm-memory-pad' : ' ' + W.series(i % 8)), 'data-tip': r.name + ': ' + W.fmt(size) + ' ' + (v.unit || 'B') + ' at ' + hex(at) },
        h('span', 'wm-memory-addr', hex(at)), h('span', 'wm-memory-name', W.inline(r.name)), h('span', 'wm-memory-size', W.fmt(size) + ' ' + (v.unit || 'B')), r.note ? h('span', 'wm-memory-note', W.inline(r.note)) : null);
      cell.style.minHeight = Math.max(30, Math.min(120, 30 + Math.log2(1 + size) * 6)) + 'px';
      map.appendChild(cell);
      at += size;
    });
    map.appendChild(h('div', 'wm-memory-end', h('span', 'wm-memory-addr', hex(at)), h('span', 'wm-muted', 'end · ' + W.fmt(total) + ' ' + (v.unit || 'B'))));
    el.appendChild(map);
  }
});
