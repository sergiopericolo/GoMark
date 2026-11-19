/*
 * http — a raw HTTP exchange: request and response, headers and JSON bodies.
 *   ```wimark-http
 *   GET /v1/users/7 HTTP/1.1
 *   Accept: application/json
 *
 *   HTTP/1.1 200 OK
 *   Content-Type: application/json
 *
 *   {"id": 7}
 *   ```
 */
WiMark.register('http', {
  title: 'HTTP exchange',
  description: 'A raw request and response (split at the "HTTP/" status line or by "===" sections); JSON bodies pretty-printed.',
  input: 'text',
  example: { body: 'POST /v1/sites/docs/build?dry=true HTTP/1.1\nAuthorization: Bearer ••••\nContent-Type: application/json\n\n{"clean": true}\n\nHTTP/1.1 202 Accepted\nContent-Type: application/json\nLocation: /v1/builds/913\n\n{"id": 913, "state": "queued"}' },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var parts = W.sections(v.text).filter(function (p) { return p.text; }).map(function (p) { return p.text; });
    if (parts.length < 2) {
      var t = String(v.text || ''), i = t.search(/^HTTP\/[\d.]+ \d{3}/m);
      parts = i > 0 ? [t.slice(0, i).trim(), t.slice(i).trim()] : [t.trim()];
    }
    parts.forEach(function (p) {
      var lines = p.split('\n'), start = lines.shift() || '', heads = [];
      while (lines.length && lines[0].trim()) heads.push(lines.shift());
      var body = lines.join('\n').trim(), isRes = /^HTTP\//.test(start);
      try { if (body) body = JSON.stringify(JSON.parse(body), null, 2); } catch (e) { /* not JSON: as written */ }
      var m = /^HTTP\/[\d.]+ (\d{3})/.exec(start), st = m ? (m[1] < 300 ? 'pos' : m[1] < 400 ? 'info' : m[1] < 500 ? 'warn' : 'neg') : '';
      var startEl = isRes ? h('div', 'wm-http-start', h('span', 'wm-tag wm-' + st, m ? m[1] : ''), ' ', start.replace(/^HTTP\/[\d.]+ \d{3}\s*/, '')) : h('div', 'wm-http-start', h('strong', null, start.split(' ')[0]), ' ', h('code', null, start.split(' ')[1] || ''));
      el.appendChild(h('div', 'wm-http wm-http-' + (isRes ? 'res' : 'req'), h('div', 'wm-label', isRes ? 'response' : 'request'), startEl,
        heads.length ? h('dl', 'wm-http-heads', heads.map(function (x) { var k = x.indexOf(':'); return h('div', null, h('dt', null, x.slice(0, k)), h('dd', null, x.slice(k + 1).trim())); })) : null,
        body ? W.codeBlock(body, { lang: /^[[{]/.test(body) ? 'json' : '', title: false }) : null));
    });
  }
});
