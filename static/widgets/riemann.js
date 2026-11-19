/*
 * riemann — Riemann sums of an integral against its value, with a slider.
 *   ```wimark-riemann {"f": "x^2", "x": [0, 2], "n": 8, "rule": "mid"}
 *   ```
 *   rule: left, right, mid, trap
 */
WiMark.register('riemann', {
  title: 'Riemann sum',
  description: 'Rectangles (left, right, midpoint) or trapezoids under f, the sum, the integral and the error.',
  example: { opts: { f: 'sin(x) + 1.2', x: [0, 'pi'], n: 8, rule: 'mid' } },
  choices: { rule: ['left', 'right', 'mid', 'trap'] },
  mount: function (el, v) {
    var W = WiMark, h = W.h, svg = W.svg, V = W.math.value;
    var f = W.math.compile(String(v.f || 'x'), ['x']), xr = W.list(v.x), a = V(xr[0], 0), b = V(xr[1], 1), rule = v.rule || 'mid';
    var exact = 0, M = 2000, hh = (b - a) / M;
    for (var i = 0; i <= M; i++) exact += (i === 0 || i === M ? 1 : i % 2 ? 4 : 2) * f(a + i * hh);
    exact *= hh / 3;
    var host = h('div'), input = h('input', { type: 'range', min: 1, max: 64, value: W.num(v.n, 8), class: 'wm-range', 'aria-label': 'subintervals n' }), out = h('output', 'wm-mono');
    el.appendChild(host);
    el.appendChild(h('label', 'wm-slider', h('span', null, 'n'), input, out));
    function draw() {
      var n = +input.value, dx = (b - a) / n, sum = 0;
      host.textContent = '';
      var ys = []; for (var k = 0; k <= 200; k++) ys.push(f(a + ((b - a) * k) / 200));
      var ext = W.extent(ys.concat([0]));
      var c = W.chart(host, { height: W.num(v.height, 260), label: 'Riemann sum' });
      var pad = (b - a) * 0.08, x = W.scale.linear([a - pad, b + pad], [0, c.w]), y = W.scale.linear(ext, [c.h, 0], true);
      c.axisY(y);
      c.axisXLinear(x);
      for (var j = 0; j < n; j++) {
        var x0 = a + j * dx, x1 = x0 + dx, area;
        if (rule === 'trap') {
          var f0 = f(x0), f1 = f(x1);
          area = ((f0 + f1) / 2) * dx;
          c.add(svg('polygon', { points: [x(x0), y(0), x(x0), y(f0), x(x1), y(f1), x(x1), y(0)].join(' '), class: 'wm-riemann wm-s1', 'data-tip': '[' + W.fmt(x0) + ', ' + W.fmt(x1) + ']: ' + W.fmt(area) }));
        } else {
          var hv = f(rule === 'left' ? x0 : rule === 'right' ? x1 : (x0 + x1) / 2);
          area = hv * dx;
          c.add(svg('rect', { x: x(x0), y: Math.min(y(hv), y(0)), width: Math.max(0.5, x(x1) - x(x0)), height: Math.abs(y(hv) - y(0)), class: 'wm-riemann wm-s1', 'data-tip': '[' + W.fmt(x0) + ', ' + W.fmt(x1) + ']: ' + W.fmt(area) }));
        }
        sum += area;
      }
      c.add(svg('path', { d: W.plotPath(f, a - pad, b + pad, x, y, 400), class: 'wm-line wm-s2' }));
      out.textContent = 'n = ' + n + ' · sum ' + W.fmt(sum, { maximumFractionDigits: 6 }) + ' · ∫ ' + W.fmt(exact, { maximumFractionDigits: 6 }) + ' · error ' + W.fmt(sum - exact, { maximumSignificantDigits: 3 });
    }
    input.addEventListener('input', draw);
    draw();
    el.appendChild(h('p', 'wm-muted wm-small', W.inline('$\\int_{' + W.fmt(a, { maximumFractionDigits: 3 }) + '}^{' + W.fmt(b, { maximumFractionDigits: 3 }) + '} ' + v.f + '\\,dx$ · ' + rule + ' rule')));
  }
});
