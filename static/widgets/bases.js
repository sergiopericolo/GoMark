/*
 * bases — integers in binary, octal, decimal and hex, with their bits.
 *   ```wimark-bases {"bits": 8}
 *   [255, 42, -1]
 *   ```
 */
WiMark.register('bases', {
  title: 'Number bases',
  description: 'Integers in binary, octal, decimal and hexadecimal; negatives in two’s complement over "bits".',
  example: { opts: { bits: 16 }, body: [255, 4096, 0xBEEF, -2] },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var bits = Math.max(4, Math.min(53, W.num(v.bits, 32)));
    var rows = W.list(v.items).map(function (n) {
      var x = typeof n === 'string' ? parseInt(n, /^0x/i.test(n) ? 16 : /^0b/i.test(n) ? 2 : /^0o/i.test(n) ? 8 : 10) : Math.trunc(n);
      if (/^0b/i.test(n)) x = parseInt(String(n).slice(2), 2);
      if (/^0o/i.test(n)) x = parseInt(String(n).slice(2), 8);
      var u = x < 0 ? Math.pow(2, bits) + x : x;
      var bin = u.toString(2);
      while (bin.length < bits) bin = '0' + bin;
      var grouped = bin.replace(/(?=(?:[01]{4})+$)/g, ' ').trim();
      return [W.fmt(x, { useGrouping: false }), h('code', 'wm-bits', grouped), u.toString(8), '0x' + u.toString(16).toUpperCase()];
    });
    el.appendChild(W.table(['dec', 'bin (' + bits + ' bits)', 'oct', 'hex'], rows, { align: ['right', 'left', 'right', 'right'] }));
  }
});
