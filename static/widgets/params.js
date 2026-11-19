/*
 * params — function or command parameters: name, type, description, default.
 *   ```wimark-params
 *   [["path", "string", "Site folder."], ["timeout?", "Duration", "Give up after this long.", "30s"]]
 *   ```
 *   A trailing ? marks an optional parameter.
 */
WiMark.register('params', {
  title: 'Parameters',
  description: 'Parameters as [name, type, description, default?]; "name?" is optional, everything else required.',
  example: { body: [['dir', 'string', 'Folder holding `gomark.toml`.'], ['lang?', 'string', 'Build only this language; empty builds all.', '""'], ['out?', 'string', 'Output folder.', '"dist"'], ['opts...', 'Option', 'Functional options, applied in order.']] },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var dl = h('dl', 'wm-params');
    W.rows(v.items, ['name', 'type', 'desc', 'def']).forEach(function (p) {
      var name = String(p.name), opt = /\?$/.test(name) || p.def !== undefined;
      dl.appendChild(h('div', 'wm-params-row',
        h('dt', null, h('code', 'wm-params-name', name.replace(/\?$/, '')), p.type ? h('code', 'wm-params-type', String(p.type)) : null,
          opt ? h('span', 'wm-muted wm-small', 'optional') : h('span', 'wm-req wm-small', 'required'),
          p.def !== undefined ? h('span', 'wm-small wm-muted', ' default ', h('code', null, String(p.def))) : null),
        h('dd', null, W.inline(p.desc || ''))));
    });
    el.appendChild(dl);
  }
});
