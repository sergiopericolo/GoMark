/*
 * layers — a protocol or software stack, top to bottom, with notes.
 *   ```wimark-layers {"title": "TCP/IP"}
 *   [["Application", "HTTP, DNS"], ["Transport", "TCP, UDP"], ["Internet", "IP"], ["Link", "Ethernet"]]
 *   ```
 */
WiMark.register('layers', {
  title: 'Layer stack',
  description: 'A stack of layers, top to bottom: [name, examples, note?] — network models, software layers, abstraction levels.',
  example: { opts: { title: 'OSI model', mark: 'Transport' }, body: [['Application', 'HTTP, SMTP, DNS'], ['Presentation', 'TLS, encodings'], ['Session', 'sockets, RPC'], ['Transport', 'TCP, UDP, QUIC', 'ports, reliability'], ['Network', 'IPv4, IPv6, ICMP'], ['Data link', 'Ethernet, Wi-Fi'], ['Physical', 'copper, fiber, radio']] },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var rows = W.rows(v.items, ['name', 'what', 'note']), n = rows.length;
    if (v.title) el.appendChild(h('div', 'wm-box-title', W.inline(v.title)));
    el.appendChild(h('ol', 'wm-layers', rows.map(function (r, i) {
      return h('li', 'wm-layer' + (r.name === v.mark ? ' wm-layer-mark' : ''), h('span', 'wm-layer-n', String(v.numbers === false ? '' : n - i)), h('span', 'wm-layer-name', W.inline(r.name)),
        h('span', 'wm-layer-what', W.inline(r.what || '')), r.note ? h('span', 'wm-layer-note', W.inline(r.note)) : null);
    })));
  }
});
