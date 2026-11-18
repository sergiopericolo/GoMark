/*
 * hexdump — bytes as offset · hex · ASCII, like `xxd`.
 * data:   { "text"?: "string (UTF-8)", "base64"?: "…", "bytes"?: [0-255, …], "highlight"?: [[start, end]] }
 * config: { "width": 16, "group": 2 }
 */
WiMark.register('hexdump', {
  title: 'Hex dump',
  description: 'Bytes in hex with offsets and printable characters; ranges can be highlighted.',
  example: {
    data: { text: 'GoMark\n[site]\ntitle = "Blog"\n', highlight: [[0, 6]] },
    config: { width: 16, group: 2 }
  },
  mount: function (el, data, config) {
    var W = WiMark, h = W.h;
    var bytes = W.list(data.bytes).map(function (b) { return W.num(b) & 255; });
    if (!bytes.length && data.base64) { var bin = atob(String(data.base64)); for (var i = 0; i < bin.length; i++) bytes.push(bin.charCodeAt(i)); }
    if (!bytes.length && data.text !== undefined) bytes = Array.from(new TextEncoder().encode(String(data.text)));
    var width = Math.max(4, W.num(config.width, 16)), group = Math.max(1, W.num(config.group, 2));
    var ranges = W.list(data.highlight);
    var marked = function (i) { return ranges.some(function (r) { return i >= r[0] && i < r[1]; }); };
    var pre = h('pre', 'wm-hex');
    for (var off = 0; off < bytes.length; off += width) {
      var row = h('div', 'wm-hex-row', h('span', 'wm-hex-off', off.toString(16).padStart(8, '0') + '  '));
      var hex = h('span', 'wm-hex-bytes'), asc = h('span', 'wm-hex-ascii');
      for (var j = 0; j < width; j++) {
        var k = off + j, b = bytes[k];
        var cls = k < bytes.length && marked(k) ? 'wm-hex-mark' : null;
        hex.appendChild(h('span', cls, k < bytes.length ? b.toString(16).padStart(2, '0') : '  '));
        if ((j + 1) % group === 0) hex.appendChild(document.createTextNode(' '));
        if (k < bytes.length) asc.appendChild(h('span', cls, b >= 32 && b < 127 ? String.fromCharCode(b) : '.'));
      }
      row.appendChild(hex);
      row.appendChild(document.createTextNode(' '));
      row.appendChild(asc);
      pre.appendChild(row);
    }
    el.appendChild(h('div', 'wm-code', h('div', 'wm-code-head', h('span', null, bytes.length + ' bytes')), pre));
  }
});
