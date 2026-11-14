/*
 * chart — Chart.js colored by the active theme.
 * { "data": { "labels": [], "datasets": [{ "label", "data" }] }, "config": { "type": "line" } }
 */
(function (global) {
  'use strict';

  var Widgets = global.Widgets;
  var h = Widgets.dom.h;

  Widgets.register('chart', {
    dependencies: [
      { name: 'Chart', url: 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js' }
    ],
    example: {
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
          { label: 'notes', data: [3, 7, 4, 9, 12, 10] },
          { label: 'projects', data: [1, 2, 2, 3, 5, 6] }
        ]
      },
      config: { type: 'line' }
    },
    mount: function (el, data, config) {
      if (!global.Chart) {
        el.textContent = '// chart: Chart.js not loaded';
        return;
      }

      var c = Widgets.colors();
      var palette = [c.ink, c.gray, c.graySoft, c.lineDash, c.line];

      var chartData = data || { labels: [], datasets: [] };
      var datasets = (chartData.datasets || []).map(function (ds, i) {
        var color = palette[i % palette.length];
        return Object.assign({}, ds, {
          borderColor: ds.borderColor || color,
          backgroundColor: ds.backgroundColor || color,
          borderWidth: (ds.borderWidth === undefined) ? 1 : ds.borderWidth
        });
      });

      var options = Object.assign({}, config && config.options, {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { grid: { color: c.line }, ticks: { color: c.gray } },
          y: { grid: { color: c.line }, ticks: { color: c.gray } }
        },
        plugins: {
          legend: { labels: { color: c.ink, boxWidth: 12 } },
          tooltip: { backgroundColor: c.ink, titleColor: c.bgAlt, bodyColor: c.bgAlt, borderColor: c.line, borderWidth: 1 }
        }
      });

      var box = h('div', 'w-chart');
      box.appendChild(h('canvas'));
      el.appendChild(box);

      new global.Chart(box.querySelector('canvas'), {
        type: (config && config.type) || 'bar',
        data: Object.assign({}, chartData, { datasets: datasets }),
        options: options
      });
    }
  });
})(window);
