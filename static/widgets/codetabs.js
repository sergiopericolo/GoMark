/*
 * codetabs — the same thing in several languages or files, in tabs.
 *   ```wimark-codetabs
 *   === Go
 *   fmt.Println("hi")
 *   === Python
 *   print("hi")
 *   ```
 *   The title picks the language: a language name, or a file name ("main.rs").
 */
WiMark.register('codetabs', {
  title: 'Code tabs',
  description: 'Code blocks in tabs, one per "=== Language" or "=== file.ext" section; the choice is remembered.',
  input: 'text',
  example: { body: '=== Go\nsite, err := engine.Open("docs")\nif err != nil {\n\treturn err\n}\n=== Shell\ngomark build -site docs\n=== gomark.toml\n[site]\ntitle = "Docs"\ntheme = "duo"' },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var LANG = { go: 'go', golang: 'go', python: 'python', py: 'python', javascript: 'javascript', js: 'javascript', typescript: 'typescript', ts: 'typescript', rust: 'rust', rs: 'rust', shell: 'bash', bash: 'bash', sh: 'bash', zsh: 'bash', c: 'c', 'c++': 'cpp', cpp: 'cpp', java: 'java', kotlin: 'kotlin', swift: 'swift', ruby: 'ruby', rb: 'ruby', sql: 'sql', toml: 'ini', yaml: 'yaml', yml: 'yaml', json: 'json', html: 'xml', css: 'css', haskell: 'haskell', hs: 'haskell', julia: 'julia', r: 'r', matlab: 'matlab', latex: 'latex', tex: 'latex' };
    var panes = W.sections(v.text);
    var key = 'codetabs:' + panes.map(function (p) { return p.title; }).join('|');
    var bar = h('div', { class: 'wm-tabs-bar wm-code-tabs', role: 'tablist' }), body = h('div');
    var btns = panes.map(function (p, i) {
      var b = h('button', { type: 'button', role: 'tab', class: 'wm-tab' }, p.title || String(i + 1));
      b.addEventListener('click', function () { show(i); W.store(key, i); });
      bar.appendChild(b);
      return b;
    });
    function show(i) {
      btns.forEach(function (b, k) { b.setAttribute('aria-selected', String(k === i)); });
      var p = panes[i], t = String(p.title || '').toLowerCase(), ext = t.indexOf('.') >= 0 ? t.split('.').pop() : t;
      body.textContent = '';
      body.appendChild(W.codeBlock(p.text, { lang: LANG[t] || LANG[ext] || '', title: false }));
    }
    el.appendChild(h('div', 'wm-codetabs', bar, body));
    show(Math.min(panes.length - 1, W.store(key) || 0));
  }
});
