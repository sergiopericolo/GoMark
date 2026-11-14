/*
 * GoMark — widgets.js
 * Widget registry and helpers:
 *   register(name, { dependencies, example, mount }), get(name), names()
 *   colors(), dom.h(tag, cls, text), hexToRgba(hex, a), clampPct(v, target)
 */
(function (global) {
  'use strict';

  function h(tag, cls, text) {
    var el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text !== undefined && text !== null) el.textContent = String(text);
    return el;
  }

  /* ─── Colors and numbers ──────────────────────────────────────────────── */
  function hexToRgba(hex, alpha) {
    var m = /^#?([0-9a-f]{6})$/i.exec(String(hex || ''));
    if (!m) return hex;
    var n = parseInt(m[1], 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + alpha + ')';
  }

  function clampPct(value, target) {
    if (!target) return 100;
    var pct = (Number(value) / Number(target)) * 100;
    if (!isFinite(pct)) return 0;
    return Math.max(0, Math.min(100, pct));
  }

  /* ─── Palette of the active theme ─────────────────────────────────────── */
  function colors() {
    var style = getComputedStyle(document.documentElement);
    var read = function (name, fallback) {
      var value = style.getPropertyValue(name).trim();
      return value || fallback;
    };
    return {
      ink:      read('--ink',       '#1F2125'),
      gray:     read('--gray',      '#4D576A'),
      graySoft: read('--gray-soft', '#6C7689'),
      surface:  read('--surface',   '#CED3DE'),
      bgAlt:    read('--bg-alt',    '#CED3DE'),
      line:     read('--line',      '#969FB0'),
      lineDash: read('--line-dash', '#969FB0')
    };
  }

  /* ─── Registry ────────────────────────────────────────────────────────── */
  var registry = {};

  var Widgets = {
    register: function (name, definition) {
      registry[name] = definition;
    },
    get: function (name) {
      return registry[name] || null;
    },
    names: function () {
      return Object.keys(registry);
    },
    colors: colors,
    dom: { h: h },
    hexToRgba: hexToRgba,
    clampPct: clampPct
  };

  global.Widgets = Widgets;
})(window);
