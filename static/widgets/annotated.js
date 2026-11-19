/*
 * annotated — code with numbered markers and the explanations below.
 *   ```wimark-annotated {"lang": "go", "notes": {"2": "Open never panics.", "4": "Errors wrap the path."}}
 *   code…
 *   ```
 */
WiMark.register('annotated', {
  title: 'Annotated code',
  description: 'Code with numbered markers on the lines named in "notes" and the explanations listed below.',
  input: 'text',
  example: { opts: { lang: 'go', notes: { 1: 'One parser for every page: goldmark is safe for concurrent use.', 3: 'WiMark fences are rendered by our own node renderer.', 6: 'Everything else falls through to plain code blocks.' } }, body: 'var md = goldmark.New(\n\tgoldmark.WithExtensions(extension.GFM, mathExt),\n\tgoldmark.WithRendererOptions(renderer.WithNodeRenderers(\n\t\tutil.Prioritized(fenceRenderer{}, 100))),\n)\n// ```go fences keep class="language-go"' },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var notes = v.notes || {}, keys = Object.keys(notes).map(Number).sort(function (a, b) { return a - b; });
    var block = W.codeBlock(v.text, { lang: v.lang, title: v.file || v.lang, numbers: true });
    var lines = block.querySelectorAll('.wm-code-line');
    keys.forEach(function (k, i) { if (lines[k - 1]) { lines[k - 1].classList.add('wm-mark-line'); lines[k - 1].appendChild(h('span', 'wm-anno-pin', String(i + 1))); } });
    el.appendChild(block);
    el.appendChild(h('ol', 'wm-anno-notes', keys.map(function (k, i) { return h('li', null, h('span', 'wm-anno-pin', String(i + 1)), h('span', 'wm-muted', 'line ' + k + ' · '), W.inline(notes[k])); })));
  }
});
