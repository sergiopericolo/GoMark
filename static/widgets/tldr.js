/*
 * tldr — the key points of a page in a box, one per line.
 *   ```wimark-tldr {"title": "In short"}
 *   - The parser is linear.
 *   - Errors carry line numbers.
 *   ```
 */
WiMark.register('tldr', {
  title: 'Key points',
  description: 'A short summary box with the key points of a page, one per line.',
  input: 'text',
  example: { opts: { title: 'TL;DR' }, body: '- Binary search needs a sorted array.\n- It halves the range each step: $\\lceil \\log_2 n \\rceil$ comparisons at most.\n- Off-by-one errors live in the loop bounds — test empty and one-element arrays.' },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var points = W.lines(v.text).map(function (l) { return l.replace(/^\s*[-*•]\s*/, ''); });
    el.appendChild(h('div', 'wm-tldr', h('div', 'wm-label', W.inline(v.title || 'TL;DR')), h('ul', 'wm-list wm-tldr-list', points.map(function (p) { return h('li', null, W.inline(p)); }))));
  }
});
