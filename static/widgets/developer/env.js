/*
 * env — environment variables: name, required, default, description; copy as .env.
 * data:   [{ "name", "required"?, "default"?, "description"?, "secret"? }]
 * config: { "dotenv": true }
 */
WiMark.register('env', {
  title: 'Environment variables',
  description: 'A reference of environment variables with a ready-to-copy .env template.',
  example: {
    data: [
      { name: 'ANTHROPIC_API_KEY', required: true, secret: true, description: 'Key for `gomark ai` with the anthropic provider.' },
      { name: 'GOMARK_AI_COMMAND', description: 'A local command for the command provider (prompt on stdin).' },
      { name: 'GOMARK_AI_MODEL', default: 'from gomark.toml', description: 'Override the model for one run.' }
    ],
    config: { dotenv: true }
  },
  mount: function (el, data, config) {
    var W = WiMark, h = W.h;
    var vars = W.list(data);
    el.appendChild(W.table(['variable', 'required', 'default', 'description'], vars.map(function (v) {
      return [h('span', null, h('code', null, v.name), v.secret ? h('span', 'wm-tag wm-env-secret', 'secret') : null),
        v.required ? W.cell(true) : '', v.default !== undefined ? h('code', null, String(v.default)) : '—', v.description || ''];
    }), { align: [null, 'center', null, null] }));
    if (config.dotenv !== false) {
      var text = vars.map(function (v) { return (v.description ? '# ' + v.description.replace(/`/g, '') + '\n' : '') + v.name + '=' + (v.secret ? '' : v.default !== undefined && !/\s/.test(String(v.default)) ? v.default : ''); }).join('\n\n');
      el.appendChild(h('details', 'wm-data', h('summary', null, '.env'), W.codeBlock(text, { lang: 'bash', title: '.env' })));
    }
  }
});
