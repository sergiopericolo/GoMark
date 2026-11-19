/*
 * code — source with file name, line numbers, highlighted lines and copy.
 *   ```wimark-code {"file": "main.go", "lang": "go", "hl": "3,5-6", "from": 1}
 *   package main
 *   ```
 */
WiMark.register('code', {
  title: 'Code',
  description: 'Code with file name, language, line numbers from any start, highlighted lines ("2,4-6") and copy.',
  input: 'text',
  example: { opts: { file: 'engine/image.go', lang: 'go', hl: '4-6', from: 120 }, body: '// Re-encoding must never cost bytes: an image already in the right format,\n// with nothing to resize, rotate or map, stays as it was when smaller.\nif !changed && o.Palette == "" && kind == format && len(raw) <= buf.Len() {\n\tst.After, st.Kept = int64(len(raw)), true\n\treturn raw, ext, st, nil\n}' },
  mount: function (el, v) {
    var W = WiMark;
    var marks = [];
    String(v.hl || '').split(',').forEach(function (p) {
      var m = /^\s*(\d+)(?:\s*-\s*(\d+))?\s*$/.exec(p);
      if (m) for (var i = +m[1]; i <= +(m[2] || m[1]); i++) marks.push(i);
    });
    var ext = String(v.file || '').split('.').pop();
    var lang = v.lang || ({ go: 'go', js: 'javascript', ts: 'typescript', py: 'python', rs: 'rust', rb: 'ruby', sh: 'bash', c: 'c', h: 'c', cpp: 'cpp', java: 'java', toml: 'ini', yml: 'yaml', yaml: 'yaml', json: 'json', sql: 'sql', css: 'css', html: 'xml', md: 'markdown' })[ext] || '';
    el.appendChild(W.codeBlock(v.text, { lang: lang, title: v.file || v.title || lang, numbers: v.nums !== false, start: W.num(v.from, 1), marks: marks, wrap: v.wrap }));
  }
});
