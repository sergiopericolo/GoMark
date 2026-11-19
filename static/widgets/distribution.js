/*
 * distribution — a probability distribution with a shaded probability.
 *   ```wimark-distribution {"dist": "normal", "mu": 0, "sigma": 1, "area": [-1, 1]}
 *   ```
 *   normal (mu, sigma) · uniform (a, b) · exponential (lambda) · binomial (n, p) · poisson (lambda)
 */
WiMark.register('distribution', {
  title: 'Distribution',
  description: 'Density or mass function of normal, uniform, exponential, binomial or Poisson, with P(a ≤ X ≤ b), mean and variance.',
  example: { opts: { dist: 'normal', mu: 0, sigma: 1, area: [-1.96, 1.96] } },
  choices: { dist: ['normal', 'uniform', 'exponential', 'binomial', 'poisson'] },
  mount: function (el, v) {
    var W = WiMark, h = W.h, svg = W.svg, N = W.num;
    var d = v.dist || 'normal', fact = function (k) { var r = 1; for (var i = 2; i <= k; i++) r *= i; return r; };
    var choose = function (n, k) { var r = 1; for (var i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return r; };
    var D = {
      normal: function () { var mu = N(v.mu, 0), s = N(v.sigma, 1); return { pdf: function (x) { return Math.exp(-0.5 * Math.pow((x - mu) / s, 2)) / (s * Math.sqrt(2 * Math.PI)); }, lo: mu - 4 * s, hi: mu + 4 * s, mean: mu, vari: s * s, tex: '\\mathcal{N}(' + mu + ', ' + s + '^2)' }; },
      uniform: function () { var a = N(v.a, 0), b = N(v.b, 1); return { pdf: function (x) { return x >= a && x <= b ? 1 / (b - a) : 0; }, lo: a - (b - a) * 0.25, hi: b + (b - a) * 0.25, mean: (a + b) / 2, vari: Math.pow(b - a, 2) / 12, tex: '\\mathcal{U}(' + a + ', ' + b + ')' }; },
      exponential: function () { var l = N(v.lambda, 1); return { pdf: function (x) { return x < 0 ? 0 : l * Math.exp(-l * x); }, lo: 0, hi: 5 / l, mean: 1 / l, vari: 1 / (l * l), tex: '\\operatorname{Exp}(' + l + ')' }; },
      binomial: function () { var n = Math.round(N(v.n, 10)), p = N(v.p, 0.5); return { pmf: function (k) { return choose(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k); }, lo: 0, hi: n, mean: n * p, vari: n * p * (1 - p), tex: '\\operatorname{B}(' + n + ', ' + p + ')' }; },
      poisson: function () { var l = N(v.lambda, 3); return { pmf: function (k) { return (Math.pow(l, k) * Math.exp(-l)) / fact(k); }, lo: 0, hi: Math.ceil(l + 4 * Math.sqrt(l) + 2), mean: l, vari: l, tex: '\\operatorname{Pois}(' + l + ')' }; }
    }[d];
    if (!D) throw new Error('unknown distribution ' + d);
    var X = D(), area = W.list(v.area).map(function (a) { return W.math.value(a, 0); }), prob = null;
    var c = W.chart(el, { height: W.num(v.height, 260), label: d + ' distribution' });
    var x = W.scale.linear([X.lo, X.hi], [0, c.w]);
    if (X.pdf) {
      var ys = []; for (var i = 0; i <= 300; i++) ys.push(X.pdf(X.lo + ((X.hi - X.lo) * i) / 300));
      var y = W.scale.linear([0, Math.max.apply(null, ys) * 1.1], [c.h, 0]);
      c.axisY(y, { format: function (t) { return W.fmt(t); } });
      c.axisXLinear(x, { format: function (t) { return W.fmt(t); } });
      if (area.length === 2) {
        var a = Math.max(X.lo, area[0]), b = Math.min(X.hi, area[1]), pts = [x(a) + ',' + y(0)], s = 0, n = 400, hh = (b - a) / n;
        for (var k = 0; k <= n; k++) { var xv = a + k * hh; pts.push(x(xv) + ',' + y(X.pdf(xv))); s += (k === 0 || k === n ? 1 : k % 2 ? 4 : 2) * X.pdf(xv); }
        prob = (s * hh) / 3;
        pts.push(x(b) + ',' + y(0));
        c.add(svg('polygon', { points: pts.join(' '), class: 'wm-area-shade wm-s1' }));
      }
      c.add(svg('path', { d: W.plotPath(X.pdf, X.lo, X.hi, x, y, 600), class: 'wm-line wm-s1' }));
    } else {
      var ks = []; for (var j = X.lo; j <= X.hi; j++) ks.push(j);
      var ps = ks.map(X.pmf), yy = W.scale.linear([0, Math.max.apply(null, ps) * 1.1], [c.h, 0]), bw = Math.max(2, (c.w / ks.length) * 0.6);
      var xb = W.scale.linear([X.lo - 0.5, X.hi + 0.5], [0, c.w]);
      c.axisY(yy, { format: function (t) { return W.fmt(t); } });
      c.axisXLinear(xb, { format: function (t) { return Number.isInteger(t) ? String(t) : ''; } });
      prob = area.length === 2 ? 0 : null;
      ks.forEach(function (kk, idx) {
        var inA = area.length === 2 && kk >= area[0] && kk <= area[1];
        if (inA) prob += ps[idx];
        c.add(svg('rect', { x: xb(kk) - bw / 2, y: yy(ps[idx]), width: bw, height: c.h - yy(ps[idx]), rx: 2, class: 'wm-mark ' + (inA || area.length !== 2 ? 'wm-s1' : 'wm-s-other'), 'data-tip': 'P(X = ' + kk + ') = ' + W.fmt(ps[idx], { maximumFractionDigits: 5 }) }));
      });
    }
    el.appendChild(h('div', 'wm-dist-facts', W.tex('X \\sim ' + X.tex), W.tex('\\mathbb{E}[X] = ' + W.fmt(X.mean, { maximumFractionDigits: 4 })), W.tex('\\operatorname{Var}(X) = ' + W.fmt(X.vari, { maximumFractionDigits: 4 })),
      prob !== null ? W.tex('P(' + area[0] + ' \\le X \\le ' + area[1] + ') = ' + W.fmt(prob, { maximumFractionDigits: 4 })) : null));
  }
});
