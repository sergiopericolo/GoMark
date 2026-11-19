/*
 * example — a worked example, numbered, set apart from the text.
 *   ```wimark-example {"n": "3", "title": "Binary search on 7 items"}
 *   Text.
 *   ```
 */
WiMark.register('example', {
  title: 'Example',
  description: 'A worked example with number and title, set apart from the main text.',
  input: 'text',
  example: { opts: { n: '3', title: 'Solving a congruence' }, body: 'Solve $3x \\equiv 4 \\pmod 7$. The inverse of $3$ mod $7$ is $5$, since $3 \\cdot 5 = 15 \\equiv 1$.\n\nSo $x \\equiv 5 \\cdot 4 = 20 \\equiv 6 \\pmod 7$.' },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    el.appendChild(h('div', 'wm-example',
      h('div', 'wm-example-head', h('span', 'wm-label', (v.label || 'Example') + (v.n ? ' ' + v.n : '')), v.title ? h('span', 'wm-example-title', W.inline(v.title)) : null),
      W.prose(v.text)));
  }
});
