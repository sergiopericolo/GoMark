/*
 * geometry — a construction: named points, segments, polygons, circles, angles.
 *   ```wimark-geometry {"points": {"A": [0, 0], "B": [4, 0], "C": [1, 3]}}
 *   ["ABC", "circle A 2", "angle BAC", "C-H dashed"]
 *   ```
 *   "AB" segment · "ABC" polygon · "circle A 2" or "circle A B" · "angle BAC" · add "dashed"
 */
WiMark.register('geometry', {
  title: 'Geometry',
  description: 'Points by coordinates, then segments "AB", polygons "ABC", "circle O r", "angle BAC" — to scale.',
  example: { opts: { points: { A: [0, 0], B: [5, 0], C: [1.5, 3], H: [1.5, 0], O: [2.5, 0.958] } }, body: ['ABC', 'CH dashed', 'angle CHB', 'angle BAC', 'circle O C dashed'] },
  mount: function (el, v) {
    var W = WiMark, svg = W.svg;
    var P = v.points || {}, names = Object.keys(P);
    var xs = names.map(function (k) { return W.num(P[k][0]); }), ys = names.map(function (k) { return W.num(P[k][1]); });
    var cmds = W.list(v.items).map(String);
    var circles = cmds.map(function (s) { return /^circle\s+(\w+)\s+(\S+)/.exec(s); }).filter(Boolean);
    circles.forEach(function (m) {
      var o = P[m[1]], r = P[m[2]] ? Math.hypot(P[m[2]][0] - o[0], P[m[2]][1] - o[1]) : W.num(m[2]);
      if (o) { xs.push(o[0] - r, o[0] + r); ys.push(o[1] - r, o[1] + r); }
    });
    var ex = W.extent(xs), ey = W.extent(ys), span = Math.max(ex[1] - ex[0], ey[1] - ey[0]) * 1.15;
    var Wd = W.num(v.width, 460), k = (Wd - 40) / span, Hd = Math.max(160, (ey[1] - ey[0]) * k + 70);
    var c = W.chart(el, { width: Wd, height: Hd, margin: { top: 0, right: 0, bottom: 0, left: 0 }, label: 'geometric construction' });
    c.svg.style.maxWidth = Wd + 'px';
    var mx = (ex[0] + ex[1]) / 2, my = (ey[0] + ey[1]) / 2;
    var X = function (x) { return Wd / 2 + (x - mx) * k; }, Y = function (y) { return Hd / 2 - (y - my) * k; };
    var gS = c.add(svg('g')), gP = c.add(svg('g'));
    cmds.forEach(function (s, i) {
      var dashed = /\bdashed\b/.test(s), cls = (dashed ? ' wm-edge-dash' : '');
      var m;
      if ((m = /^circle\s+(\w+)\s+(\S+)/.exec(s))) {
        var o = P[m[1]];
        if (!o) return;
        var r = P[m[2]] ? Math.hypot(P[m[2]][0] - o[0], P[m[2]][1] - o[1]) : W.num(m[2]);
        gS.appendChild(svg('circle', { cx: X(o[0]), cy: Y(o[1]), r: r * k, class: 'wm-geo-line' + cls, 'data-tip': 'circle ' + m[1] + ', r = ' + W.fmt(r) }));
      } else if ((m = /^angle\s+(\w)(\w)(\w)/.exec(s))) {
        var A = P[m[1]], B = P[m[2]], C = P[m[3]];
        if (!A || !B || !C) return;
        var a1 = Math.atan2(A[1] - B[1], A[0] - B[0]), a2 = Math.atan2(C[1] - B[1], C[0] - B[0]), d = a2 - a1;
        while (d <= -Math.PI) d += 2 * Math.PI;
        while (d > Math.PI) d -= 2 * Math.PI;
        var deg = Math.abs((d * 180) / Math.PI), rr = 22;
        if (Math.abs(deg - 90) < 0.5) {
          var u = [Math.cos(a1), Math.sin(a1)], w = [Math.cos(a2), Math.sin(a2)], q = 12 / k;
          gS.appendChild(svg('path', { d: 'M' + X(B[0] + u[0] * q) + ',' + Y(B[1] + u[1] * q) + ' L' + X(B[0] + (u[0] + w[0]) * q) + ',' + Y(B[1] + (u[1] + w[1]) * q) + ' L' + X(B[0] + w[0] * q) + ',' + Y(B[1] + w[1] * q), class: 'wm-geo-angle' }));
        } else {
          var p1 = [X(B[0]) + rr * Math.cos(a1), Y(B[1]) - rr * Math.sin(a1)], p2 = [X(B[0]) + rr * Math.cos(a1 + d), Y(B[1]) - rr * Math.sin(a1 + d)];
          gS.appendChild(svg('path', { d: 'M' + p1 + ' A' + rr + ',' + rr + ' 0 0 ' + (d > 0 ? 0 : 1) + ' ' + p2, class: 'wm-geo-angle' }));
          var mid = a1 + d / 2;
          gS.appendChild(svg('text', { x: X(B[0]) + (rr + 14) * Math.cos(mid), y: Y(B[1]) - (rr + 14) * Math.sin(mid) + 4, 'text-anchor': 'middle', class: 'wm-edge-text', text: W.fmt(deg, { maximumFractionDigits: 1 }) + '°' }));
        }
      } else {
        var ids = (s.split(/\s+/)[0].match(/[A-Z][a-z0-9']*/g) || []).filter(function (n) { return P[n]; });
        if (ids.length < 2) return;
        var pts = ids.map(function (n) { return X(P[n][0]) + ',' + Y(P[n][1]); }).join(' ');
        gS.appendChild(svg(ids.length > 2 ? 'polygon' : 'polyline', { points: pts, class: (ids.length > 2 ? 'wm-geo-poly ' + W.series(i) : 'wm-geo-line') + cls }));
      }
    });
    names.forEach(function (n) {
      var x = X(P[n][0]), y = Y(P[n][1]), dx = x < Wd / 2 ? -10 : 10, dy = y < Hd / 2 ? -8 : 16;
      gP.appendChild(svg('circle', { cx: x, cy: y, r: 3.5, class: 'wm-ink', 'data-tip': n + ' (' + W.fmt(P[n][0]) + ', ' + W.fmt(P[n][1]) + ')' }));
      gP.appendChild(svg('text', { x: x + dx, y: y + dy, 'text-anchor': dx < 0 ? 'end' : 'start', class: 'wm-title', text: n }));
    });
  }
});
