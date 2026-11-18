/*
 * donut — parts of a whole around a hole that shows the total (or a label).
 * data:   [{ "label", "value" }]
 * config: { "center": "total" | "<text>", "labels": "percent" | "value" | "none", "sort": true }
 */
WiMark.register('donut', {
  title: 'Donut chart',
  description: 'Parts of a whole around a centre that states the total.',
  example: {
    data: [{ label: 'general', value: 25 }, { label: 'markdown', value: 25 }, { label: 'developer', value: 25 }, { label: 'data', value: 25 }],
    config: { center: 'total', labels: 'percent', sort: true }
  },
  choices: { labels: ['percent', 'value', 'none'] },
  mount: function (el, data, config) { WiMark.parts(el, data, config); }
});
