/*
 * constants — named constants with symbol, value and unit.
 *   ```wimark-constants
 *   [["c", "299792458", "m\\,s^{-1}", "speed of light"], ["\\pi", "3.14159265…", "", "pi"]]
 *   ```
 */
WiMark.register('constants', {
  title: 'Constants',
  description: 'Constants as [symbol, value, unit, name]: symbol and unit in LaTeX, value copyable.',
  example: { body: [['c', '299 792 458', '\\mathrm{m\\,s^{-1}}', 'speed of light (exact)'], ['h', '6.626 070 15 \\times 10^{-34}', '\\mathrm{J\\,s}', 'Planck constant (exact)'], ['G', '6.674 30(15) \\times 10^{-11}', '\\mathrm{m^3\\,kg^{-1}\\,s^{-2}}', 'gravitational constant'], ['e', '2.718 281 828 459…', '', "Euler's number"], ['\\varepsilon', '2^{-52}', '', 'machine epsilon, float64']] },
  mount: function (el, v) {
    var W = WiMark;
    W.grid(el, ['symbol', 'value', 'unit', 'name'], W.rows(v.items, ['sym', 'value', 'unit', 'name']).map(function (r) {
      return [W.tex(r.sym), W.tex(String(r.value === undefined ? '' : r.value)), r.unit ? W.tex(r.unit) : '', r.name || ''];
    }), { caption: v.title, align: ['center', 'left', 'left', 'left'] });
  }
});
