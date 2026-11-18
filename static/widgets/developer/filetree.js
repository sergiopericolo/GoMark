/*
 * filetree — a directory listing with ├── └── guides and notes.
 * data:   { "tree": "site/\n  gomark.toml  # config\n  en/\n    notes/" } (2-space indent)
 *         or [{ "name", "note"?, "children"? }]
 * config: { "icons": true }
 */
WiMark.register('filetree', {
  title: 'File tree',
  description: 'A directory tree from indented text or nested data, with notes per entry.',
  example: {
    data: { tree: 'mysite/\n  gomark.toml   # site settings\n  sections/\n    notes.toml  # layout of one section\n  en/\n    notes/\n      first.md\n  it/\n  widgets/      # site WiMarks\n  dist/         # output' },
    config: { icons: true }
  },
  mount: function (el, data, config) {
    var W = WiMark, h = W.h;
    var root = W.list(Array.isArray(data) ? data : null);
    if (!root.length) {
      var stack = [{ children: root, indent: -1 }];
      String(data.tree || (typeof data === 'string' ? data : '')).split('\n').forEach(function (line) {
        if (!line.trim()) return;
        var indent = line.length - line.replace(/^\s+/, '').length;
        var m = /^(.*?)(?:\s+#\s*(.*))?$/.exec(line.trim());
        var node = { name: m[1].trim(), note: m[2], children: [] };
        while (stack.length > 1 && stack[stack.length - 1].indent >= indent) stack.pop();
        stack[stack.length - 1].children.push(node);
        stack.push({ children: node.children, indent: indent });
      });
    }
    var pre = h('pre', 'wm-filetree');
    function walk(items, prefix) {
      W.list(items).forEach(function (n, i) {
        var last = i === items.length - 1, kids = W.list(n.children);
        var dir = kids.length || /\/$/.test(n.name);
        pre.appendChild(h('div', 'wm-filetree-row',
          h('span', 'wm-filetree-guide', prefix + (last ? '└── ' : '├── ')),
          config.icons !== false ? h('span', { class: 'wm-filetree-icon', 'aria-hidden': 'true' }, dir ? '▸ ' : '· ') : null,
          h('span', dir ? 'wm-filetree-dir' : 'wm-filetree-file', n.name),
          n.note ? h('span', 'wm-filetree-note', '  # ' + n.note) : null));
        walk(kids, prefix + (last ? '    ' : '│   '));
      });
    }
    if (root.length === 1 && W.list(root[0].children).length) {
      pre.appendChild(h('div', 'wm-filetree-row', h('span', 'wm-filetree-dir', root[0].name), root[0].note ? h('span', 'wm-filetree-note', '  # ' + root[0].note) : null));
      walk(root[0].children, '');
    } else walk(root, '');
    el.appendChild(h('div', 'wm-card wm-filetree-box', pre));
  }
});
