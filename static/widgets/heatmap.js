/*
 * heatmap — a matrix of numbers shaded light to dark, with the values.
 *   ```wimark-heatmap {"rows": ["a", "b"], "cols": ["x", "y", "z"]}
 *   [[1, 2, 3], [4, 5, 6]]
 *   ```
 */
WiMark.register('heatmap', {
  title: 'Heatmap',
  description: 'Rows × columns of numbers shaded in one hue (5 steps) with values: confusion matrices, correlations, latency grids.',
  example: { opts: { rows: ['cat', 'dog', 'fox'], cols: ['cat', 'dog', 'fox'], title: 'Confusion matrix (predicted →)' }, body: [[48, 2, 0], [5, 41, 4], [1, 6, 43]] },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var M = W.list(v.items).map(W.list), rows = W.list(v.rows), cols = W.list(v.cols);
    var vals = [].concat.apply([], M).map(Number).filter(isFinite), ext = W.extent(vals);
    if (v.title) el.appendChild(h('div', 'wm-box-title', W.inline(v.title)));
    var tbl = h('table', 'wm-heatmap');
    tbl.appendChild(h('thead', null, h('tr', null, h('th'), M[0].map(function (_, j) { return h('th', { scope: 'col' }, cols[j] === undefined ? String(j) : String(cols[j])); }))));
    var body = h('tbody');
    M.forEach(function (r, i) {
      body.appendChild(h('tr', null, h('th', { scope: 'row' }, rows[i] === undefined ? String(i) : String(rows[i])), r.map(function (x, j) {
        var step = Math.min(4, Math.floor(((x - ext[0]) / (ext[1] - ext[0] || 1)) * 5));
        return h('td', { class: 'wm-heat wm-h' + step + (step >= 3 ? ' wm-heat-dark' : ''), 'data-tip': (rows[i] || i) + ' × ' + (cols[j] || j) + ': ' + W.fmt(x) }, W.fmt(x));
      })));
    });
    tbl.appendChild(body);
    el.appendChild(h('div', 'wm-table-wrap wm-heatmap-wrap', tbl));
    el.appendChild(h('div', 'wm-heat-scale', h('span', null, W.fmt(ext[0])), [0, 1, 2, 3, 4].map(function (s) { return h('span', 'wm-heat wm-h' + s); }), h('span', null, W.fmt(ext[1]))));
  }
});
