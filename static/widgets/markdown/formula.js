/*
 * formula — a display formula (LaTeX) with a number and a table of its symbols.
 * data:   { "tex", "label"?, "symbols"?: [{ "symbol", "meaning", "unit"? }] }
 * config: { "numbered": true, "number": 1 }
 */
WiMark.register('formula', {
  title: 'Formula',
  description: 'A numbered display equation (LaTeX via MathJax) with the meaning of its symbols.',
  example: {
    data: {
      tex: 'F = G \\frac{m_1 m_2}{r^2}', label: 'Newton’s law of gravitation',
      symbols: [
        { symbol: 'F', meaning: 'force between the masses', unit: 'N' },
        { symbol: 'G', meaning: 'gravitational constant', unit: 'N·m²/kg²' },
        { symbol: 'm_1, m_2', meaning: 'the two masses', unit: 'kg' },
        { symbol: 'r', meaning: 'distance between centres', unit: 'm' }
      ]
    },
    config: { numbered: true, number: 1 }
  },
  mount: function (el, data, config) {
    var W = WiMark, h = W.h;
    var eq = h('div', 'wm-formula-eq math', '\\[' + String(data.tex || '') + '\\]');
    el.appendChild(h('figure', 'wm-formula',
      h('div', 'wm-formula-row', eq, config.numbered !== false ? h('span', 'wm-formula-n', '(' + W.num(config.number, 1) + ')') : null),
      data.label ? h('figcaption', 'wm-muted', W.inline(data.label)) : null));
    var syms = W.list(data.symbols);
    if (syms.length) {
      el.appendChild(W.table(null, syms.map(function (s) {
        return [h('span', 'math', '\\(' + String(s.symbol || '') + '\\)'), W.inline(s.meaning || ''), s.unit || ''];
      }), { cls: 'wm-formula-symbols' }));
    }
    W.typeset(el);
  }
});
