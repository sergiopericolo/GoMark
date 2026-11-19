/*
 * adr — an architecture decision record: context, decision, consequences.
 *   ```wimark-adr {"n": 7, "title": "Use SQLite", "status": "accepted", "date": "2026-03-02"}
 *   {"context": "…", "decision": "…", "consequences": ["…", "…"]}
 *   ```
 */
WiMark.register('adr', {
  title: 'Decision record',
  description: 'An architecture decision record (ADR) with status, context, decision and consequences.',
  example: { opts: { n: 12, title: 'Render widgets in the browser', status: 'accepted', date: '2026-06-10' }, body: { context: 'Pages must stay plain Markdown and build without Node.', decision: 'The Go build leaves `wimark-` fences as source blocks; a small runtime mounts them.', consequences: ['Pages without JavaScript show the block source', 'One runtime for site and catalog', 'Math is typeset by MathJax on demand'], supersedes: 'ADR 4' } },
  choices: { status: ['proposed', 'accepted', 'deprecated', 'superseded', 'rejected'] },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var st = { proposed: 'info', accepted: 'pos', deprecated: 'warn', superseded: 'warn', rejected: 'neg' }[v.status] || 'info';
    function part(label, body) {
      if (body === undefined || body === '') return null;
      return h('div', 'wm-adr-part', h('div', 'wm-label', label), Array.isArray(body) ? h('ul', 'wm-list', body.map(function (x) { return h('li', null, W.inline(x)); })) : W.prose(body));
    }
    el.appendChild(h('article', 'wm-box wm-adr',
      h('header', 'wm-adr-head', h('span', 'wm-adr-n', 'ADR ' + (v.n === undefined ? '' : v.n)), h('span', 'wm-adr-title', W.inline(v.title || '')),
        v.status ? h('span', 'wm-tag wm-' + st, h('span', { 'aria-hidden': 'true' }, W.icon(st) + ' '), v.status) : null,
        v.date ? h('time', { class: 'wm-muted', datetime: v.date }, W.fmtDate(v.date)) : null),
      part('Context', v.context), part('Decision', v.decision), part('Consequences', v.consequences),
      v.supersedes ? h('div', 'wm-muted wm-small', 'supersedes ', W.inline(v.supersedes)) : null));
  }
});
