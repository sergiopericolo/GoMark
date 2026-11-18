/*
 * bitfield — a register or packet header: named fields over numbered bits.
 * data:   { "bits": 32, "fields": [{ "name", "bits", "value"? }] }   (fields from bit 0 upwards)
 * config: { "lanes": 16, "msb_left": true }
 */
WiMark.register('bitfield', {
  title: 'Bit field',
  description: 'Fields of a register or header over numbered bits, wrapped in lanes.',
  example: {
    data: {
      bits: 32,
      fields: [
        { name: 'opcode', bits: 7 }, { name: 'rd', bits: 5 }, { name: 'funct3', bits: 3, value: '000' },
        { name: 'rs1', bits: 5 }, { name: 'imm[11:0]', bits: 12 }
      ]
    },
    config: { lanes: 16, msb_left: true }
  },
  mount: function (el, data, config) {
    var W = WiMark, svg = W.svg;
    var total = Math.max(1, W.num(data.bits, 32)), per = Math.max(1, Math.min(total, W.num(config.lanes, 16)));
    var lanesN = Math.ceil(total / per), cell = 38, top = 18, laneH = 56;
    var c = W.chart(el, { width: per * cell + 4, height: lanesN * laneH + 6, margin: { top: 2, right: 2, bottom: 2, left: 2 }, label: 'bit field' });
    var msb = config.msb_left !== false;
    var bitX = function (b) { var i = b % per; return (msb ? per - 1 - i : i) * cell; };
    var laneOf = function (b) { return lanesN - 1 - Math.floor(b / per); };
    for (var b = 0; b < total; b++) {
      var y = laneOf(b) * laneH;
      c.add(svg('text', { x: bitX(b) + cell / 2, y: y + 12, 'text-anchor': 'middle', text: String(b) }));
    }
    var bit = 0;
    W.list(data.fields).forEach(function (f, fi) {
      var n = Math.max(1, W.num(f.bits, 1)), done = 0;
      while (done < n && bit < total) {
        var take = Math.min(n - done, per - (bit % per));
        var lo = bit, hi = bit + take - 1, y = laneOf(lo) * laneH + top;
        var x0 = Math.min(bitX(lo), bitX(hi)), w = take * cell;
        c.add(svg('rect', { x: x0, y: y, width: w, height: 30, class: 'wm-node' + (fi % 2 ? ' wm-bit-alt' : ''), 'data-tip': f.name + ' · bits ' + (bit - done) + '–' + (bit - done + n - 1) }));
        c.add(svg('text', { x: x0 + w / 2, y: y + 19, 'text-anchor': 'middle', class: 'wm-node-text', text: f.value !== undefined && take === n ? f.name + '=' + f.value : f.name }));
        bit += take; done += take;
      }
    });
  }
});
