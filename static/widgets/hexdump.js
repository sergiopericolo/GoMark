/*
 * hexdump — bytes in hex with offsets and printable characters; ranges marked.
 *   ```wimark-hexdump {"width": 16, "mark": [[0, 4, "magic"]]}
 *   89 50 4E 47 0D 0A 1A 0A
 *   ```
 *   The body is hex bytes, or any text with "ascii": true.
 */
WiMark.register('hexdump', {
  title: 'Hex dump',
  description: 'Bytes (hex, or text with "ascii": true) with offsets and ASCII; "mark": [[start, length, label]] highlights fields.',
  input: 'text',
  example: { opts: { mark: [[0, 8, 'PNG signature'], [8, 4, 'chunk length'], [12, 4, 'type IHDR'], [16, 4, 'width'], [20, 4, 'height']] }, body: '89 50 4E 47 0D 0A 1A 0A 00 00 00 0D 49 48 44 52\n00 00 03 C0 00 00 02 58 08 06 00 00 00 9B 1F 8C' },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var bytes = v.ascii ? Array.from(new TextEncoder().encode(String(v.text || '')))
      : (String(v.text || '').match(/[0-9A-Fa-f]{2}/g) || []).map(function (x) { return parseInt(x, 16); });
    var width = W.num(v.width, 16), marks = W.list(v.mark), pre = h('pre', 'wm-hex');
    var markOf = function (i) { for (var k = 0; k < marks.length; k++) if (i >= marks[k][0] && i < marks[k][0] + marks[k][1]) return k; return -1; };
    for (var off = 0; off < bytes.length; off += width) {
      var row = h('div', 'wm-hex-row', h('span', 'wm-hex-off', ('0000000' + off.toString(16)).slice(-8)));
      var hexs = h('span', 'wm-hex-bytes'), asc = h('span', 'wm-hex-ascii');
      for (var i = off; i < off + width; i++) {
        if (i >= bytes.length) { hexs.appendChild(document.createTextNode('   ')); continue; }
        var k = markOf(i), b = bytes[i], cls = k >= 0 ? 'wm-hex-mark ' + W.series(k % 8) : '';
        var tip = k >= 0 ? (marks[k][2] || '') + ' @' + i : '@' + i;
        hexs.appendChild(h('span', { class: cls, 'data-tip': tip }, ('0' + b.toString(16)).slice(-2).toUpperCase()));
        hexs.appendChild(document.createTextNode(i % 8 === 7 ? '  ' : ' '));
        asc.appendChild(h('span', { class: cls }, b >= 32 && b < 127 ? String.fromCharCode(b) : '·'));
      }
      row.appendChild(hexs);
      row.appendChild(asc);
      pre.appendChild(row);
    }
    el.appendChild(h('div', 'wm-code', h('div', 'wm-code-head', h('span', null, v.title || bytes.length + ' bytes')), pre));
    if (marks.length) el.appendChild(W.legend(marks.map(function (m, i) { return { label: (m[2] || 'range') + ' · ' + m[0] + '–' + (m[0] + m[1] - 1), i: i % 8 }; })));
  }
});
