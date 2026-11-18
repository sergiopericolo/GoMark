/*
 * roadmap — phases with a period, a state and their items.
 * data:   [{ "phase", "period"?, "state"?: "done" | "active" | "planned", "items": [] }]
 * config: { "layout": "columns" | "list" }
 */
WiMark.register('roadmap', {
  title: 'Roadmap',
  description: 'Phases with period, state (done / active / planned) and items.',
  example: {
    data: [
      { phase: 'Foundation', period: 'Q1', state: 'done', items: ['Engine', 'Sections', 'Depth rule'] },
      { phase: 'Widgets', period: 'Q2', state: 'active', items: ['100 WiMarks', 'Catalog and editor'] },
      { phase: 'AI', period: 'Q3', state: 'planned', items: ['Translate', 'Convert PDF', 'Generate widgets'] }
    ],
    config: { layout: 'columns' }
  },
  choices: { layout: ['columns', 'list'] },
  mount: function (el, data, config) {
    var W = WiMark, h = W.h;
    var labels = { done: 'done', active: 'in progress', planned: 'planned' };
    var states = { done: 'pos', active: 'warn', planned: 'info' };
    var phases = W.list(data);
    var box = h('ol', { class: 'wm-roadmap wm-roadmap-' + (config.layout === 'list' ? 'list' : 'columns'), style: { '--cols': String(Math.max(1, phases.length)) } });
    phases.forEach(function (p, i) {
      var st = states[p.state] || 'info';
      box.appendChild(h('li', 'wm-roadmap-phase wm-' + st + ' wm-roadmap-' + (p.state || 'planned'),
        h('div', 'wm-roadmap-head', h('span', 'wm-roadmap-n', String(i + 1).padStart(2, '0')), h('strong', null, W.inline(p.phase || '')),
          p.period ? h('span', 'wm-muted', p.period) : null),
        h('div', 'wm-roadmap-state', h('span', { class: 'wm-icon', 'aria-hidden': 'true' }, h('span', null, W.icon(st))), labels[p.state] || p.state || 'planned'),
        h('ul', null, W.list(p.items).map(function (it) { return h('li', null, W.inline(it)); }))));
    });
    el.appendChild(box);
  }
});
