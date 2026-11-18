/*
 * gitgraph — commits on branch lanes, with branches and merges.
 * data:   { "commits": [{ "branch", "message", "id"?, "merge"?: "<branch>", "tag"? }] }  (oldest first)
 * config: { "orientation": "vertical" }
 */
WiMark.register('gitgraph', {
  title: 'Git graph',
  description: 'Commits on branch lanes (one series per branch) with forks, merges and tags.',
  example: {
    data: {
      commits: [
        { branch: 'main', message: 'First stable version', id: 'a0509bd', tag: 'v1.1' },
        { branch: 'themes', message: 'Theme classes' },
        { branch: 'themes', message: 'duo and spectrum' },
        { branch: 'main', message: 'Section layouts' },
        { branch: 'wimark', message: 'WiMark runtime' },
        { branch: 'main', message: 'Merge themes', merge: 'themes' },
        { branch: 'wimark', message: '100 widgets' },
        { branch: 'main', message: 'Merge wimark', merge: 'wimark', tag: 'v1.2' }
      ]
    },
    config: {}
  },
  mount: function (el, data, config) {
    var W = WiMark, svg = W.svg;
    var commits = W.list(data.commits), lanes = [];
    commits.forEach(function (c) { if (lanes.indexOf(c.branch) < 0) lanes.push(c.branch); if (c.merge && lanes.indexOf(c.merge) < 0) lanes.push(c.merge); });
    var row = 34, lane = 26, left = 20, textX = left + lanes.length * lane + 16;
    var c = W.chart(el, { width: 700, height: commits.length * row + 16, margin: { top: 8, right: 8, bottom: 8, left: 8 }, label: 'git graph' });
    var lx = function (b) { return left + lanes.indexOf(b) * lane; };
    var last = {}, firstRow = {};
    var gE = c.add(svg('g')), gN = c.add(svg('g'));
    commits.forEach(function (cm, i) {
      var y = i * row + 14, x = lx(cm.branch), cls = W.series(lanes.indexOf(cm.branch));
      if (last[cm.branch] !== undefined) {
        gE.appendChild(svg('line', { x1: x, x2: x, y1: last[cm.branch], y2: y, class: 'wm-line ' + cls }));
      } else if (i > 0) {
        // A new branch forks from the latest commit before it on the first lane.
        var from = lanes[0], py = last[from] !== undefined ? last[from] : 14;
        gE.appendChild(svg('path', { d: 'M' + lx(from) + ',' + py + ' C' + lx(from) + ',' + (py + row * 0.6) + ' ' + x + ',' + (y - row * 0.6) + ' ' + x + ',' + y, class: 'wm-line ' + cls }));
      }
      if (cm.merge && last[cm.merge] !== undefined) {
        var mx = lx(cm.merge);
        gE.appendChild(svg('path', { d: 'M' + mx + ',' + last[cm.merge] + ' C' + mx + ',' + (y - row * 0.4) + ' ' + x + ',' + (y - row * 0.4) + ' ' + x + ',' + y, class: 'wm-line ' + W.series(lanes.indexOf(cm.merge)) }));
      }
      last[cm.branch] = y;
      if (firstRow[cm.branch] === undefined) firstRow[cm.branch] = i;
      gN.appendChild(svg('circle', { cx: x, cy: y, r: cm.merge ? 7 : 5.5, class: 'wm-dot ' + cls, 'data-tip': cm.branch + (cm.id ? ' · ' + cm.id : '') }));
      var t = svg('text', { x: textX, y: y + 4, class: 'wm-node-text' });
      if (cm.id) t.appendChild(svg('tspan', { class: 'wm-edge-text', text: cm.id + '  ' }));
      t.appendChild(svg('tspan', { text: cm.message || '' }));
      if (cm.tag) t.appendChild(svg('tspan', { class: 'wm-value', text: '  ⟨' + cm.tag + '⟩' }));
      gN.appendChild(t);
    });
    el.appendChild(W.legend(lanes.map(function (b, i) { return { label: b, i: i }; }), 'line'));
  }
});
