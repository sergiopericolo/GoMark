/*
 * definition — a numbered definition with the defined term in bold.
 *   ```wimark-definition {"term": "group", "n": "1.1"}
 *   A set $G$ with an operation $\cdot$ that is associative, ...
 *   ```
 */
WiMark.register('definition', {
  title: 'Definition',
  description: 'A numbered definition; the term is set in bold and can be linked to.',
  input: 'text',
  example: { opts: { term: 'Group', n: '1.1' }, body: 'A set $G$ with an operation $\\cdot : G \\times G \\to G$ that is associative, has an identity $e$ and an inverse $g^{-1}$ for every $g \\in G$.' },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var id = v.term ? 'def-' + String(v.term).toLowerCase().replace(/[^a-z0-9]+/g, '-') : null;
    el.appendChild(h('div', { class: 'wm-env wm-env-definition', id: id },
      h('span', 'wm-env-head', (v.label || 'Definition') + (v.n ? ' ' + v.n : ''), v.term ? h('span', 'wm-env-name', ' (', W.inline(v.term), ')') : null, '.'),
      ' ', W.prose(v.text, 'wm-text wm-env-text')));
  }
});
