/*
 * terminal — a shell session: "$ " lines are commands (copyable), the rest output.
 *   ```wimark-terminal {"title": "zsh"}
 *   $ go test ./...
 *   ok   gomark/engine  3.2s
 *   ```
 */
WiMark.register('terminal', {
  title: 'Terminal',
  description: 'A shell session: lines starting with "$ " or "> " are commands with a copy button, "# " are comments, the rest is output.',
  input: 'text',
  example: { opts: { title: '~/docs' }, body: '# build and serve the site\n$ gomark build\nbuilt 42 pages, 18 images in 0.4s\n$ gomark serve -addr :8080\nserving http://localhost:8080' },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var pre = h('pre', 'wm-term-pre'), cmds = [];
    String(v.text || '').split('\n').forEach(function (ln) {
      var m = /^(\$|>|#|%)\s?(.*)$/.exec(ln);
      if (m && m[1] === '#') { pre.appendChild(h('div', 'wm-term-comment', ln)); return; }
      if (m) {
        cmds.push(m[2]);
        var btn = h('button', { type: 'button', class: 'wm-term-copy', 'aria-label': 'copy command' }, W.t('copy'));
        btn.addEventListener('click', function () { W.copy(m[2], btn); });
        pre.appendChild(h('div', 'wm-term-cmd', h('span', { class: 'wm-term-prompt', 'aria-hidden': 'true' }, (v.prompt || m[1]) + ' '), m[2], btn));
      } else pre.appendChild(h('div', 'wm-term-out', ln));
    });
    var all = h('button', { type: 'button', class: 'wm-btn' }, W.t('copy'));
    all.addEventListener('click', function () { W.copy(cmds.join('\n'), all); });
    el.appendChild(h('div', 'wm-term', h('div', 'wm-term-head', h('span', 'wm-term-dots', h('i'), h('i'), h('i')), h('span', null, v.title || 'terminal'), all), pre));
  }
});
