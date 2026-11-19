/*
 * table — a compact table: the first row is the header unless "head" is set.
 *   ```wimark-table {"align": "lrr", "caption": "Results", "sort": true, "filter": true, "total": true}
 *   [["op", "ns/op", "B/op"], ["parse", 1200, 320], ["render", 3400, 1024]]
 *   ```
 */
WiMark.register('table', {
  title: 'Table',
  description: 'A table from rows of JSON: alignment (l c r per column), caption, sorting, filtering, a totals row.',
  example: { opts: { align: 'lrrc', caption: 'Sorting 10⁶ integers', sort: true }, body: [['algorithm', 'time (ms)', 'memory (MB)', 'stable'], ['merge sort', 92, 7.6, true], ['quicksort', 61, 0.1, false], ['heapsort', 140, 0.0, false], ['timsort', 70, 3.8, true]] },
  mount: function (el, v) {
    var W = WiMark;
    var rows = W.list(v.items).map(W.list), head = v.head ? W.list(v.head) : rows.shift() || [];
    W.grid(el, head, rows, { caption: v.caption, align: W.aligns(v.align), sort: v.sort, filter: v.filter, total: v.total, zebra: v.zebra });
  }
});
