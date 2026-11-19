/*
 * gitgraph — commits on branch lanes from git-like lines.
 *   ```wimark-gitgraph
 *   commit init
 *   branch feature
 *   commit add parser
 *   checkout main
 *   commit fix typo
 *   merge feature
 *   tag v1.0
 *   ```
 */
WiMark.register('gitgraph', {
  title: 'Git graph',
  description: 'Lines "commit msg", "branch b", "checkout b", "merge b", "tag t" drawn as commits on branch lanes.',
  input: 'text',
  example: { body: 'commit initial import\ncommit add engine\nbranch wimark\ncommit fence renderer\ncommit 120 widgets\ncheckout main\ncommit fix image size\nbranch hotfix\ncommit exif orientation\ncheckout main\nmerge hotfix\ntag v1.4.1\nmerge wimark\ntag v2.0.0' },
  mount: function (el, v) {
    var W = WiMark, svg = W.svg;
    var lanes = ['main'], head = 'main', tips = {}, C = [];
    W.lines(v.text).forEach(function (ln) {
      var m = /^\s*(\w+)\s*(.*)$/.exec(ln), cmd = m[1].toLowerCase(), arg = m[2].trim();
      if (cmd === 'branch') { if (lanes.indexOf(arg) < 0) lanes.push(arg); tips[arg] = tips[head]; head = arg; }
      else if (cmd === 'checkout' || cmd === 'switch') { if (lanes.indexOf(arg) < 0) { lanes.push(arg); tips[arg] = tips[head]; } head = arg; }
      else if (cmd === 'commit') { var c0 = { i: C.length, lane: head, msg: arg, parents: tips[head] !== undefined ? [tips[head]] : [] }; C.push(c0); tips[head] = c0.i; }
      else if (cmd === 'merge') { var c1 = { i: C.length, lane: head, msg: 'merge ' + arg, parents: [tips[head], tips[arg]].filter(function (p) { return p !== undefined; }), merge: true }; C.push(c1); tips[head] = c1.i; }
      else if (cmd === 'tag' && C.length) { (C[tips[head]].tags = C[tips[head]].tags || []).push(arg); }
    });
    var lx = 28, cy = 30, Wd = 40 + lanes.length * lx + 360, Hd = C.length * cy + 20;
    var c = W.chart(el, { width: Wd, height: Hd, margin: { top: 0, right: 0, bottom: 0, left: 0 }, label: 'git graph' });
    c.svg.style.maxWidth = Wd + 'px';
    var X = function (lane) { return 20 + lanes.indexOf(lane) * lx; }, Y = function (i) { return 20 + i * cy; };
    var gE = c.add(svg('g')), gN = c.add(svg('g'));
    C.forEach(function (k) {
      k.parents.forEach(function (p) {
        var a = C[p], x1 = X(a.lane), y1 = Y(a.i), x2 = X(k.lane), y2 = Y(k.i);
        gE.appendChild(svg('path', { d: x1 === x2 ? 'M' + x1 + ',' + y1 + ' L' + x2 + ',' + y2 : 'M' + x1 + ',' + y1 + ' C' + x1 + ',' + (y2 - cy * 0.6) + ' ' + x2 + ',' + (y2 - cy * 0.6) + ' ' + x2 + ',' + y2, class: 'wm-line ' + W.series(lanes.indexOf(x1 === x2 ? k.lane : (k.merge && p === k.parents[1] ? a.lane : k.lane))) }));
      });
    });
    C.forEach(function (k) {
      var cls = W.series(lanes.indexOf(k.lane)), tx = 30 + lanes.length * lx;
      gN.appendChild(svg('circle', { cx: X(k.lane), cy: Y(k.i), r: k.merge ? 4 : 6, class: (k.merge ? 'wm-dot-open ' : 'wm-dot ') + cls, 'data-tip': k.lane + ': ' + k.msg }));
      var t = svg('text', { x: tx, y: Y(k.i) + 4, class: 'wm-node-text', text: k.msg });
      gN.appendChild(t);
      (k.tags || []).forEach(function (tag, j) { var w = W.diagram.textWidth(tag, 11) + 10, x0 = tx + W.diagram.textWidth(k.msg, 12) + 10 + j * (w + 6); gN.appendChild(svg('rect', { x: x0, y: Y(k.i) - 9, width: w, height: 18, rx: 9, class: 'wm-node-accent' })); gN.appendChild(svg('text', { x: x0 + w / 2, y: Y(k.i) + 4, 'text-anchor': 'middle', class: 'wm-node-accent-text', text: tag })); });
    });
    el.appendChild(W.legend(lanes.map(function (l, i) { return { label: l, i: i }; }), 'line'));
  }
});
