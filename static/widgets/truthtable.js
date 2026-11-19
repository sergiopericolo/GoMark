/*
 * truthtable — computes the truth table of boolean expressions.
 *   ```wimark-truthtable {"vars": ["p", "q"]}
 *   ["p and q", "p -> q", "not (p xor q)"]
 *   ```
 *   operators: not ! ¬ · and & ∧ · or | ∨ · xor ^ ⊕ · -> => → · <-> <=> ↔ · constants 1 0 T F
 */
WiMark.register('truthtable', {
  title: 'Truth table',
  description: 'Every row of one or more boolean expressions, computed; tautologies and contradictions flagged.',
  example: { body: ['p -> q', 'not q -> not p', '(p -> q) <-> (not q -> not p)'] },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var exprs = W.list(v.items || v.exprs).map(String);
    function parse(src) {
      var toks = src.match(/<->|<=>|->|=>|&&|\|\||[()!¬~&|^∧∨⊕→↔]|[A-Za-z_]\w*|[01]/g) || [], pos = 0, names = [];
      function peek() { return toks[pos]; }
      function is(list) { return list.indexOf(peek()) >= 0 ? toks[pos++] : null; }
      function bin(next, ops, fn) { return function () { var a = next(); while (is(ops)) { var x = a, b = next(); a = fn(x, b); } return a; }; }
      function atom() {
        var t = toks[pos++];
        if (t === undefined) throw new Error('unexpected end of ' + src);
        if (t === '(') { var e = iff(); if (toks[pos++] !== ')') throw new Error('missing ) in ' + src); return e; }
        if (['not', '!', '¬', '~'].indexOf(t) >= 0) { var a = atom(); return function (s) { return !a(s); }; }
        if (t === '1' || t === 'T' || t === 'true') return function () { return true; };
        if (t === '0' || t === 'F' || t === 'false') return function () { return false; };
        if (/^[A-Za-z_]/.test(t)) { if (names.indexOf(t) < 0) names.push(t); return function (s) { return s[t]; }; }
        throw new Error('unexpected ' + t + ' in ' + src);
      }
      var and = bin(atom, ['and', '&', '&&', '∧'], function (a, b) { return function (s) { return a(s) && b(s); }; });
      var xor = bin(and, ['xor', '^', '⊕'], function (a, b) { return function (s) { return a(s) !== b(s); }; });
      var or = bin(xor, ['or', '|', '||', '∨'], function (a, b) { return function (s) { return a(s) || b(s); }; });
      function imp() { var a = or(); if (is(['->', '=>', '→'])) { var b = imp(); return function (s) { return !a(s) || b(s); }; } return a; }
      var iff = bin(imp, ['<->', '<=>', '↔'], function (a, b) { return function (s) { return a(s) === b(s); }; });
      var f = iff();
      if (pos < toks.length) throw new Error('unexpected ' + toks[pos] + ' in ' + src);
      return { f: f, names: names };
    }
    var parsed = exprs.map(parse), vars = W.list(v.vars);
    parsed.forEach(function (p) { p.names.forEach(function (n) { if (vars.indexOf(n) < 0) vars.push(n); }); });
    if (vars.length > 6) throw new Error('at most 6 variables (64 rows)');
    var pretty = function (s) { return s.replace(/<->|<=>/g, '↔').replace(/->|=>/g, '→').replace(/\bxor\b/g, '⊕').replace(/\band\b|&&?/g, '∧').replace(/\bor\b|\|\|?/g, '∨').replace(/\bnot\s*|!|~/g, '¬'); };
    var T = v.style === '10' ? ['1', '0'] : ['T', 'F'], rows = [], cols = parsed.map(function () { return []; });
    for (var m = 0; m < 1 << vars.length; m++) {
      var s = {}, row = [];
      vars.forEach(function (n, i) { s[n] = !((m >> (vars.length - 1 - i)) & 1); row.push(h('span', 'wm-tt-in', s[n] ? T[0] : T[1])); });
      parsed.forEach(function (p, k) { var r = p.f(s); cols[k].push(r); row.push(h('span', 'wm-tt-' + (r ? 't' : 'f'), r ? T[0] : T[1])); });
      rows.push(row);
    }
    var head = vars.concat(exprs.map(function (e, k) {
      var all = cols[k].every(Boolean), none = !cols[k].some(Boolean);
      return h('span', null, pretty(e), all ? h('span', { class: 'wm-tag wm-pos', title: 'tautology' }, 'taut.') : none ? h('span', { class: 'wm-tag wm-neg', title: 'contradiction' }, 'contr.') : null);
    }));
    el.appendChild(W.table(head, rows, { cls: 'wm-tt', align: head.map(function () { return 'center'; }) }));
  }
});
