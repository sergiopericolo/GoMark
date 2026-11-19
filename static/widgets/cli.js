/*
 * cli — a command reference: usage, flags and copyable examples.
 *   ```wimark-cli {"cmd": "gomark build", "usage": "gomark build [-out dir] [-lang code]", "summary": "Build the site."}
 *   {"flags": [["-out dir", "Output folder.", "dist"]], "examples": ["gomark build -lang it"]}
 *   ```
 */
WiMark.register('cli', {
  title: 'Command',
  description: 'A command: usage line, summary, flags [flag, description, default?], subcommands and copyable examples.',
  example: { opts: { cmd: 'gomark build', usage: 'gomark build [-out dir] [-lang code]', summary: 'Build every language into the output folder.' }, body: { flags: [['-out dir', 'Output folder.', 'dist'], ['-lang code', 'Build one language only.']], examples: ['gomark build', 'gomark build -lang it -out public'] } },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var box = h('section', 'wm-box wm-cli', h('header', 'wm-cli-head', h('code', 'wm-cli-cmd', v.cmd || '')));
    if (v.summary) box.appendChild(h('p', 'wm-text', W.inline(v.summary)));
    if (v.usage) box.appendChild(W.codeBlock(v.usage, { lang: 'bash', title: 'usage', copy: false }));
    var flags = W.rows(v.flags, ['flag', 'desc', 'def']);
    if (flags.length) box.appendChild(h('dl', 'wm-params', flags.map(function (f) {
      return h('div', 'wm-params-row', h('dt', null, h('code', 'wm-params-name', f.flag), f.def !== undefined ? h('span', 'wm-small wm-muted', ' default ', h('code', null, String(f.def))) : null), h('dd', null, W.inline(f.desc || '')));
    })));
    var subs = W.rows(v.commands, ['name', 'desc']);
    if (subs.length) box.appendChild(h('div', null, h('div', 'wm-label', 'commands'), h('dl', 'wm-params', subs.map(function (s) { return h('div', 'wm-params-row', h('dt', null, h('code', null, s.name)), h('dd', null, W.inline(s.desc || ''))); }))));
    var ex = W.list(v.examples);
    if (ex.length) box.appendChild(h('div', null, h('div', 'wm-label', 'examples'), W.codeBlock(ex.map(function (e) { return '$ ' + e; }).join('\n'), { lang: 'bash', title: false })));
    el.appendChild(box);
  }
});
