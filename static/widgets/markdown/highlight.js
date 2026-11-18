/*
 * highlight — a passage with ==marked== words, as with a highlighter.
 * data:   { "text": "Plain and ==marked== words." }
 * config: { "style": "marker" | "underline" | "box", "block": true }
 */
WiMark.register('highlight', {
  title: 'Highlighted text',
  description: 'Text with ==marked== passages (marker, underline or box), Markdown has no mark.',
  example: {
    data: { text: 'GoMark never decides colors in JavaScript: ==the theme decides==, so a widget stays ==readable in every theme class==.' },
    config: { style: 'marker', block: true }
  },
  choices: { style: ['marker', 'underline', 'box'] },
  mount: function (el, data, config) {
    var W = WiMark, h = W.h;
    var p = h(config.block === false ? 'span' : 'p', 'wm-text wm-highlight wm-highlight-' + (config.style || 'marker'));
    String(data.text || (typeof data === 'string' ? data : '')).split(/(==[^=]+==)/).forEach(function (part) {
      if (/^==[^=]+==$/.test(part)) p.appendChild(h('mark', null, W.inline(part.slice(2, -2))));
      else if (part) p.appendChild(W.inline(part));
    });
    el.appendChild(p);
  }
});
