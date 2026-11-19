/*
 * signature — an API reference entry: signature, summary, params, returns, errors.
 *   ```wimark-signature {"sig": "func Open(dir string) (*Site, error)", "lang": "go"}
 *   {"summary": "…", "params": [["dir", "Folder holding gomark.toml."]], "returns": "…", "errors": ["…"], "since": "1.0"}
 *   ```
 */
WiMark.register('signature', {
  title: 'API reference',
  description: 'One function or method: highlighted signature, summary, parameters, return value, errors, since and an example.',
  example: { opts: { sig: 'func (s *Site) Build(lang, out string) ([]BuildStats, error)', lang: 'go', since: '1.0' }, body: { summary: 'Builds one language, or every language when `lang` is empty, into `out`.', params: [['lang', 'Language code; `""` builds all of them.'], ['out', 'Output folder; emptied first except `.git`, `CNAME`.']], returns: 'One `BuildStats` per language built.', errors: ['the folder cannot be cleaned', 'a page cannot be read'], example: 'stats, err := site.Build("", "dist")' } },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var box = h('section', 'wm-box wm-sig');
    box.appendChild(W.codeBlock(v.sig || '', { lang: v.lang, title: false, copy: false }));
    if (v.since || v.deprecated) box.appendChild(h('div', 'wm-row', v.since ? h('span', 'wm-tag', 'since ' + v.since) : null, v.deprecated ? h('span', 'wm-tag wm-warn', 'deprecated ' + v.deprecated) : null));
    if (v.summary) box.appendChild(W.prose(v.summary));
    var params = W.rows(v.params, ['name', 'desc']);
    if (params.length) box.appendChild(h('div', 'wm-sig-part', h('div', 'wm-label', 'parameters'), h('dl', 'wm-sig-dl', params.map(function (p) { return h('div', null, h('dt', null, h('code', null, p.name)), h('dd', null, W.inline(p.desc || ''))); }))));
    if (v.returns) box.appendChild(h('div', 'wm-sig-part', h('div', 'wm-label', 'returns'), W.prose(v.returns)));
    if (W.list(v.errors).length) box.appendChild(h('div', 'wm-sig-part', h('div', 'wm-label', 'errors'), h('ul', 'wm-list', W.list(v.errors).map(function (e) { return h('li', null, W.inline(e)); }))));
    if (v.example) box.appendChild(h('div', 'wm-sig-part', h('div', 'wm-label', 'example'), W.codeBlock(v.example, { lang: v.lang, title: false })));
    el.appendChild(box);
  }
});
