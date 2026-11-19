/*
 * proof — a proof that ends with ∎; optionally folded.
 *   ```wimark-proof {"of": "Theorem 2.1", "fold": false}
 *   Text with $math$ and $$display math$$.
 *   ```
 */
WiMark.register('proof', {
  title: 'Proof',
  description: 'A proof, closed by a tombstone ∎; "fold" hides it behind a click.',
  input: 'text',
  example: { opts: { of: 'Theorem 2.1' }, body: 'The map $x \\mapsto ax$ permutes the non-zero residues mod $p$, so\n\n$$\\prod_{x=1}^{p-1} ax \\equiv \\prod_{x=1}^{p-1} x \\pmod p.$$\n\nDividing by $(p-1)!$, which is invertible mod $p$, gives $a^{p-1} \\equiv 1$.' },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var head = h('span', 'wm-env-head wm-proof-head', 'Proof', v.of ? h('span', 'wm-env-name', ' of ', W.inline(v.of)) : null, '.');
    var body = h('div', 'wm-proof-body', W.prose(v.text, 'wm-text wm-env-text'), h('span', { class: 'wm-qed', 'aria-label': 'end of proof' }, '∎'));
    el.appendChild(v.fold ? h('details', 'wm-env wm-proof', h('summary', null, head), body) : h('div', 'wm-env wm-proof', head, body));
  }
});
