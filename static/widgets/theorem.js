/*
 * theorem — a theorem-like statement: theorem, lemma, proposition,
 * corollary, axiom, conjecture, remark.
 *   ```wimark-theorem {"kind": "lemma", "n": "2.3", "name": "Zorn"}
 *   Statement with $math$.
 *   ```
 */
WiMark.register('theorem', {
  title: 'Theorem',
  description: 'Theorem, lemma, proposition, corollary, axiom, conjecture or remark, numbered and named.',
  input: 'text',
  example: { opts: { kind: 'theorem', n: '2.1', name: 'Fermat' }, body: 'For every prime $p$ and integer $a$ not divisible by $p$:\n\n$$a^{p-1} \\equiv 1 \\pmod p$$' },
  choices: { kind: ['theorem', 'lemma', 'proposition', 'corollary', 'axiom', 'conjecture', 'remark'] },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var kind = String(v.kind || 'theorem').toLowerCase();
    var label = v.label || kind.charAt(0).toUpperCase() + kind.slice(1);
    el.appendChild(h('div', 'wm-env wm-env-theorem wm-env-' + kind,
      h('span', 'wm-env-head', label + (v.n ? ' ' + v.n : ''), v.name ? h('span', 'wm-env-name', ' (', W.inline(v.name), ')') : null, '.'),
      ' ', W.prose(v.text, 'wm-text wm-env-text')));
  }
});
