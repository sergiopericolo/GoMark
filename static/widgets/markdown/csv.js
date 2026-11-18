/*
 * csv — paste CSV text, get a table (quoted fields, any delimiter).
 * data:   { "csv": "name,qty\n\"Rossi, A.\",3" } or the CSV string itself
 * config: { "delimiter": ",", "header": true, "zebra": true, "numbers": true }
 */
WiMark.register('csv', {
  title: 'CSV table',
  description: 'Paste CSV (quotes, any delimiter) and get a formatted table.',
  example: {
    data: { csv: 'city,country,population\nRoma,Italy,2749031\nMilano,Italy,1371498\n"Paris, centre",France,2102650\nBerlin,Germany,3878100' },
    config: { delimiter: ',', header: true, zebra: true, numbers: true }
  },
  mount: function (el, data, config) {
    var W = WiMark;
    var text = typeof data === 'string' ? data : String(data.csv || '');
    var d = String(config.delimiter || ',').charAt(0) === '\\' ? '\t' : String(config.delimiter || ',').charAt(0);
    var rows = [], row = [], field = '', q = false;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (q) {
        if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
        else if (ch === '"') q = false;
        else field += ch;
      } else if (ch === '"') q = true;
      else if (ch === d) { row.push(field); field = ''; }
      else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i + 1] === '\n') i++;
        row.push(field); rows.push(row); row = []; field = '';
      } else field += ch;
    }
    if (field || row.length) { row.push(field); rows.push(row); }
    rows = rows.filter(function (r) { return r.join('').trim(); });
    if (config.numbers !== false) rows = rows.map(function (r, ri) {
      return r.map(function (v) { return (ri > 0 || config.header === false) && /^-?\d+(\.\d+)?$/.test(v.trim()) ? parseFloat(v) : v; });
    });
    var head = config.header === false ? null : rows.shift();
    var t = W.tabular(head ? [head].concat(rows) : rows);
    el.appendChild(W.table(head ? t.cols.map(function (c) { return c.label; }) : null,
      t.rows.map(function (r) { return r.map(function (v, i) { return W.cell(v, t.cols[i]); }); }),
      { align: t.cols.map(function (c) { return c.align; }), cls: config.zebra !== false ? 'wm-zebra' : '' }));
  }
});
