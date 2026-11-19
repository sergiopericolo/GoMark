/*
 * endpoint — an HTTP API endpoint: method, path, parameters, body, responses.
 *   ```wimark-endpoint {"method": "GET", "path": "/users/{id}", "auth": "bearer"}
 *   {"params": [["id", "path", "int", "User id"]], "responses": {"200": {"id": 1}, "404": "not found"}}
 *   ```
 */
WiMark.register('endpoint', {
  title: 'API endpoint',
  description: 'Method and path, summary, auth, parameters [name, in, type, description], request body and example responses.',
  example: { opts: { method: 'POST', path: '/v1/sites/{site}/build', auth: 'bearer', summary: 'Build a site and return the report.' }, body: { params: [['site', 'path', 'string', 'Site id'], ['lang', 'query', 'string?', 'Only this language'], ['dry', 'query', 'bool?', 'Check without writing']], body: { clean: true, out: 'dist' }, responses: { 200: { pages: 42, images: 18, warnings: [] }, 404: { error: 'site not found' }, 409: { error: 'a build is running' } } } },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var method = String(v.method || 'GET').toUpperCase();
    var path = h('code', 'wm-ep-path');
    String(v.path || '/').split(/(\{[^}]+\})/).forEach(function (p) { path.appendChild(/^\{/.test(p) ? h('span', 'wm-ep-var', p) : document.createTextNode(p)); });
    var box = h('section', 'wm-box wm-ep', h('header', 'wm-ep-head', h('span', 'wm-ep-method wm-ep-' + method.toLowerCase(), method), path,
      v.auth ? h('span', 'wm-tag', 'auth: ' + v.auth) : null));
    if (v.summary) box.appendChild(h('p', 'wm-text', W.inline(v.summary)));
    var params = W.rows(v.params, ['name', 'in', 'type', 'desc']);
    if (params.length) {
      box.appendChild(h('div', 'wm-label', 'parameters'));
      box.appendChild(W.table(['name', 'in', 'type', ''], params.map(function (p) {
        var opt = /\?$/.test(p.type || '') || /\?$/.test(p.name);
        return [h('code', null, String(p.name).replace(/\?$/, '')), p.in || '', h('span', null, h('code', null, String(p.type || '').replace(/\?$/, '')), opt ? h('span', 'wm-muted', ' optional') : h('span', 'wm-req', ' required')), W.inline(p.desc || '')];
      })));
    }
    if (v.body !== undefined) {
      box.appendChild(h('div', 'wm-label', 'request body'));
      box.appendChild(W.codeBlock(typeof v.body === 'string' ? v.body : JSON.stringify(v.body, null, 2), { lang: 'json', title: false }));
    }
    var res = v.responses || {};
    if (Object.keys(res).length) {
      box.appendChild(h('div', 'wm-label', 'responses'));
      Object.keys(res).forEach(function (code) {
        var st = code < 300 ? 'pos' : code < 400 ? 'info' : code < 500 ? 'warn' : 'neg', r = res[code];
        box.appendChild(h('details', 'wm-ep-res', h('summary', null, h('span', 'wm-tag wm-' + st, code)),
          W.codeBlock(typeof r === 'string' ? r : JSON.stringify(r, null, 2), { lang: typeof r === 'string' ? '' : 'json', title: false })));
      });
    }
    el.appendChild(box);
  }
});
