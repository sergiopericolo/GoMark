/*
 * GoMark — engine.js
 * Mounts ```widget-<name> blocks: loads the widget's dependencies, parses
 * { "data", "config" } (an empty block uses the widget's example) and calls
 * WiMark.mount. Typesets math only when the page has some.
 */
(function (global) {
  'use strict';

  var PREFIX = 'language-widget-';

  function widgetName(code) {
    var m = new RegExp(PREFIX + '([\\w-]+)').exec(code.className);
    return m ? m[1].toLowerCase() : null;
  }

  // payload returns the block's JSON, the example when empty, or an Error.
  function payload(text, def) {
    if (!text.trim()) return def.example || {};
    try {
      var p = JSON.parse(text);
      return p && typeof p === 'object' ? p : new Error('the block must hold a JSON object');
    } catch (e) {
      return new Error('invalid JSON: ' + e.message);
    }
  }

  async function boot() {
    var W = global.WiMark;
    var blocks = Array.from(document.querySelectorAll('pre code[class*="' + PREFIX + '"]'))
      .map(function (code) { return { code: code, name: widgetName(code) }; })
      .filter(function (b) { return W && W.get(b.name); });

    var names = Array.from(new Set(blocks.map(function (b) { return b.name; })));
    await Promise.all(names.map(function (name) {
      return W.load(name).catch(function (err) { console.error('[engine] widget-' + name + ':', err); });
    }));

    blocks.forEach(function (b) {
      var p = payload(b.code.textContent, W.get(b.name));
      var host = document.createElement('div');
      var pre = b.code.closest('pre') || b.code;
      pre.parentNode.replaceChild(host, pre);
      if (p instanceof Error) {
        host.className = 'widget wm wm-w-' + b.name;
        host.appendChild(W.h('div', 'wm-error', '// widget-' + b.name + ': ' + p.message));
        return;
      }
      W.mount(host, b.name, p);
    });

    if (document.querySelector('.math')) await W.typeset();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window);
