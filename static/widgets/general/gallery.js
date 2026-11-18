/*
 * gallery — a grid of images, compressed at build like the image WiMark.
 * data:   [{ "src", "alt", "caption"? }]
 * config: { "columns": 3, "ratio": "4/3" | "1/1" | "16/9" | "auto", "max_width": 900, "palette": false }
 */
WiMark.register('gallery', {
  title: 'Gallery',
  description: 'A grid of captioned images with a fixed ratio; build-time compression.',
  example: {
    data: [
      { src: 'static/wimark/sample.jpg', alt: 'Sunset', caption: 'Original colors' },
      { src: 'static/wimark/sample.jpg', alt: 'Sunset again', caption: 'Same file' },
      { src: 'static/wimark/sample.jpg', alt: 'And again', caption: 'Cropped to the ratio' }
    ],
    config: { columns: 3, ratio: '4/3', max_width: 900, palette: false }
  },
  choices: { ratio: ['4/3', '1/1', '16/9', 'auto'] },
  mount: function (el, data, config) {
    var W = WiMark, h = W.h;
    var ratio = /^\d+\/\d+$/.test(config.ratio) ? config.ratio.replace('/', ' / ') : 'auto';
    var grid = h('div', { class: 'wm-grid wm-gallery', style: { '--cols': String(Math.max(1, W.num(config.columns, 3))), '--ratio': ratio } });
    W.list(data).forEach(function (g) {
      var src = W.asset(g.src);
      if (!src) return;
      grid.appendChild(h('figure', 'wm-gallery-item',
        h('a', { href: W.asset(g.original || g.src) }, h('img', { src: src, alt: g.alt || '', loading: 'lazy' })),
        g.caption ? h('figcaption', null, W.inline(g.caption)) : null));
    });
    el.appendChild(grid);
  }
});
