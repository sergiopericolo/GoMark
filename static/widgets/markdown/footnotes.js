/*
 * footnotes — text with [^key] references and the notes below, linked both ways.
 * data:   { "text": "A claim[^1].", "notes": { "1": "The source." } }
 * config: { "title": "Notes" }
 */
WiMark.register('footnotes', {
  title: 'Footnotes',
  description: 'Text with numbered references [^key] and back-linked notes.',
  example: {
    data: {
      text: 'A page missing in a language is still published[^fallback]. Depth counts path segments[^depth].\n\nNotes keep the body clean[^fallback].',
      notes: { fallback: 'With a notice that it comes from another language.', depth: '`a/b.md` has depth **2**.' }
    },
    config: { title: 'Notes' }
  },
  mount: function (el, data, config) {
    var W = WiMark, h = W.h;
    var id = W.uid('fn'), order = [], notes = data.notes || {};
    var body = h('div', 'wm-footnotes-body');
    String(data.text || '').split(/\n\s*\n/).forEach(function (para) {
      var p = h('p', 'wm-text'), rest = para, m;
      while ((m = /\[\^([^\]]+)\]/.exec(rest))) {
        p.appendChild(W.inline(rest.slice(0, m.index)));
        var key = m[1];
        if (order.indexOf(key) < 0) order.push(key);
        var n = order.indexOf(key) + 1;
        p.appendChild(h('sup', null, h('a', { href: '#' + id + '-' + n, id: id + '-r' + n + '-' + p.childNodes.length, class: 'wm-fn-ref' }, String(n))));
        rest = rest.slice(m.index + m[0].length);
      }
      p.appendChild(W.inline(rest));
      body.appendChild(p);
    });
    el.appendChild(body);
    if (!order.length) return;
    el.appendChild(h('section', 'wm-footnotes', h('div', 'wm-label', config.title || 'Notes'), h('ol', null, order.map(function (key, i) {
      var back = body.querySelector('a[href="#' + id + '-' + (i + 1) + '"]');
      return h('li', { id: id + '-' + (i + 1) }, h('span', 'wm-fn-n', (i + 1) + '.'), h('span', 'wm-text', W.inline(notes[key] || '?')),
        back ? h('a', { href: '#' + back.id, class: 'wm-fn-back', 'aria-label': 'back' }, '↩') : null);
    }))));
  }
});
