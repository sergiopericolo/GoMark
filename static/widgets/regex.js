/*
 * regex — a regular expression tested live against sample lines.
 *   ```wimark-regex {"pattern": "(\\d{4})-(\\d{2})-(\\d{2})", "flags": "g"}
 *   released 2026-11-19
 *   no date here
 *   ```
 */
WiMark.register('regex', {
  title: 'Regex tester',
  description: 'An editable pattern with flags; matches highlighted in each sample line, capture groups listed.',
  input: 'text',
  example: { opts: { pattern: '(?<key>[a-z_]+)\\s*=\\s*"(?<value>[^"]*)"', flags: 'g' }, body: 'title = "Docs"\ntheme = "duo"\nmax_depth = 2\n# comment = "ignored?"' },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var pat = h('input', { class: 'wm-input wm-regex-pat', value: v.pattern || '', 'aria-label': 'pattern', spellcheck: 'false' });
    var fl = h('input', { class: 'wm-input wm-regex-flags', value: v.flags || 'g', 'aria-label': 'flags', spellcheck: 'false' });
    var out = h('div', 'wm-regex-out'), err = h('div', { class: 'wm-muted wm-small', role: 'status' });
    var samples = W.lines(v.text);
    function run() {
      out.textContent = ''; err.textContent = '';
      var re;
      try { re = new RegExp(pat.value, fl.value.indexOf('g') < 0 ? fl.value + 'g' : fl.value); } catch (e) { err.textContent = e.message; return; }
      samples.forEach(function (s) {
        var line = h('div', 'wm-regex-line'), last = 0, groups = [], m, n = 0;
        re.lastIndex = 0;
        while ((m = re.exec(s)) && n++ < 200) {
          if (m.index > last) line.appendChild(document.createTextNode(s.slice(last, m.index)));
          line.appendChild(h('mark', { class: 'wm-regex-hit', 'data-tip': 'match at ' + m.index }, m[0] || '∅'));
          last = m.index + m[0].length;
          if (m.length > 1) groups.push(m.slice(1).map(function (g, i) { var name = m.groups && Object.keys(m.groups).filter(function (k) { return m.groups[k] === g; })[0]; return (name || '$' + (i + 1)) + ' = ' + JSON.stringify(g === undefined ? null : g); }).join(', '));
          if (!m[0]) re.lastIndex++;
        }
        if (last < s.length) line.appendChild(document.createTextNode(s.slice(last)));
        out.appendChild(h('div', 'wm-regex-sample' + (n ? ' wm-regex-yes' : ' wm-regex-no'), h('span', { class: 'wm-regex-mark', 'aria-label': n ? 'matches' : 'no match' }, n ? '✓' : '✕'), line,
          groups.length ? h('div', 'wm-regex-groups', groups.join(' · ')) : null));
      });
    }
    pat.addEventListener('input', run);
    fl.addEventListener('input', run);
    el.appendChild(h('div', 'wm-regex-bar', h('span', 'wm-muted', '/'), pat, h('span', 'wm-muted', '/'), fl));
    el.appendChild(err);
    el.appendChild(out);
    run();
  }
});
