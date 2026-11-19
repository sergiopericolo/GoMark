/*
 * fourier — partial sums of the Fourier series of a periodic wave, with a slider.
 *   ```wimark-fourier {"wave": "square", "terms": 5}
 *   ```
 *   wave: square, sawtooth, triangle
 */
WiMark.register('fourier', {
  title: 'Fourier series',
  description: 'A square, sawtooth or triangle wave and its partial Fourier sum; a slider sets the number of terms.',
  example: { opts: { wave: 'square', terms: 5 } },
  choices: { wave: ['square', 'sawtooth', 'triangle'] },
  mount: function (el, v) {
    var W = WiMark, h = W.h, svg = W.svg;
    var wave = v.wave || 'square', P = Math.PI;
    var target = {
      square: function (x) { var m = ((x % (2 * P)) + 2 * P) % (2 * P); return m < P ? 1 : -1; },
      sawtooth: function (x) { var m = ((((x + P) % (2 * P)) + 2 * P) % (2 * P)) - P; return m / P; },
      triangle: function (x) { var m = ((x % (2 * P)) + 2 * P) % (2 * P); return m < P ? 1 - (2 * m) / P : -1 + (2 * (m - P)) / P; }
    }[wave];
    if (!target) throw new Error('wave must be square, sawtooth or triangle');
    var term = {
      square: function (k, x) { var n = 2 * k - 1; return (4 / (P * n)) * Math.sin(n * x); },
      sawtooth: function (k, x) { return ((2 / P) * (k % 2 ? 1 : -1) * Math.sin(k * x)) / k; },
      triangle: function (k, x) { var n = 2 * k - 1; return (8 / (P * P * n * n)) * Math.cos(n * x); }
    }[wave];
    var tex = { square: 'f(x) \\approx \\frac{4}{\\pi} \\sum_{k=1}^{N} \\frac{\\sin((2k-1)x)}{2k-1}', sawtooth: 'f(x) \\approx \\frac{2}{\\pi} \\sum_{k=1}^{N} (-1)^{k+1} \\frac{\\sin(kx)}{k}', triangle: 'f(x) \\approx \\frac{8}{\\pi^2} \\sum_{k=1}^{N} \\frac{\\cos((2k-1)x)}{(2k-1)^2}' }[wave];
    el.appendChild(h('div', 'wm-eq', h('div', 'wm-eq-body', W.tex(tex, true))));
    var host = h('div');
    var out = h('output', 'wm-mono'), input = h('input', { type: 'range', min: 1, max: 60, value: W.num(v.terms, 5), class: 'wm-range', 'aria-label': 'terms N' });
    el.appendChild(host);
    el.appendChild(h('label', 'wm-slider', h('span', null, 'N'), input, out));
    function draw() {
      var N = +input.value;
      out.textContent = N + (N === 1 ? ' term' : ' terms');
      host.textContent = '';
      var c = W.chart(host, { height: W.num(v.height, 260), label: wave + ' wave, ' + N + ' terms' });
      var x = W.scale.linear([-2 * P, 2 * P], [0, c.w]), y = W.scale.linear([-1.4, 1.4], [c.h, 0]);
      c.axisY(y, { ticks: 4 });
      c.axisXLinear(x, { format: function (t) { return W.fmt(t / P, { maximumFractionDigits: 1 }) + 'π'; } });
      c.add(svg('path', { d: W.plotPath(target, -2 * P, 2 * P, x, y, 1600), class: 'wm-line wm-s-other' }));
      c.add(svg('path', { d: W.plotPath(function (t) { var s = 0; for (var k = 1; k <= N; k++) s += term(k, t); return s; }, -2 * P, 2 * P, x, y, 1200), class: 'wm-line wm-s1' }));
    }
    input.addEventListener('input', draw);
    draw();
    el.appendChild(W.legend([{ label: wave, cls: 'wm-s-other' }, { label: 'partial sum', i: 0 }], 'line'));
  }
});
