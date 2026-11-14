/*
 * GoMark — engine.js
 * Mounts ```widget-<name> blocks: loads the widget's dependencies, parses
 * { "data", "config" } (an empty block uses the widget's example) and calls
 * mount(div, data, config). Loads MathJax only when the page has math.
 */
(function (global) {
  'use strict';

  var PREFIX = 'language-widget-';

  function widgetName(code) {
    var m = new RegExp(PREFIX + '([\\w-]+)').exec(code.className);
    return m ? m[1].toLowerCase() : null;
  }

  function loadScript(url) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = url;
      s.async = true;
      s.onload = resolve;
      s.onerror = function () { reject(new Error('failed to load ' + url)); };
      document.head.appendChild(s);
    });
  }

  async function loadDependencies(def) {
    for (var dep of def.dependencies || []) {
      if (!global[dep.name]) await loadScript(dep.url);
    }
  }

  function payload(text, def) {
    if (!text.trim()) return def.example || {};
    try {
      var p = JSON.parse(text);
      return p && typeof p === 'object' ? p : {};
    } catch (e) {
      return {};
    }
  }

  async function typesetMath() {
    if (!document.querySelector('.math')) return;
    if (!(global.MathJax && global.MathJax.typesetPromise)) {
      global.MathJax = {
        tex: { inlineMath: [['\\(', '\\)']], displayMath: [['\\[', '\\]']] },
        options: { enableMenu: false },
        startup: { typeset: false }
      };
      await loadScript('https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js');
    }
    try { await global.MathJax.typesetPromise(); } catch (e) { console.error('[engine] MathJax:', e); }
  }

  async function boot() {
    var registry = global.Widgets;
    var blocks = Array.from(document.querySelectorAll('pre code[class*="' + PREFIX + '"]'))
      .map(function (code) { return { code: code, name: widgetName(code) }; })
      .filter(function (b) { return registry && registry.get(b.name); });

    var names = Array.from(new Set(blocks.map(function (b) { return b.name; })));
    await Promise.all(names.map(function (name) {
      return loadDependencies(registry.get(name)).catch(function (err) {
        console.error('[engine] dependency error for widget-' + name + ':', err);
      });
    }));

    blocks.forEach(function (b) {
      var def = registry.get(b.name);
      var p = payload(b.code.textContent, def);
      var host = document.createElement('div');
      host.className = 'widget widget-' + b.name;
      var pre = b.code.closest('pre') || b.code;
      pre.parentNode.replaceChild(host, pre);
      try {
        def.mount(host, p.data || {}, p.config || {});
      } catch (err) {
        host.textContent = '// widget-' + b.name + ' error: ' + err.message;
        console.error('[engine] widget-' + b.name + ':', err);
      }
    });

    await typesetMath();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window);
