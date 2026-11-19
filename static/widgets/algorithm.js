/*
 * algorithm — pseudocode with line numbers, keywords and $math$.
 *   ```wimark-algorithm {"name": "Euclid", "input": "integers $a, b \\ge 0$", "output": "$\\gcd(a, b)$"}
 *   while b ≠ 0 do
 *     (a, b) ← (b, a mod b)
 *   return a
 *   ```
 */
WiMark.register('algorithm', {
  title: 'Algorithm',
  description: 'Numbered pseudocode: indentation kept, keywords set in bold, $math$ typeset, // comments dimmed.',
  input: 'text',
  example: { opts: { name: 'BinarySearch', n: '1', input: 'sorted array $A[0..n)$, key $k$', output: 'an index $i$ with $A[i] = k$, or $-1$' }, body: 'lo ← 0; hi ← n − 1\nwhile lo ≤ hi do\n  mid ← ⌊(lo + hi) / 2⌋        // no overflow in pseudocode\n  if A[mid] = k then\n    return mid\n  else if A[mid] < k then\n    lo ← mid + 1\n  else\n    hi ← mid − 1\nreturn −1' },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var KW = /^(if|then|else|elif|for|each|all|while|do|repeat|until|return|end|function|procedure|in|to|downto|step|and|or|not|let|break|continue|yield|loop|of|true|false|nil|null)$/;
    var ol = h('ol', 'wm-algo-lines');
    String(v.text || '').split('\n').forEach(function (ln) {
      var ind = ln.match(/^\s*/)[0].replace(/\t/g, '  ').length, code = ln.trim(), comment = '';
      var ci = code.indexOf('//');
      if (ci >= 0) { comment = code.slice(ci); code = code.slice(0, ci).replace(/\s+$/, ''); }
      var li = h('li', 'wm-algo-line');
      li.style.paddingLeft = (ind * 0.6) + 'em';
      code.split(/(\$[^$]+\$)/).forEach(function (part) {
        if (/^\$[^$]+\$$/.test(part)) { li.appendChild(W.tex(part.slice(1, -1))); return; }
        part.split(/(\b[A-Za-z]+\b)/).forEach(function (w) { li.appendChild(KW.test(w) ? h('strong', 'wm-algo-kw', w) : document.createTextNode(w)); });
      });
      if (comment) li.appendChild(h('span', 'wm-algo-comment', ' ' + comment));
      ol.appendChild(li);
    });
    el.appendChild(h('figure', 'wm-algo',
      h('figcaption', null, h('strong', null, (v.label || 'Algorithm') + (v.n ? ' ' + v.n : '')), v.name ? h('span', 'wm-algo-name', ' ' + v.name) : null),
      v.input ? h('div', 'wm-algo-io', h('strong', null, 'Input: '), W.inline(v.input)) : null,
      v.output ? h('div', 'wm-algo-io', h('strong', null, 'Output: '), W.inline(v.output)) : null,
      ol));
  }
});
