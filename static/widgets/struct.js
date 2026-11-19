/*
 * struct — a data type: fields with types, tags and notes.
 *   ```wimark-struct {"name": "User", "kind": "struct"}
 *   [["ID", "uuid", "primary key"], ["Email", "string", "unique"], ["Age", "int?", ""]]
 *   ```
 */
WiMark.register('struct', {
  title: 'Data type',
  description: 'A struct, record or message: fields [name, type, note]; "type?" marks optional, sizes add up when given.',
  example: { opts: { name: 'BuildStats', kind: 'struct', lang: 'go' }, body: [['Lang', 'string', 'language code'], ['Pages', 'int', 'pages written'], ['Missing', 'int', 'pages copied from the default language'], ['Images', 'int', 'files written to media/'], ['Warnings', '[]string', 'problems that did not stop the build'], ['Took', 'time.Duration?', 'zero when not measured']] },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var rows = W.rows(v.items, ['name', 'type', 'note']);
    var src = (v.lang === 'go' ? 'type ' + v.name + ' struct {\n' + rows.map(function (r) { return '\t' + r.name + ' ' + String(r.type).replace(/\?$/, ''); }).join('\n') + '\n}' : null);
    el.appendChild(h('div', 'wm-box wm-struct',
      h('div', 'wm-struct-head', h('span', 'wm-muted', v.kind || 'type'), ' ', h('strong', null, v.name || '')),
      h('dl', 'wm-struct-fields', rows.map(function (r) {
        var opt = /\?$/.test(String(r.type));
        return h('div', null, h('dt', null, h('code', null, r.name)), h('dd', null, h('code', 'wm-struct-type', String(r.type || '').replace(/\?$/, '')), opt ? h('span', 'wm-muted wm-small', ' optional') : null, r.note ? h('span', 'wm-struct-note', W.inline(r.note)) : null));
      })),
      src ? h('details', 'wm-config-sample', h('summary', null, 'Go source'), W.codeBlock(src, { lang: 'go', title: false })) : null));
  }
});
