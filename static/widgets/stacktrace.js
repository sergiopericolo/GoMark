/*
 * stacktrace — a stack trace (Go, Python, JavaScript, Java) as readable frames.
 *   ```wimark-stacktrace {"mine": "gomark/"}
 *   panic: runtime error: index out of range [3] with length 3
 *   …
 *   ```
 */
WiMark.register('stacktrace', {
  title: 'Stack trace',
  description: 'A pasted stack trace: the error on top, frames as function · file:line, your own frames ("mine") highlighted, the rest foldable.',
  input: 'text',
  example: { opts: { mine: 'gomark/' }, body: 'panic: runtime error: index out of range [3] with length 3\n\ngoroutine 1 [running]:\ngomark/engine.(*builder).processImage(0xc000132000, {0xc00001a0f0, 0xf}, {0x0, 0x640, 0x52, 0x0})\n\t/src/gomark/engine/media.go:171 +0x6a5\ngomark/engine.(*builder).processImages.func1({0xc0000a4000, 0x5c, 0x5c})\n\t/src/gomark/engine/media.go:88 +0x2f1\nregexp.(*Regexp).ReplaceAllFunc(0xc0001a2000, {0xc0000a4000, 0x1f4, 0x200}, 0xc000075c58)\n\t/usr/local/go/src/regexp/regexp.go:673 +0xb1\ngomark/engine.(*builder).section(0xc000132000, {{0xc00001a0b0, 0x5}, {0x0, 0x0}})\n\t/src/gomark/engine/render.go:147 +0x285\nmain.main()\n\t/src/gomark/main.go:31 +0x1d' },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var ls = String(v.text || '').split('\n'), frames = [], head = [];
    for (var i = 0; i < ls.length; i++) {
      var l = ls[i], m;
      if ((m = /^\s*at\s+(?:(.+?)\s+\()?(.+?):(\d+)(?::\d+)?\)?$/.exec(l))) frames.push({ fn: m[1] || '(anonymous)', file: m[2], line: m[3] });
      else if ((m = /^\s*File "(.+?)", line (\d+), in (.+)$/.exec(l))) frames.push({ fn: m[3], file: m[1], line: m[2] });
      else if ((m = /^\s*at\s+([\w$.<>]+)\((.+?):(\d+)\)$/.exec(l))) frames.push({ fn: m[1], file: m[2], line: m[3] });
      else if (/^\S.*\(.*\)$/.test(l) && ls[i + 1] && (m = /^\s+(.+?):(\d+)/.exec(ls[i + 1]))) { frames.push({ fn: l.replace(/\(.*\)$/, '()'), file: m[1], line: m[2] }); i++; }
      else if (l.trim() && !/^goroutine \d+|^Traceback/.test(l)) head.push(l);
    }
    var mine = v.mine ? String(v.mine) : null;
    var row = function (f) { return h('li', 'wm-frame' + (mine && (f.file.indexOf(mine) >= 0 || f.fn.indexOf(mine) >= 0) ? ' wm-frame-mine' : ''), h('code', 'wm-frame-fn', f.fn), h('span', 'wm-frame-loc', f.file.split('/').slice(-2).join('/') + ':' + f.line)); };
    var own = frames.filter(function (f) { return !mine || f.file.indexOf(mine) >= 0 || f.fn.indexOf(mine) >= 0; });
    el.appendChild(h('div', 'wm-trace wm-neg', h('div', 'wm-trace-err', h('span', 'wm-icon', h('span', null, '✕')), h('strong', null, head.join(' ').trim() || 'error')),
      h('ol', 'wm-trace-frames', (mine ? own : frames).map(row)),
      mine && own.length < frames.length ? h('details', 'wm-trace-all', h('summary', null, 'all ' + frames.length + ' frames'), h('ol', 'wm-trace-frames', frames.map(row))) : null));
  }
});
