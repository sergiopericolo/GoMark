/*
 * details — a collapsible block: a summary line, the text on click.
 *   ```wimark-details {"summary": "Why not regular expressions?", "open": false}
 *   Text, lists, $$display math$$.
 *   ```
 */
WiMark.register('details', {
  title: 'Details',
  description: 'A collapsible block for long explanations, derivations or solutions.',
  input: 'text',
  example: { opts: { summary: 'Why is the parser recursive descent?' }, body: 'The grammar is LL(1): one token of look-ahead decides every rule, so each rule is one function.\n\n$$E \\to T\\,(\\texttt{+}\\,T)^*$$' },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    el.appendChild(h('details', { class: 'wm-details', open: !!v.open },
      h('summary', null, W.inline(v.summary || 'Details')), h('div', 'wm-details-body', W.prose(v.text))));
  }
});
