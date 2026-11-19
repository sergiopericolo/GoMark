/*
 * errors — an error code reference: code, HTTP status, meaning, what to do.
 *   ```wimark-errors
 *   [["E_NOT_FOUND", 404, "The site does not exist.", "Check the id."], ["E_BUSY", 409, "A build is running.", "Retry later."]]
 *   ```
 */
WiMark.register('errors', {
  title: 'Error codes',
  description: 'Error codes [code, status?, meaning, fix] with the HTTP status graded; searchable when long.',
  example: { body: [['site_not_found', 404, 'No site with this id.', 'List sites with `GET /v1/sites`.'], ['build_running', 409, 'A build of this site is in progress.', 'Wait for it or cancel it.'], ['invalid_wimark', 422, 'A page has a WiMark with invalid JSON.', 'The message names the page and the block.'], ['quota_exceeded', 429, 'Too many builds this hour.', 'Retry after the `Retry-After` seconds.'], ['internal', 500, 'Unexpected failure.', 'Report it with the request id.']] },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var rows = W.rows(v.items, ['code', 'status', 'meaning', 'fix']);
    W.grid(el, ['code', 'status', 'meaning', 'what to do'], rows.map(function (r) {
      var s = +r.status, st = !s ? '' : s < 300 ? 'pos' : s < 400 ? 'info' : s < 500 ? 'warn' : 'neg';
      return [h('code', null, r.code), s ? h('span', 'wm-tag wm-' + st, String(s)) : '', W.inline(r.meaning || ''), W.inline(r.fix || '')];
    }), { filter: rows.length > 8 });
  }
});
