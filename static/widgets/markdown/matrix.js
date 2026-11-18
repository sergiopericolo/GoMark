/*
 * matrix — a grid with row and column headers; numeric cells can be shaded.
 * data:   { "rows": ["r1", …], "columns": ["c1", …], "values": [[…], …] }
 * config: { "heat": true, "corner": "" }   (heat: shade numbers on the theme's sequential ramp)
 */
WiMark.register('matrix', {
  title: 'Matrix',
  description: 'Row × column grid (confusion, RACI, compatibility); numbers can be shaded.',
  example: {
    data: {
      rows: ['monochrome', 'bicolor', 'colored'],
      columns: ['tables', 'charts', 'diagrams', 'images'],
      values: [[10, 6, 9, 4], [10, 8, 9, 7], [10, 10, 10, 10]]
    },
    config: { heat: true, corner: 'class \\ use' }
  },
  mount: function (el, data, config) {
    var W = WiMark, h = W.h;
    var vals = W.list(data.values);
    var nums = [].concat.apply([], vals).filter(function (v) { return typeof v === 'number'; });
    var ext = W.extent(nums);
    var rows = W.list(data.rows).map(function (r, i) {
      return [r].concat(W.list(vals[i]).map(function (v) {
        if (config.heat !== false && typeof v === 'number') {
          var step = Math.min(4, Math.floor(((v - ext[0]) / (ext[1] - ext[0] || 1)) * 4.999));
          return h('span', { class: 'wm-heat-cell wm-h' + step + (step >= 3 ? ' wm-heat-dark' : '') }, W.fmt(v));
        }
        return W.cell(v);
      }));
    });
    el.appendChild(W.table([config.corner || ''].concat(W.list(data.columns)), rows,
      { rowHeader: true, cls: 'wm-matrix', align: [null].concat(W.list(data.columns).map(function () { return 'center'; })) }));
  }
});
