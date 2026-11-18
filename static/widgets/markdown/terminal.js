/*
 * terminal — a shell session: prompts, commands and output.
 * data:   { "session": "$ cmd\noutput…" } or { "lines": [{ "cmd" } | { "out" } | { "comment" }] }
 * config: { "title": "terminal", "prompt": "$" }
 */
WiMark.register('terminal', {
  title: 'Terminal',
  description: 'A shell session; commands are copyable, output is dimmed.',
  example: {
    data: { session: '$ gomark init blog "Blog"\ncreated blog/gomark.toml\n$ cd blog\n# two languages: a switch on every page\n$ gomark lang add it Italiano\n$ gomark build\nbuilt en → dist/en: 3 pages\nbuilt it → dist/it: 3 pages (1 shown from another language, with a notice)' },
    config: { title: 'zsh — blog', prompt: '$' }
  },
  mount: function (el, data, config) {
    var W = WiMark, h = W.h;
    var p = config.prompt || '$';
    var lines = W.list(data.lines);
    if (!lines.length) lines = String(data.session || (typeof data === 'string' ? data : '')).split('\n').map(function (l) {
      if (l.indexOf(p + ' ') === 0) return { cmd: l.slice(p.length + 1) };
      if (/^#\s?/.test(l)) return { comment: l.replace(/^#\s?/, '') };
      return { out: l };
    });
    var pre = h('pre', 'wm-term-pre');
    var cmds = [];
    lines.forEach(function (l) {
      if (l.cmd !== undefined) { cmds.push(l.cmd); pre.appendChild(h('div', 'wm-term-cmd', h('span', { class: 'wm-term-prompt', 'aria-hidden': 'true' }, p + ' '), l.cmd)); }
      else if (l.comment !== undefined) pre.appendChild(h('div', 'wm-term-comment', '# ' + l.comment));
      else pre.appendChild(h('div', 'wm-term-out', l.out || ' '));
    });
    var btn = h('button', { type: 'button', class: 'wm-btn' }, W.t('copy'));
    btn.addEventListener('click', function () { W.copy(cmds.join('\n'), btn); });
    el.appendChild(h('div', 'wm-code wm-term', h('div', 'wm-code-head',
      h('span', 'wm-term-dots', h('i'), h('i'), h('i'), ' ', config.title || 'terminal'), btn), pre));
  }
});
