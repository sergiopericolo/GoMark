/*
 * stats — descriptive statistics of a list of numbers, with a box plot strip.
 * data:   { "values": [], "name"? }  or  [{ "name", "values": [] }, …]
 * config: { "decimals": 2 }
 */
WiMark.register('stats', {
  title: 'Descriptive statistics',
  description: 'Count, mean, median, standard deviation, quartiles and range of one or more samples.',
  example: {
    data: [
      { name: 'build ms', values: [120, 135, 128, 140, 150, 132, 129, 300, 125, 131] },
      { name: 'page words', values: [480, 720, 1200, 650, 900, 300, 1500, 820] }
    ],
    config: { decimals: 2 }
  },
  mount: function (el, data, config) {
    var W = WiMark, svg = W.svg;
    var groups = Array.isArray(data) ? data : [{ name: data.name || '', values: data.values }];
    var dec = Math.max(0, Math.min(6, W.num(config.decimals, 2)));
    var f = function (v) { return W.fmt(v, { maximumFractionDigits: dec }); };
    function q(s, p) { var i = (s.length - 1) * p, lo = Math.floor(i); return s[lo] + (s[Math.ceil(i)] - s[lo]) * (i - lo); }
    var rows = groups.map(function (g) {
      var s = W.list(g.values).map(Number).filter(isFinite).sort(function (a, b) { return a - b; }), n = s.length;
      if (!n) return [g.name || '', 0, '', '', '', '', '', '', '', ''];
      var mean = W.sum(s) / n, sd = Math.sqrt(W.sum(s.map(function (v) { return (v - mean) * (v - mean); })) / Math.max(1, n - 1));
      var box = svg('svg', { class: 'wm-stats-box', viewBox: '0 0 120 16', 'aria-hidden': 'true' });
      var x = function (v) { return 4 + (112 * (v - s[0])) / (s[n - 1] - s[0] || 1); };
      box.appendChild(svg('line', { x1: x(s[0]), x2: x(s[n - 1]), y1: 8, y2: 8, class: 'wm-stroke-ink' }));
      box.appendChild(svg('rect', { x: x(q(s, 0.25)), y: 2, width: Math.max(1, x(q(s, 0.75)) - x(q(s, 0.25))), height: 12, rx: 2, class: 'wm-mark wm-s1' }));
      box.appendChild(svg('line', { x1: x(q(s, 0.5)), x2: x(q(s, 0.5)), y1: 2, y2: 14, class: 'wm-median' }));
      return [g.name || '', n, f(mean), f(q(s, 0.5)), f(sd), f(s[0]), f(q(s, 0.25)), f(q(s, 0.75)), f(s[n - 1]), box];
    });
    el.appendChild(W.table(['', 'n', 'mean', 'median', 'sd', 'min', 'Q1', 'Q3', 'max', ''], rows,
      { rowHeader: true, align: [null, 'right', 'right', 'right', 'right', 'right', 'right', 'right', 'right', null] }));
  }
});
