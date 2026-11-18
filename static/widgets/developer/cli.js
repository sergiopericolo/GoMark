/*
 * cli — a command reference: usage, subcommands and flags, man-page style.
 * data:   { "name", "usage", "description"?, "commands"?: [{ "name", "args"?, "help" }], "flags"?: [{ "flag", "arg"?, "default"?, "help" }] }
 * config: { "examples": [] }
 */
WiMark.register('cli', {
  title: 'CLI reference',
  description: 'Usage line, subcommands and flags of a command, with copyable examples.',
  example: {
    data: {
      name: 'gomark ai', usage: 'gomark ai <translate|convert|widget|list|show|apply|discard> [args] [flags]',
      description: 'Ask an AI for a proposal; nothing is written until you apply it.',
      commands: [
        { name: 'translate', args: '<section/page.md>', help: 'translate a page into -lang' },
        { name: 'convert', args: '<file> <section/page.md>', help: 'turn a PDF, DOCX, HTML or text file into a page' },
        { name: 'widget', args: '<name> "<description>"', help: 'write a site WiMark' },
        { name: 'apply', args: '<id>', help: 'write a checked proposal' }
      ],
      flags: [{ flag: '-lang', arg: 'code', help: 'target language' }, { flag: '-force', help: 'apply: overwrite an existing file' }]
    },
    config: { examples: ['gomark ai translate notes/first.md -lang it', 'gomark ai apply 20261118-1a2b'] }
  },
  mount: function (el, data, config) {
    var W = WiMark, h = W.h;
    el.appendChild(W.codeBlock(data.usage || data.name || '', { lang: 'bash', title: data.name || 'usage' }));
    if (data.description) el.appendChild(W.paras(data.description));
    function list(title, items, left, right) {
      if (!items.length) return;
      el.appendChild(h('div', 'wm-label wm-api-label', title));
      el.appendChild(h('dl', 'wm-cli-list', items.map(function (it) { return [h('dt', null, left(it)), h('dd', null, right(it))]; })));
    }
    list('commands', W.list(data.commands), function (c) { return [h('code', null, c.name), c.args ? h('span', 'wm-muted', ' ' + c.args) : null]; }, function (c) { return W.inline(c.help || ''); });
    list('flags', W.list(data.flags), function (f) { return [h('code', null, f.flag), f.arg ? h('span', 'wm-muted', ' <' + f.arg + '>') : null]; },
      function (f) { return [W.inline(f.help || ''), f.default !== undefined ? h('span', 'wm-muted', ' (default ' + f.default + ')') : null]; });
    var ex = W.list(config.examples);
    if (ex.length) { el.appendChild(h('div', 'wm-label wm-api-label', 'examples')); el.appendChild(W.codeBlock(ex.join('\n'), { lang: 'bash', title: 'examples' })); }
  }
});
