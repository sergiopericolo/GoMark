/*
 * code — a code block with title, line numbers and highlighted lines.
 * data:   { "code", "lang"?, "title"?, "highlight"?: [3, 4] }
 * config: { "line_numbers": true, "start": 1, "wrap": false }
 */
WiMark.register('code', {
  title: 'Code block',
  description: 'Code with file name, line numbers, highlighted lines and copy.',
  example: {
    data: {
      title: 'engine/section.go', lang: 'go', highlight: [3, 4],
      code: 'func (l *SectionLayout) resolve(global Style) error {\n\tif l.Layout == "" {\n\t\tl.Layout = LayoutColumns\n\t}\n\tst := global\n\tst.normalize()\n\tl.Style = st\n\treturn nil\n}'
    },
    config: { line_numbers: true, start: 1, wrap: false }
  },
  mount: function (el, data, config) {
    var W = WiMark;
    if (typeof data === 'string') data = { code: data };
    el.appendChild(W.codeBlock(data.code, { lang: data.lang, title: data.title, numbers: config.line_numbers !== false,
      start: config.start, marks: data.highlight, wrap: !!config.wrap }));
  }
});
