/*
 * derivation — a chain of equalities, each step with its justification.
 *   ```wimark-derivation {"n": "3"}
 *   ["(a+b)^2", ["(a+b)(a+b)", "definition"], ["a^2 + 2ab + b^2", "distribute"]]
 *   ```
 *   A step is ["expr", "reason", "op"?]; op defaults to "=" (try "\\le", "\\iff").
 */
WiMark.register('derivation', {
  title: 'Derivation',
  description: 'Step-by-step equalities aligned on the relation, each with a reason in plain text.',
  example: { body: ['\\sum_{k=0}^{n} \\binom{n}{k}', ['\\sum_{k=0}^{n} \\binom{n}{k} 1^k 1^{n-k}', 'insert $1^k 1^{n-k} = 1$'], ['(1 + 1)^n', 'binomial theorem'], ['2^n', '']] },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var steps = W.rows(v.items, ['expr', 'reason', 'op']);
    var grid = h('div', { class: 'wm-deriv', id: v.n ? 'eq-' + v.n : null });
    // The first expression stands on the left of the first relation; every
    // later step continues the chain under it.
    var D = function (src) { return W.tex('\\displaystyle ' + src); };
    steps.slice(1).forEach(function (s, i) {
      grid.appendChild(h('div', 'wm-deriv-lhs', i === 0 ? D(steps[0].expr) : ''));
      grid.appendChild(h('div', 'wm-deriv-rhs', D((s.op || v.op || '=') + ' ' + s.expr)));
      grid.appendChild(h('div', 'wm-deriv-why', s.reason ? W.inline(s.reason) : ''));
    });
    if (steps.length === 1) grid.appendChild(h('div', 'wm-deriv-lhs', D(steps[0].expr)));
    el.appendChild(h('div', 'wm-eq', h('div', 'wm-eq-body', grid), v.n ? h('span', 'wm-eq-n', '(' + v.n + ')') : null));
  }
});
