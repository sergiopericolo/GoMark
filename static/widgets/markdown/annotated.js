/*
 * annotated — code with numbered notes pinned to its lines.
 * data:   { "code", "lang"?, "title"?, "notes": [{ "line", "text" }] }
 * config: { "line_numbers": true }
 */
WiMark.register('annotated', {
  title: 'Annotated code',
  description: 'Code with numbered markers on lines and the explanations below.',
  example: {
    data: {
      title: 'a WiMark', lang: 'javascript',
      code: "WiMark.register('hello', {\n  example: { data: { name: 'world' } },\n  mount: function (el, data) {\n    el.appendChild(WiMark.h('p', 'wm-text', 'Hello ' + data.name));\n  }\n});",
      notes: [
        { line: 1, text: 'The name used by a `widget-hello` block.' },
        { line: 2, text: 'An empty block shows this example.' },
        { line: 4, text: 'Classes only: the theme decides colors and fonts.' }
      ]
    },
    config: { line_numbers: true }
  },
  mount: function (el, data, config) {
    var W = WiMark, h = W.h;
    var notes = W.list(data.notes);
    var block = W.codeBlock(data.code, { lang: data.lang, title: data.title, numbers: config.line_numbers !== false,
      marks: notes.map(function (n) { return n.line; }) });
    var lines = block.querySelectorAll('.wm-code-line');
    notes.forEach(function (n, i) {
      var row = lines[W.num(n.line, 1) - 1];
      if (row) row.appendChild(h('span', { class: 'wm-annot-pin', 'aria-label': 'note ' + (i + 1) }, String(i + 1)));
    });
    el.appendChild(block);
    el.appendChild(h('ol', 'wm-annot-notes', notes.map(function (n, i) {
      return h('li', null, h('span', { class: 'wm-annot-pin', 'aria-hidden': 'true' }, String(i + 1)), h('span', 'wm-text', W.inline(n.text || '')));
    })));
  }
});
