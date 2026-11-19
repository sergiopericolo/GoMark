/*
 * complexity — algorithms with their time and space bounds in O-notation.
 *   ```wimark-complexity {"cols": ["best", "average", "worst", "space"]}
 *   [["Quicksort", "n log n", "n log n", "n^2", "log n"], ["Merge sort", "n log n", "n log n", "n log n", "n"]]
 *   ```
 */
WiMark.register('complexity', {
  title: 'Complexity table',
  description: 'Algorithms against bounds in O-notation; each bound is graded from constant to exponential.',
  example: { opts: { cols: ['best', 'average', 'worst', 'space'] }, body: [['Quicksort', 'n log n', 'n log n', 'n^2', 'log n'], ['Merge sort', 'n log n', 'n log n', 'n log n', 'n'], ['Heapsort', 'n log n', 'n log n', 'n log n', '1'], ['Insertion sort', 'n', 'n^2', 'n^2', '1'], ['Binary search', '1', 'log n', 'log n', '1']] },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var cols = W.list(v.cols).length ? W.list(v.cols) : ['average', 'worst', 'space'];
    function grade(s) {
      s = String(s).replace(/\s+/g, '');
      if (/\^n|!|n\^n|2\^/.test(s)) return 'neg';
      if (/n\^[2-9]|n\*n|n²|n³/.test(s)) return 'warn';
      if (/^(1|logn|log\(n\)|α\(n\)|loglogn)$/.test(s)) return 'pos';
      return 'info';
    }
    var tex = function (s) { return 'O(' + String(s).replace(/\blog\b/g, '\\log ').replace(/\bsqrt\(([^)]+)\)/g, '\\sqrt{$1}') + ')'; };
    var rows = W.list(v.items).map(function (r) {
      r = W.list(r);
      return [W.inline(r[0])].concat(cols.map(function (c, i) {
        var b = r[i + 1];
        if (b === undefined || b === null || b === '') return '';
        return h('span', 'wm-bound wm-' + grade(b), W.tex(tex(b)));
      }));
    });
    el.appendChild(W.table(['algorithm'].concat(cols), rows, { align: ['left'].concat(cols.map(function () { return 'center'; })) }));
  }
});
