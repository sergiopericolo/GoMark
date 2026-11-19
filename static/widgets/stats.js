/*
 * stats — summary statistics of one or more samples.
 *   ```wimark-stats
 *   {"run A": [12, 15, 11, 18, 14], "run B": [22, 19, 25, 21]}
 *   ```
 *   or a plain array for one sample
 */
WiMark.register('stats', {
  title: 'Summary statistics',
  description: 'n, mean, standard deviation, min, quartiles, max and a 95% confidence interval of each sample.',
  example: { body: { 'before (ms)': [48, 52, 47, 61, 50, 49, 55, 58, 46, 51], 'after (ms)': [31, 35, 29, 33, 40, 30, 32, 34, 28, 36] } },
  mount: function (el, v) {
    var W = WiMark;
    var groups = v.items ? { sample: v.items } : Object.keys(v).filter(function (k) { return Array.isArray(v[k]); }).reduce(function (o, k) { o[k] = v[k]; return o; }, {});
    var q = function (s, p) { var i = (s.length - 1) * p, lo = Math.floor(i); return s[lo] + (s[Math.min(lo + 1, s.length - 1)] - s[lo]) * (i - lo); };
    var f = function (x) { return W.fmt(x, { maximumFractionDigits: 3 }); };
    var rows = Object.keys(groups).map(function (k) {
      var s = groups[k].map(Number).filter(isFinite).sort(function (a, b) { return a - b; }), n = s.length, mean = W.sum(s) / n;
      var sd = n > 1 ? Math.sqrt(W.sum(s.map(function (x) { return (x - mean) * (x - mean); })) / (n - 1)) : 0, half = 1.96 * sd / Math.sqrt(n);
      return [k, n, f(mean), f(sd), f(s[0]), f(q(s, 0.25)), f(q(s, 0.5)), f(q(s, 0.75)), f(s[n - 1]), '[' + f(mean - half) + ', ' + f(mean + half) + ']'];
    });
    W.grid(el, ['sample', 'n', 'mean', 'sd', 'min', 'Q1', 'median', 'Q3', 'max', '95% CI'], rows, { align: ['left'].concat(Array(9).fill('right')) });
  }
});
