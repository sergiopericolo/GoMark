/*
 * deps — dependencies with version, license and purpose.
 *   ```wimark-deps
 *   [["github.com/yuin/goldmark", "v1.7.8", "MIT", "Markdown"], ["github.com/BurntSushi/toml", "v1.6.0", "MIT", "config"]]
 *   ```
 */
WiMark.register('deps', {
  title: 'Dependencies',
  description: 'Dependencies [name, version, license, purpose, url?] with a count by license.',
  example: { body: [['github.com/yuin/goldmark', 'v1.7.8', 'MIT', 'Markdown parser and renderer'], ['github.com/BurntSushi/toml', 'v1.6.0', 'MIT', 'gomark.toml'], ['highlight.js', '11.9.0', 'BSD-3-Clause', 'code highlighting (CDN)'], ['MathJax', '3', 'Apache-2.0', 'math typesetting (CDN, on demand)']] },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var rows = W.rows(v.items, ['name', 'version', 'license', 'why', 'url']), lic = {};
    rows.forEach(function (r) { lic[r.license || '?'] = (lic[r.license || '?'] || 0) + 1; });
    el.appendChild(W.table(['package', 'version', 'license', ''], rows.map(function (r) {
      return [W.url(r.url) ? h('a', { href: W.url(r.url) }, h('code', null, r.name)) : h('code', null, r.name), h('code', null, r.version || ''), h('span', 'wm-tag', r.license || '?'), W.inline(r.why || '')];
    })));
    el.appendChild(h('p', 'wm-muted wm-small', rows.length + ' dependencies · ' + Object.keys(lic).map(function (k) { return k + ' ' + lic[k]; }).join(' · ')));
  }
});
