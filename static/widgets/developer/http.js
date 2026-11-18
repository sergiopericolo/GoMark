/*
 * http — an HTTP exchange: the request and its response, headers and body.
 * data:   { "request": { "method", "url", "headers"?: {}, "body"? }, "response": { "status", "headers"?: {}, "body"? } }
 * config: { "layout": "stacked" | "split" }
 */
WiMark.register('http', {
  title: 'HTTP exchange',
  description: 'A request and its response with headers and pretty-printed JSON bodies.',
  example: {
    data: {
      request: { method: 'POST', url: 'https://api.anthropic.com/v1/messages', headers: { 'content-type': 'application/json', 'x-api-key': '…' }, body: { model: '…', max_tokens: 4096 } },
      response: { status: '200 OK', headers: { 'content-type': 'application/json' }, body: { stop_reason: 'end_turn' } }
    },
    config: { layout: 'stacked' }
  },
  choices: { layout: ['stacked', 'split'] },
  mount: function (el, data, config) {
    var W = WiMark, h = W.h;
    function text(first, headers, body) {
      var out = [first];
      Object.keys(headers || {}).forEach(function (k) { out.push(k + ': ' + headers[k]); });
      if (body !== undefined) out.push('', typeof body === 'string' ? body : JSON.stringify(body, null, 2));
      return out.join('\n');
    }
    var rq = data.request || {}, rs = data.response || {};
    var a = W.codeBlock(text(String(rq.method || 'GET').toUpperCase() + ' ' + (rq.url || '/') + ' HTTP/1.1', rq.headers, rq.body), { lang: 'http', title: 'request' });
    var b = W.codeBlock(text('HTTP/1.1 ' + (rs.status || '200 OK'), rs.headers, rs.body), { lang: 'http', title: 'response' });
    el.appendChild(config.layout === 'split'
      ? h('div', { class: 'wm-split', style: { gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)' } }, h('div', 'wm-split-pane', a), h('div', 'wm-split-pane', b))
      : h('div', 'wm-http-stack', a, b));
  }
});
