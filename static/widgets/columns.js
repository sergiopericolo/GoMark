/*
 * columns — text side by side; "=== Title" lines start each column.
 *   ```wimark-columns {"widths": [1, 1]}
 *   === Iterative
 *   Text.
 *   === Recursive
 *   Text.
 *   ```
 */
WiMark.register('columns', {
  title: 'Columns',
  description: 'Two or more columns of text, each started by a "=== Title" line; stacks on phones.',
  input: 'text',
  example: { body: '=== Iterative\nA loop and a counter: $O(1)$ memory.\n\n- no stack growth\n- harder to read for trees\n=== Recursive\nThe call stack holds the state: $O(d)$ memory for depth $d$.\n\n- mirrors the definition\n- may overflow on deep input' },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var cols = W.sections(v.text), widths = W.list(v.widths);
    var grid = h('div', 'wm-columns');
    grid.style.gridTemplateColumns = cols.map(function (c, i) { return 'minmax(0, ' + W.num(widths[i], 1) + 'fr)'; }).join(' ');
    cols.forEach(function (c) {
      grid.appendChild(h('div', 'wm-column', c.title ? h('div', 'wm-column-title', W.inline(c.title)) : null, W.prose(c.text)));
    });
    el.appendChild(grid);
  }
});
