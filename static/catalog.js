/*
 * GoMark — catalog.js
 * The WiMark catalog: every widget grouped by class, live, each with an
 * editor (a form for its config, the full JSON, copy as Markdown) and a theme
 * switch to check that nothing breaks across monochrome, bicolor and colored.
 */
(function (global) {
  'use strict';

  var W = global.WiMark, h = W.h;
  var C = global.WIMARK_CATALOG || { classes: [], themes: [] };
  // ?theme=<name> picks the theme, ?class=<name> shows one class only.
  var params = new URLSearchParams(location.search);
  if (params.get('class')) C.classes = C.classes.filter(function (c) { return c.name === params.get('class'); });

  function store(key, value) {
    try {
      if (value === undefined) return localStorage.getItem('wimark-catalog:' + key);
      localStorage.setItem('wimark-catalog:' + key, value);
    } catch (e) { return null; }
    return value;
  }

  /* ─── Theme switch ──────────────────────────────────────────────────── */
  function initThemes() {
    var select = document.getElementById('cat-theme');
    var link = document.getElementById('cat-theme-css');
    var groups = {};
    C.themes.forEach(function (t) {
      var cls = t.class || 'other';
      if (!groups[cls]) { groups[cls] = h('optgroup', { label: cls }); select.appendChild(groups[cls]); }
      groups[cls].appendChild(h('option', { value: t.name }, t.name));
    });
    function apply(name) {
      var t = C.themes.filter(function (x) { return x.name === name; })[0];
      if (!t) return;
      select.value = name;
      link.href = 'static/themes/' + name + '.css';
      document.body.dataset.theme = name;
      document.body.dataset.themeClass = t.class;
      // Canvas widgets read the theme when they draw: remount them on change.
      link.onload = function () { remountCanvas(); };
    }
    select.addEventListener('change', function () { store('theme', select.value); apply(select.value); });
    apply(params.get('theme') || store('theme') || C.theme);
  }

  /* ─── Editor ────────────────────────────────────────────────────────── */
  var items = [];

  function markdown(name, payload) {
    return '```widget-' + name + '\n' + JSON.stringify(payload, null, 2) + '\n```';
  }

  // field builds one form control for config[key], from its example value.
  function field(item, key, choices) {
    var value = item.payload.config[key];
    var id = W.uid('cfg');
    var input;
    if (choices) {
      input = h('select', { id: id, class: 'wm-input' }, choices.map(function (c) { return h('option', { value: String(c) }, String(c)); }));
      input.value = String(value);
    } else if (typeof value === 'boolean') {
      input = h('input', { id: id, type: 'checkbox', checked: value });
    } else if (typeof value === 'number') {
      input = h('input', { id: id, type: 'number', class: 'wm-input', value: String(value), step: 'any' });
    } else if (typeof value === 'string') {
      input = h('input', { id: id, type: 'text', class: 'wm-input', value: value });
    } else return null;
    input.addEventListener(input.type === 'checkbox' || input.tagName === 'SELECT' ? 'change' : 'input', function () {
      var v = input.type === 'checkbox' ? input.checked : input.type === 'number' ? parseFloat(input.value) : input.value;
      if (choices && typeof value === 'number') v = parseFloat(v);
      if (input.type === 'number' && !isFinite(v)) return;
      item.payload.config[key] = v;
      item.json.value = JSON.stringify(item.payload, null, 2);
      render(item);
    });
    return h('label', { class: 'cat-field', for: id }, h('span', 'cat-field-key', key), input);
  }

  function buildForm(item) {
    item.form.textContent = '';
    var def = W.get(item.name), choices = def.choices || {};
    var keys = Object.keys(item.payload.config || {});
    keys.forEach(function (k) {
      var f = field(item, k, choices[k]);
      if (f) item.form.appendChild(f);
    });
    item.form.hidden = !item.form.children.length;
  }

  function render(item) {
    var ok = W.mount(item.host, item.name, JSON.parse(JSON.stringify(item.payload)));
    item.error.textContent = ok ? '' : 'the widget reported an error — see the preview';
    if (item.host.querySelector('.math, .wm-formula')) W.typeset(item.host);
  }

  function makeItem(w) {
    var def = W.get(w.name);
    var art = h('article', { class: 'cat-item', id: 'wm-' + w.name });
    if (!def) {
      art.appendChild(h('div', 'wm-error', w.name + ': the script did not register a widget named "' + w.name + '"'));
      return { el: art, name: w.name, text: w.name };
    }
    var example = def.example || { data: {}, config: {} };
    var item = {
      name: w.name, el: art,
      text: (w.name + ' ' + (def.title || '') + ' ' + (def.description || '')).toLowerCase(),
      payload: JSON.parse(JSON.stringify({ data: example.data === undefined ? {} : example.data, config: example.config || {} })),
      host: h('div', 'widget wm wm-w-' + w.name),
      form: h('div', 'cat-form'),
      json: h('textarea', { class: 'wm-input cat-json', spellcheck: 'false', rows: '12', 'aria-label': w.name + ' JSON' }),
      error: h('div', { class: 'cat-error', role: 'status' }),
      canvas: false
    };
    item.json.value = JSON.stringify(item.payload, null, 2);
    var timer;
    item.json.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        try {
          var p = JSON.parse(item.json.value);
          if (!p || typeof p !== 'object') throw new Error('the payload must be a JSON object');
          item.payload = { data: p.data === undefined ? {} : p.data, config: p.config || {} };
          buildForm(item);
          render(item);
        } catch (e) { item.error.textContent = e.message; }
      }, 300);
    });
    var copy = h('button', { type: 'button', class: 'wm-btn' }, 'copy markdown');
    copy.addEventListener('click', function () { W.copy(markdown(item.name, item.payload), copy); });
    var reset = h('button', { type: 'button', class: 'wm-btn' }, 'reset');
    reset.addEventListener('click', function () {
      item.payload = JSON.parse(JSON.stringify({ data: example.data === undefined ? {} : example.data, config: example.config || {} }));
      item.json.value = JSON.stringify(item.payload, null, 2);
      buildForm(item);
      render(item);
    });

    art.appendChild(h('header', 'cat-item-head',
      h('div', 'cat-item-name', h('code', null, 'widget-' + w.name), h('span', 'wm-tag', w.class), w.site ? h('span', 'wm-tag', 'site') : null),
      h('div', 'cat-item-title', def.title || w.name),
      def.description ? h('p', 'cat-item-desc', def.description) : null));
    art.appendChild(h('div', 'cat-preview page-body', item.host));
    art.appendChild(h('details', 'cat-edit', h('summary', null, 'edit'),
      item.form, item.json, h('div', 'wm-row', copy, reset, h('span', 'wm-muted wm-small', 'static/' + w.path)), item.error));
    buildForm(item);
    items.push(item);
    return item;
  }

  function remountCanvas() {
    items.forEach(function (item) { if (item.host && item.host.querySelector('canvas')) render(item); });
  }

  /* ─── Page ──────────────────────────────────────────────────────────── */
  function init() {
    initThemes();
    var nav = document.getElementById('cat-nav'), list = document.getElementById('cat-list');
    var total = 0;
    var all = [];
    C.classes.forEach(function (cls) {
      var links = h('ul');
      nav.appendChild(h('div', 'cat-nav-group', h('div', 'wm-label', cls.title + ' · ' + cls.widgets.length), links));
      var section = h('section', { class: 'cat-class', id: 'class-' + cls.name },
        h('h2', 'cat-class-title', cls.title, h('span', 'wm-muted', ' ' + cls.widgets.length)));
      list.appendChild(section);
      cls.widgets.forEach(function (w) {
        var item = makeItem(w);
        item.link = h('li', null, h('a', { href: '#wm-' + w.name }, w.name));
        item.section = section;
        links.appendChild(item.link);
        section.appendChild(item.el);
        all.push(item);
        total++;
      });
    });
    var count = document.getElementById('cat-count');
    count.textContent = total + ' widgets';

    // Mount in order, after each widget's dependencies.
    all.reduce(function (p, item) {
      return item.payload ? p.then(function () { return W.load(item.name).catch(function () {}); }).then(function () { render(item); }) : p;
    }, Promise.resolve());

    var search = document.getElementById('cat-search');
    search.addEventListener('input', function () {
      var q = search.value.trim().toLowerCase(), shown = 0;
      all.forEach(function (item) {
        var hit = !q || item.text.indexOf(q) >= 0;
        item.el.hidden = !hit;
        if (item.link) item.link.hidden = !hit;
        if (hit) shown++;
      });
      document.querySelectorAll('.cat-class').forEach(function (s) {
        s.hidden = !s.querySelector('.cat-item:not([hidden])');
      });
      count.textContent = q ? shown + ' / ' + total + ' widgets' : total + ' widgets';
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window);
