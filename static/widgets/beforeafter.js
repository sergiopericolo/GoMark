/*
 * beforeafter — two versions of code side by side: before / after, wrong / right.
 *   ```wimark-beforeafter {"lang": "go"}
 *   === Before
 *   …
 *   === After
 *   …
 *   ```
 */
WiMark.register('beforeafter', {
  title: 'Before / after',
  description: 'Two code blocks side by side ("=== Before" / "=== After", or any two titles), marked ✕ and ✓.',
  input: 'text',
  example: { opts: { lang: 'go' }, body: '=== Before\nfor i := 0; i < len(s); i++ {\n\tif s[i] == x {\n\t\treturn i\n\t}\n}\nreturn -1\n=== After\nreturn slices.Index(s, x)' },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var parts = W.sections(v.text).slice(0, 2), st = ['neg', 'pos'];
    el.appendChild(h('div', 'wm-beforeafter', parts.map(function (p, i) {
      return h('div', 'wm-beforeafter-col wm-' + st[i], h('div', 'wm-beforeafter-head', h('span', 'wm-icon', h('span', null, W.icon(st[i]))), W.inline(p.title || (i ? 'After' : 'Before'))),
        W.codeBlock(p.text, { lang: v.lang, title: false }));
    })));
  }
});
