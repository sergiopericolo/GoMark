/*
 * query — a SQL query and its result table.
 *   ```wimark-query {"db": "postgres"}
 *   === sql
 *   SELECT lang, count(*) FROM pages GROUP BY lang;
 *   === result
 *   lang,count
 *   en,42
 *   it,39
 *   ```
 */
WiMark.register('query', {
  title: 'SQL query',
  description: 'A query ("=== sql") and its result as CSV ("=== result"), with the row count and timing.',
  input: 'text',
  example: { opts: { db: 'sqlite', time: '1.8 ms' }, body: '=== sql\nSELECT s.name, count(p.id) AS pages, max(b.started_at) AS last_build\nFROM sites s\nJOIN pages p ON p.site_id = s.id\nLEFT JOIN builds b ON b.site_id = s.id\nGROUP BY s.id\nORDER BY pages DESC;\n=== result\nname,pages,last_build\ndocs,42,2026-11-19 10:02\nblog,17,2026-11-12 18:40\nnotes,6,' },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var parts = W.sections(v.text), sql = parts.filter(function (p) { return /sql|query/i.test(p.title); })[0] || parts[0], res = parts.filter(function (p) { return /result|output/i.test(p.title); })[0];
    el.appendChild(W.codeBlock(sql ? sql.text : '', { lang: 'sql', title: v.db || 'sql' }));
    if (!res) return;
    var rows = W.parseCSV(res.text), head = rows.shift() || [];
    W.grid(el, head, rows, { sort: true });
    el.appendChild(h('p', 'wm-muted wm-small', rows.length + (rows.length === 1 ? ' row' : ' rows') + (v.time ? ' · ' + v.time : '')));
  }
});
