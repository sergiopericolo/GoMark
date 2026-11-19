/*
 * gallery — a grid of captioned images, compressed at build like image.
 *   ```wimark-gallery {"ratio": "4/3", "cols": 3, "max_width": 900}
 *   [["media/a.png", "Before"], ["media/b.png", "After"], "media/c.jpg"]
 *   ```
 */
WiMark.register('gallery', {
  title: 'Gallery',
  description: 'Images in a grid with a fixed ratio and captions; each is compressed at build.',
  example: { opts: { ratio: '16/10', cols: 2 }, body: [['static/wimark/sample.jpg', 'Original'], ['static/wimark/sample.jpg', 'Same file, second tile']] },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var grid = h('div', 'wm-gallery');
    grid.style.setProperty('--cols', String(Math.max(1, W.num(v.cols, 3))));
    grid.style.setProperty('--ratio', String(v.ratio || '4/3'));
    W.rows(v.items, ['src', 'caption']).forEach(function (it) {
      var src = W.asset(it.src);
      if (!src) return;
      var img = h('img', { src: src, alt: it.alt || it.caption || '', loading: 'lazy', decoding: 'async' });
      grid.appendChild(h('figure', 'wm-gallery-item', h('a', { href: W.asset(it.original || it.src) }, img), it.caption ? h('figcaption', null, W.inline(it.caption)) : null));
    });
    el.appendChild(grid);
  }
});
