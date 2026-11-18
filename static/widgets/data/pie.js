/*
 * pie — parts of a whole; slices beyond the 8th fold into "other".
 * data:   [{ "label", "value" }]
 * config: { "labels": "percent" | "value" | "none", "sort": true }
 */
WiMark.register('pie', {
  title: 'Pie chart',
  description: 'Parts of a whole with percentages; small parts fold into “other” after eight.',
  example: {
    data: [{ label: 'English', value: 120 }, { label: 'Italiano', value: 96 }, { label: 'Deutsch', value: 31 }, { label: 'Français', value: 18 }],
    config: { labels: 'percent', sort: true }
  },
  choices: { labels: ['percent', 'value', 'none'] },
  mount: function (el, data, config) {
    WiMark.parts(el, data, Object.assign({}, config, { hole: 0 }));
  }
});
