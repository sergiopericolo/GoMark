/*
 * kmap — a Karnaugh map from minterms, with the minimal sum of products.
 *   ```wimark-kmap {"vars": ["A", "B", "C", "D"], "ones": [0, 2, 5, 7, 8, 10, 13, 15], "dc": [1]}
 *   ```
 */
WiMark.register('kmap', {
  title: 'Karnaugh map',
  description: 'A K-map for 2–4 variables from minterms and don’t-cares, with a minimal sum of products (Quine–McCluskey).',
  example: { opts: { vars: ['A', 'B', 'C', 'D'], ones: [0, 2, 5, 7, 8, 10, 13, 15], dc: [] } },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var vars = W.list(v.vars), n = vars.length;
    if (n < 2 || n > 4) throw new Error('2 to 4 variables');
    var ones = W.list(v.ones).map(Number), dc = W.list(v.dc).map(Number);
    var gray = function (b) { return b === 1 ? [0, 1] : [0, 1, 3, 2]; };
    var rb = Math.floor(n / 2), cb = n - rb, R = gray(rb), C = gray(cb);
    var bits = function (x, w) { var s = x.toString(2); while (s.length < w) s = '0' + s; return s; };
    var tbl = h('table', 'wm-table wm-kmap');
    tbl.appendChild(h('thead', null, h('tr', null, h('th', 'wm-kmap-corner', vars.slice(0, rb).join('') + ' \\ ' + vars.slice(rb).join('')), C.map(function (c) { return h('th', { scope: 'col', class: 'wm-center' }, bits(c, cb)); }))));
    var body = h('tbody');
    R.forEach(function (r) {
      body.appendChild(h('tr', null, h('th', { scope: 'row' }, bits(r, rb)), C.map(function (c) {
        var m = (r << cb) | c, val = ones.indexOf(m) >= 0 ? '1' : dc.indexOf(m) >= 0 ? 'X' : '0';
        return h('td', { class: 'wm-center wm-kmap-' + (val === '1' ? 'one' : val === 'X' ? 'dc' : 'zero') }, h('span', 'wm-kmap-v', val), h('span', 'wm-kmap-m', String(m)));
      })));
    });
    tbl.appendChild(body);
    // Quine–McCluskey: merge implicants differing in one bit, then cover greedily.
    var terms = ones.concat(dc).map(function (m) { return { mask: 0, val: m, ms: [m] }; }), primes = [];
    while (terms.length) {
      var next = [], used = terms.map(function () { return false; });
      for (var i = 0; i < terms.length; i++) for (var j = i + 1; j < terms.length; j++) {
        var a = terms[i], b = terms[j], d = a.val ^ b.val;
        if (a.mask === b.mask && d && !(d & (d - 1))) {
          used[i] = used[j] = true;
          var t = { mask: a.mask | d, val: a.val & ~d, ms: a.ms.concat(b.ms) };
          if (!next.some(function (x) { return x.mask === t.mask && x.val === t.val; })) next.push(t);
        }
      }
      terms.forEach(function (t, k) { if (!used[k] && !primes.some(function (p) { return p.mask === t.mask && p.val === t.val; })) primes.push(t); });
      terms = next;
    }
    var left = ones.slice(), cover = [];
    while (left.length) {
      var best = primes.reduce(function (b, p) { var k = p.ms.filter(function (m) { return left.indexOf(m) >= 0; }).length; return k > b.k ? { p: p, k: k } : b; }, { p: null, k: 0 }).p;
      if (!best) break;
      cover.push(best);
      left = left.filter(function (m) { return best.ms.indexOf(m) < 0; });
    }
    var term = function (p) {
      var out = vars.map(function (name, i) { var bit = 1 << (n - 1 - i); return p.mask & bit ? '' : p.val & bit ? name : '\\overline{' + name + '}'; }).join('');
      return out || '1';
    };
    var sop = ones.length ? cover.map(term).join(' + ') : '0';
    el.appendChild(h('div', 'wm-kmap-wrap', tbl, h('div', 'wm-kmap-out',
      h('div', null, h('span', 'wm-label', 'minterms'), ' ', W.tex('\\sum m(' + ones.sort(function (x, y) { return x - y; }).join(', ') + ')' + (dc.length ? ' + d(' + dc.join(', ') + ')' : ''))),
      h('div', null, h('span', 'wm-label', 'minimal SOP'), ' ', W.tex('f = ' + sop)))));
  }
});
