/*
 * config — a configuration reference: key, type, default, description,
 * plus the sample file built from the defaults.
 *   ```wimark-config {"format": "toml", "file": "gomark.toml"}
 *   [["site.title", "string", "\"My Site\"", "Shown in the header."], ["site.theme", "string", "\"light\"", "One of `gomark theme`."]]
 *   ```
 */
WiMark.register('config', {
  title: 'Configuration',
  description: 'Settings as [key, type, default, description]; a copyable sample file (TOML, YAML or env) is generated from the defaults.',
  example: { opts: { format: 'toml', file: 'gomark.toml' }, body: [['site.title', 'string', '"Docs"', 'Shown in the header and the page title.'], ['site.theme', 'string', '"light"', 'Any name from `gomark theme`.'], ['site.out', 'string', '"dist"', 'Output folder, relative to the site.'], ['style.font_size', 'int', '16', 'Body text size in px.'], ['style.max_width', 'int', '760', 'Width of the text column in px.']] },
  choices: { format: ['toml', 'yaml', 'env'] },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var rows = W.rows(v.items, ['key', 'type', 'def', 'desc']);
    el.appendChild(W.table(['key', 'type', 'default', ''], rows.map(function (r) {
      return [h('code', null, r.key), h('code', 'wm-muted', r.type || ''), r.def === undefined ? '' : h('code', null, String(r.def)), W.inline(r.desc || '')];
    }), { caption: v.file }));
    var fmt = v.format || 'toml', out = [], table = null;
    rows.forEach(function (r) {
      if (r.def === undefined) return;
      var parts = String(r.key).split('.'), leaf = parts.pop(), sec = parts.join('.');
      if (fmt === 'env') { out.push(String(r.key).toUpperCase().replace(/\./g, '_') + '=' + String(r.def).replace(/^"|"$/g, '')); return; }
      if (sec !== table) { if (out.length) out.push(''); if (sec) out.push(fmt === 'yaml' ? sec + ':' : '[' + sec + ']'); table = sec; }
      out.push((sec && fmt === 'yaml' ? '  ' : '') + leaf + (fmt === 'yaml' ? ': ' : ' = ') + r.def);
    });
    if (out.length && v.sample !== false) el.appendChild(h('details', 'wm-config-sample', h('summary', null, 'sample ' + (v.file || fmt)), W.codeBlock(out.join('\n'), { lang: fmt === 'toml' ? 'ini' : fmt === 'env' ? 'bash' : 'yaml', title: v.file || fmt })));
  }
});
