/*
 * regex — a regular expression tester: matches highlighted, groups listed.
 * data:   { "pattern", "flags"?: "g", "tests": ["text", …] }
 * config: { "editable": true }
 */
WiMark.register('regex', {
  title: 'Regex tester',
  description: 'Edit a pattern and see matches highlighted in test strings, with capture groups.',
  example: {
    data: { pattern: '(\\w+)/(\\w+)\\.md', flags: 'g', tests: ['en/notes/first.md', 'it/notes/go/basics.md and en/about/cv.md', 'gomark.toml'] },
    config: { editable: true }
  },
  mount: function (el, data, config) {
    var W = WiMark, h = W.h;
    var pat = h('input', { class: 'wm-input wm-regex-pattern', value: data.pattern || '', 'aria-label': 'pattern', readOnly: config.editable === false });
    var flags = h('input', { class: 'wm-input wm-regex-flags', value: data.flags === undefined ? 'g' : data.flags, 'aria-label': 'flags', readOnly: config.editable === false });
    var out = h('div', 'wm-regex-out'), status = h('div', 'wm-muted wm-small');
    function run() {
      out.textContent = '';
      var re;
      try { re = new RegExp(pat.value, flags.value.indexOf('g') < 0 ? flags.value + 'g' : flags.value); status.textContent = ''; }
      catch (e) { status.textContent = '✕ ' + e.message; return; }
      var total = 0;
      W.list(data.tests).forEach(function (s) {
        s = String(s);
        var line = h('div', 'wm-regex-test'), last = 0, groups = [], m, guard = 0;
        re.lastIndex = 0;
        while ((m = re.exec(s)) && guard++ < 500) {
          if (m[0] === '') { re.lastIndex++; continue; }
          line.appendChild(document.createTextNode(s.slice(last, m.index)));
          line.appendChild(h('mark', 'wm-regex-match', m[0]));
          last = m.index + m[0].length;
          total++;
          if (m.length > 1) groups.push(m.slice(1).map(function (g, i) { return '$' + (i + 1) + '=' + (g === undefined ? '∅' : g); }).join('  '));
        }
        line.appendChild(document.createTextNode(s.slice(last)));
        out.appendChild(h('div', 'wm-regex-row', h('span', { class: 'wm-regex-mark', 'aria-hidden': 'true' }, last ? '✓' : '·'), h('div', null, line,
          groups.length ? h('div', 'wm-muted wm-small', groups.join('   ')) : null)));
      });
      status.textContent = total + ' match' + (total === 1 ? '' : 'es');
    }
    pat.addEventListener('input', run);
    flags.addEventListener('input', run);
    el.appendChild(h('div', 'wm-regex', h('div', 'wm-regex-bar', h('span', 'wm-muted', '/'), pat, h('span', 'wm-muted', '/'), flags), out, status));
    run();
  }
});
