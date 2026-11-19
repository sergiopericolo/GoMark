/*
 * exercise — a question with an optional hint and a hidden answer.
 *   ```wimark-exercise {"n": "4.2", "level": 2}
 *   {"q": "Show that ...", "hint": "Induction on n.", "a": "Base case ..."}
 *   ```
 */
WiMark.register('exercise', {
  title: 'Exercise',
  description: 'A question with difficulty, an optional hint and an answer revealed on click.',
  example: { opts: { n: '4.2', level: 2 }, body: { q: 'Prove that $\\sum_{k=1}^{n} k = \\frac{n(n+1)}{2}$.', hint: 'Induction on $n$.', a: 'For $n = 1$ both sides are $1$. If it holds for $n$, adding $n+1$ gives $\\frac{n(n+1)}{2} + n + 1 = \\frac{(n+1)(n+2)}{2}$.' } },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var lvl = Math.max(0, Math.min(5, W.num(v.level, 0)));
    var dots = lvl ? h('span', { class: 'wm-exercise-level', title: 'difficulty ' + lvl + '/5', 'aria-label': 'difficulty ' + lvl + ' of 5' }, '●●●●●'.slice(0, lvl) + '○○○○○'.slice(0, 5 - lvl)) : null;
    el.appendChild(h('div', 'wm-exercise',
      h('div', 'wm-example-head', h('span', 'wm-label', (v.label || 'Exercise') + (v.n ? ' ' + v.n : '')), dots),
      W.prose(v.q || v.text),
      v.hint ? h('details', 'wm-exercise-more', h('summary', null, 'hint'), W.prose(v.hint)) : null,
      v.a ? h('details', 'wm-exercise-more', h('summary', null, 'answer'), W.prose(v.a)) : null));
  }
});
