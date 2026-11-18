/*
 * image — a figure whose picture GoMark compresses at build time.
 * data:   { "src": "media/photo.jpg", "alt", "caption"?, "credit"?, "href"? }
 * config: { "max_width": 1600, "quality": 82, "format": "auto" | "jpeg" | "png",
 *           "palette": false | true | "<theme>", "display_width"?, "zoom": true }
 *
 * At build, a site image (not http…) is resized to max_width, re-encoded, and
 * with "palette" mapped to the theme's colors (true = the page's theme): the
 * monochrome and bicolor themes then show it in their own tones. The block's
 * src is rewritten to the processed file; "original" keeps the source.
 */
WiMark.register('image', {
  title: 'Image (compressed)',
  description: 'A figure; at build the image is resized, compressed and optionally mapped to the theme palette.',
  example: {
    data: { src: 'static/wimark/sample.jpg', alt: 'A lake under hills at sunset', caption: 'Compressed at build; set `palette: true` for the theme colors.', credit: 'GoMark' },
    config: { max_width: 1200, quality: 82, format: 'auto', palette: false, zoom: true }
  },
  choices: { format: ['auto', 'jpeg', 'png'] },
  mount: function (el, data, config) {
    var W = WiMark, h = W.h;
    var src = W.asset(data.src);
    if (!src) throw new Error('data.src is missing or not a safe URL');
    var img = h('img', { src: src, alt: data.alt || '', loading: 'lazy', decoding: 'async',
      width: data.width || null, height: data.height || null });
    if (config.display_width) img.style.maxWidth = W.num(config.display_width) + 'px';
    var link = W.url(data.href) || (config.zoom !== false ? W.asset(data.original || data.src) : '');
    var fig = h('figure', 'wm-image' + (config.palette ? ' wm-image-palette' : ''), link ? h('a', { href: link }, img) : img);
    if (data.caption || data.credit) {
      fig.appendChild(h('figcaption', null, data.caption ? W.inline(data.caption) : null,
        data.credit ? h('span', 'wm-muted', (data.caption ? ' · ' : '') + '© ' + data.credit) : null));
    }
    el.appendChild(fig);
  }
});
