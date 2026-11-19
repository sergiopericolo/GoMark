/*
 * ieee754 — how a number is stored as a float: sign, exponent, mantissa.
 *   ```wimark-ieee754 {"precision": "double"}
 *   [0.1, -2.5, 1e-310]
 *   ```
 */
WiMark.register('ieee754', {
  title: 'IEEE 754',
  description: 'The bits of a float32 or float64: sign, exponent, mantissa, the exact stored value and the rounding error.',
  example: { opts: { precision: 'single' }, body: [0.1, -2.5, 16777217] },
  choices: { precision: ['single', 'double'] },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var dbl = v.precision === 'double', E = dbl ? 11 : 8, M = dbl ? 52 : 23, bias = dbl ? 1023 : 127;
    W.list(v.items).forEach(function (n) {
      var x = Number(n), buf = new DataView(new ArrayBuffer(8)), bits = '';
      if (dbl) buf.setFloat64(0, x); else buf.setFloat32(0, x);
      for (var i = 0; i < (dbl ? 8 : 4); i++) { var b = buf.getUint8(i).toString(2); while (b.length < 8) b = '0' + b; bits += b; }
      var stored = dbl ? buf.getFloat64(0) : buf.getFloat32(0);
      var s = bits[0], e = bits.slice(1, 1 + E), m = bits.slice(1 + E), ev = parseInt(e, 2);
      var kind = ev === 0 ? (/1/.test(m) ? 'subnormal' : 'zero') : ev === Math.pow(2, E) - 1 ? (/1/.test(m) ? 'NaN' : 'infinity') : 'normal';
      var cells = function (str, cls) { return str.split('').map(function (b) { return h('span', 'wm-fbit ' + cls, b); }); };
      el.appendChild(h('div', 'wm-ieee',
        h('div', 'wm-ieee-head', h('code', null, String(n)), h('span', 'wm-tag', kind), h('span', 'wm-muted', (dbl ? 'float64' : 'float32'))),
        h('div', 'wm-ieee-bits', cells(s, 'wm-s1'), cells(e, 'wm-s2'), cells(m, 'wm-s3')),
        h('div', 'wm-ieee-parts',
          h('span', null, h('span', 'wm-label', 'sign'), ' ', s === '1' ? '−' : '+'),
          h('span', null, h('span', 'wm-label', 'exponent'), ' ', ev + ' − ' + bias + ' = ' + (kind === 'subnormal' ? 1 - bias : ev - bias)),
          h('span', null, h('span', 'wm-label', 'stored'), ' ', h('code', null, stored.toPrecision(dbl ? 17 : 9))),
          h('span', null, h('span', 'wm-label', 'error'), ' ', h('code', null, isFinite(x) ? (stored - x).toExponential(3) : '—')))));
    });
    el.appendChild(W.legend([{ label: 'sign (1)', cls: 'wm-s1' }, { label: 'exponent (' + E + ')', cls: 'wm-s2' }, { label: 'mantissa (' + M + ')', cls: 'wm-s3' }]));
  }
});
