/*
 * array — an array as cells with indices, pointers and marked ranges.
 *   ```wimark-array {"name": "A", "ptr": {"lo": 0, "mid": 3, "hi": 6}, "mark": [3], "range": [0, 6]}
 *   [1, 3, 4, 7, 9, 11, 15]
 *   ```
 *   Several states: {"steps": [{"ptr": …, "mark": …, "note": "…"}, …]} adds a stepper.
 */
WiMark.register('array', {
  title: 'Array',
  description: 'Array cells with indices, named pointers (i, j, lo, hi), marked cells and ranges; "steps" makes it a walkthrough.',
  example: { opts: { name: 'A', steps: [{ ptr: { lo: 0, mid: 4, hi: 8 }, range: [0, 8], note: 'k = 15 > A[4] = 9: search right' }, { ptr: { lo: 5, mid: 6, hi: 8 }, range: [5, 8], note: 'k = 15 = A[6]: found' , mark: [6] }] }, body: [1, 3, 4, 7, 9, 11, 15, 20, 31] },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var items = W.list(v.items), steps = W.list(v.steps).length ? W.list(v.steps) : [v], at = 0;
    var host = h('div'), note = h('p', 'wm-text wm-array-note');
    function draw() {
      var s = steps[at], ptr = s.ptr || {}, mark = W.list(s.mark), rg = W.list(s.range);
      host.textContent = '';
      var row = h('div', 'wm-array', v.name ? h('span', 'wm-array-name', v.name) : null);
      items.forEach(function (x, i) {
        var names = Object.keys(ptr).filter(function (k) { return ptr[k] === i; });
        var inR = rg.length === 2 && i >= rg[0] && i <= rg[1];
        row.appendChild(h('div', 'wm-array-cell' + (mark.indexOf(i) >= 0 ? ' wm-array-mark' : '') + (rg.length === 2 && !inR ? ' wm-array-out' : ''),
          h('span', 'wm-array-v', x === null ? '∅' : String(x)), h('span', 'wm-array-i', String(i)),
          names.length ? h('span', 'wm-array-ptr', '↑ ' + names.join(', ')) : null));
      });
      host.appendChild(row);
      note.textContent = '';
      if (s.note) note.appendChild(W.inline(s.note));
      if (steps.length > 1) { prev.disabled = at === 0; next.disabled = at === steps.length - 1; count.textContent = (at + 1) + ' / ' + steps.length; }
    }
    el.appendChild(host);
    el.appendChild(note);
    if (steps.length > 1) {
      var prev = h('button', { type: 'button', class: 'wm-btn' }, '← prev'), next = h('button', { type: 'button', class: 'wm-btn' }, 'next →'), count = h('span', 'wm-muted');
      prev.addEventListener('click', function () { at = Math.max(0, at - 1); draw(); });
      next.addEventListener('click', function () { at = Math.min(steps.length - 1, at + 1); draw(); });
      el.appendChild(h('div', 'wm-row', prev, next, count));
    }
    draw();
  }
});
