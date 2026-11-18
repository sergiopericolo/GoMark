/*
 * callout — a highlighted note: info, tip, warning or danger.
 * data:   { "type": "info" | "tip" | "success" | "warning" | "danger", "title"?, "text" }
 * config: { "collapsible": false, "open": true }
 */
WiMark.register('callout', {
  title: 'Callout',
  description: 'A boxed note with an icon: info, tip, success, warning, danger.',
  example: {
    data: { type: 'warning', title: 'Before you publish', text: 'Run `gomark build` and check the **skipped** entries.\n\nPages deeper than `max_depth` are never published.' },
    config: { collapsible: false, open: true }
  },
  choices: { type: ['info', 'tip', 'success', 'warning', 'danger'] },
  mount: function (el, data, config) {
    var W = WiMark, h = W.h;
    var type = String(data.type || config.type || 'info').toLowerCase();
    var labels = { info: 'Info', note: 'Note', tip: 'Tip', success: 'Success', warning: 'Warning', danger: 'Danger', error: 'Error' };
    var st = W.state(type);
    var head = h('div', 'wm-callout-head', h('span', { class: 'wm-icon', 'aria-hidden': 'true' }, h('span', null, W.icon(type))),
      h('strong', null, W.inline(data.title || labels[type] || type)));
    var body = h('div', 'wm-callout-body', W.paras(data.text || ''));
    var box;
    if (config.collapsible) {
      box = h('details', { class: 'wm-callout wm-' + st, open: config.open !== false }, h('summary', null, head), body);
    } else {
      box = h('aside', { class: 'wm-callout wm-' + st, role: st === 'neg' || st === 'warn' ? 'alert' : 'note' }, head, body);
    }
    el.appendChild(box);
  }
});
