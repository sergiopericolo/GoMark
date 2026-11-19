/*
 * env — environment variables with a ready-to-copy .env template.
 *   ```wimark-env
 *   [["DATABASE_URL", "required", "postgres://localhost/app", "Connection string."], ["LOG_LEVEL", "info", "", "debug, info, warn"]]
 *   ```
 *   The second slot is "required" or the default value.
 */
WiMark.register('env', {
  title: 'Environment variables',
  description: 'Variables as [NAME, "required" or default, example, description] and a .env template to copy.',
  example: { body: [['GOMARK_AI_KEY', 'required', 'sk-…', 'API key of the AI provider.'], ['GOMARK_AI_MODEL', 'claude-sonnet-5-5', '', 'Model used by `gomark ai`.'], ['GOMARK_ADDR', ':8080', '', 'Address of `gomark serve`.'], ['NO_COLOR', '', '1', 'Disable colors in the terminal output.']] },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var rows = W.rows(v.items, ['name', 'def', 'example', 'desc']);
    el.appendChild(W.table(['variable', 'default', ''], rows.map(function (r) {
      return [h('code', null, r.name), r.def === 'required' ? h('span', 'wm-req', 'required') : r.def ? h('code', null, String(r.def)) : h('span', 'wm-muted', '—'), W.inline(r.desc || '')];
    })));
    var tpl = rows.map(function (r) { return (r.desc ? '# ' + String(r.desc).replace(/`/g, '') + '\n' : '') + r.name + '=' + (r.example || (r.def !== 'required' ? r.def || '' : '')); }).join('\n');
    el.appendChild(h('details', 'wm-config-sample', h('summary', null, '.env template'), W.codeBlock(tpl, { lang: 'bash', title: '.env' })));
  }
});
