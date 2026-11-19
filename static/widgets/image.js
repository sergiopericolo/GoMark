/*
 * image — a figure whose picture GoMark compresses at build.
 *   ```wimark-image {"src": "media/plot.png", "alt": "…", "caption": "…", "max_width": 1600, "format": "auto", "palette": false}
 *   ```
 *   format: "auto" (PNG for screenshots and transparency, JPEG for photos), "jpeg", "png"
 *   quality: JPEG 1–100 (82) · palette: true = the page's theme, or a theme name · dither: true
 *
 * At build a site image (not http…) is turned upright, resized to max_width,
 * re-encoded (never larger than the source) and with "palette" mapped to the
 * theme's colors. src is rewritten to the result; "original" keeps the source.
 */
WiMark.register('image', {
  title: 'Image',
  description: 'A numbered figure; at build the picture is resized, compressed and optionally mapped to the theme palette.',
  example: { opts: { src: 'static/wimark/sample.jpg', alt: 'A lake under hills at sunset', caption: 'Compressed at build; `"palette": true` maps it to the theme.', n: '1', max_width: 1200, format: 'auto', palette: false } },
  choices: { format: ['auto', 'jpeg', 'png'] },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var src = W.asset(v.src);
    if (!src) throw new Error('"src" is missing or not a safe URL');
    var img = h('img', { src: src, alt: v.alt || '', loading: 'lazy', decoding: 'async', width: v.w || null, height: v.h || null });
    if (v.display_width) img.style.maxWidth = W.num(v.display_width) + 'px';
    var link = W.url(v.href) || (v.zoom !== false ? W.asset(v.original || v.src) : '');
    var fig = h('figure', 'wm-image' + (v.palette ? ' wm-image-palette' : ''), link ? h('a', { href: link }, img) : img);
    if (v.caption || v.credit || v.n) {
      fig.appendChild(h('figcaption', null, v.n ? h('span', 'wm-fig-n', (v.label || 'Figure') + ' ' + v.n + '. ') : null, v.caption ? W.inline(v.caption) : null,
        v.credit ? h('span', 'wm-muted', ' · © ' + v.credit) : null));
    }
    el.appendChild(fig);
  }
});
