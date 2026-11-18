/*
 * spoiler — text hidden until the reader reveals it (answers, solutions, endings).
 * data:   { "label"?, "text" }
 * config: { "mode": "blur" | "hide" }
 */
WiMark.register('spoiler', {
  title: 'Spoiler',
  description: 'Hidden or blurred text revealed on click (answers, solutions).',
  example: {
    data: { label: 'Show the answer', text: 'The depth of `a/b/c.md` is **3**.' },
    config: { mode: 'blur' }
  },
  choices: { mode: ['blur', 'hide'] },
  mount: function (el, data, config) {
    var W = WiMark, h = W.h;
    var body = h('div', { class: 'wm-spoiler-body', 'aria-hidden': 'true' }, W.paras(data.text || ''));
    var btn = h('button', { type: 'button', class: 'wm-btn', 'aria-expanded': 'false' }, data.label || W.t('show'));
    var box = h('div', 'wm-spoiler wm-spoiler-' + (config.mode === 'hide' ? 'hide' : 'blur'), btn, body);
    btn.addEventListener('click', function () {
      var open = !box.classList.contains('open');
      box.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', String(open));
      body.setAttribute('aria-hidden', String(!open));
      btn.textContent = open ? W.t('hide') : data.label || W.t('show');
    });
    el.appendChild(box);
  }
});
