/*
 * api — one HTTP endpoint: method, path, parameters, request and responses.
 * data:   { "method", "path", "summary"?, "params"?: [{ "name", "in", "type", "required"?, "description"? }],
 *           "request"?: { "example" }, "responses"?: [{ "status", "description", "example"? }] }
 * config: { "examples": true }
 */
WiMark.register('api', {
  title: 'API endpoint',
  description: 'Method and path, parameters table, request body and responses with examples.',
  example: {
    data: {
      method: 'POST', path: '/v1/pages/{section}', summary: 'Create a page in a section.',
      params: [
        { name: 'section', in: 'path', type: 'string', required: true, description: 'Section id' },
        { name: 'lang', in: 'query', type: 'string', description: 'Language code; default language when omitted' }
      ],
      request: { example: { path: 'notes/first.md', title: 'First page' } },
      responses: [
        { status: 201, description: 'Created', example: { path: 'en/notes/first.md' } },
        { status: 409, description: 'The page already exists' }
      ]
    },
    config: { examples: true }
  },
  mount: function (el, data, config) {
    var W = WiMark, h = W.h;
    var method = String(data.method || 'GET').toUpperCase();
    el.appendChild(h('div', 'wm-api-head', h('span', 'wm-api-method wm-api-' + method.toLowerCase(), method), h('code', 'wm-api-path', data.path || '/')));
    if (data.summary) el.appendChild(W.paras(data.summary));
    var params = W.list(data.params);
    if (params.length) {
      el.appendChild(h('div', 'wm-label wm-api-label', 'parameters'));
      el.appendChild(W.table(['name', 'in', 'type', 'description'], params.map(function (p) {
        return [h('span', null, h('code', null, p.name), p.required ? h('span', 'wm-api-req', ' required') : null), p.in || '', p.type || '', p.description || ''];
      })));
    }
    if (data.request && config.examples !== false) {
      el.appendChild(h('div', 'wm-label wm-api-label', 'request'));
      el.appendChild(W.codeBlock(JSON.stringify(data.request.example || data.request, null, 2), { lang: 'json', title: 'body' }));
    }
    var res = W.list(data.responses);
    if (res.length) {
      el.appendChild(h('div', 'wm-label wm-api-label', 'responses'));
      res.forEach(function (r) {
        var code = W.num(r.status), st = code < 300 ? 'pos' : code < 400 ? 'info' : code < 500 ? 'warn' : 'neg';
        el.appendChild(h('div', 'wm-api-res', h('span', 'wm-api-status wm-' + st, String(r.status)), h('span', null, W.inline(r.description || ''))));
        if (r.example !== undefined && config.examples !== false) el.appendChild(W.codeBlock(JSON.stringify(r.example, null, 2), { lang: 'json', title: String(r.status) }));
      });
    }
  }
});
