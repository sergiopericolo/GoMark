/*
 * filetree — a directory tree from indented lines; "# note" after an entry.
 *   ```wimark-filetree
 *   site/
 *     gomark.toml   # settings
 *     en/
 *       index.md
 *   ```
 */
WiMark.register('filetree', {
  title: 'File tree',
  description: 'Indented lines as a directory tree with guides; a trailing "/" marks folders, "# text" adds a note, "*" highlights.',
  input: 'text',
  example: { body: 'mysite/\n  gomark.toml        # site settings\n  sections/\n    api.toml\n  en/\n    api/\n      index.md\n      build.md      # *the page you are reading\n  media/             # images, compressed at build\n  widgets/           # your own WiMarks\n  dist/              # output' },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var items = W.lines(v.text).map(function (ln) {
      var ind = ln.match(/^\s*/)[0].replace(/\t/g, '  ').length, rest = ln.trim(), note = '', k = rest.indexOf(' #');
      if (k >= 0) { note = rest.slice(k + 2).trim(); rest = rest.slice(0, k).trim(); }
      return { ind: ind, name: rest, note: note.replace(/^\*/, ''), hot: note.charAt(0) === '*' };
    });
    var levels = [];
    items.forEach(function (it) { if (levels.indexOf(it.ind) < 0) levels.push(it.ind); });
    levels.sort(function (a, b) { return a - b; });
    var ul = h('ul', 'wm-filetree');
    items.forEach(function (it, i) {
      var d = levels.indexOf(it.ind), last = !items.slice(i + 1).some(function (x) { return levels.indexOf(x.ind) === d && !items.slice(i + 1, items.indexOf(x)).some(function (y) { return levels.indexOf(y.ind) < d; }); });
      var guides = '';
      for (var g = 1; g < d; g++) {
        var open = items.slice(i + 1).some(function (x, j) { return levels.indexOf(x.ind) === g && !items.slice(i + 1, i + 1 + j).some(function (y) { return levels.indexOf(y.ind) < g; }); });
        guides += open ? '│  ' : '   ';
      }
      var dir = /\/$/.test(it.name);
      ul.appendChild(h('li', 'wm-filetree-row' + (it.hot ? ' wm-filetree-hot' : ''), h('span', { class: 'wm-filetree-guide', 'aria-hidden': 'true' }, d ? guides + (last ? '└─ ' : '├─ ') : ''),
        h('span', 'wm-filetree-name' + (dir ? ' wm-filetree-dir' : ''), it.name), it.note ? h('span', 'wm-filetree-note', W.inline(it.note)) : null));
    });
    el.appendChild(h('div', 'wm-code wm-filetree-box', ul));
  }
});
