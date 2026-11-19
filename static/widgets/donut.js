/*
 * donut — parts of a whole around a centre with the total.
 *   ```wimark-donut {"center": "total"}
 *   [["code", 61], ["docs", 24], ["tests", 15]]
 *   ```
 */
WiMark.register('donut', {
  title: 'Donut',
  description: 'Parts of a whole with percentages and the total in the centre; past eight, parts fold into "other".',
  example: { body: [['engine', 4300], ['widgets', 6100], ['styles', 1340], ['tests', 980], ['docs', 620]] },
  mount: function (el, v) {
    var W = WiMark;
    W.parts(el, W.rows(v.items, ['label', 'value']), { hole: v.hole, center: v.center, labels: v.labels, sort: v.sort });
  }
});
