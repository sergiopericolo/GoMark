/*
 * pricing — plans side by side: price, period, features and an action.
 * data:   [{ "name", "price", "period"?, "text"?, "features": [], "highlight"?, "cta"?: { "label", "href" } }]
 * config: { "currency": "EUR", "badge": "recommended" }
 */
WiMark.register('pricing', {
  title: 'Pricing table',
  description: 'Plans side by side with price, features and a call to action; one highlighted.',
  example: {
    data: [
      { name: 'Personal', price: 0, period: 'forever', features: ['One site', 'All themes', 'All WiMarks'], cta: { label: 'Download', href: '#' } },
      { name: 'Team', price: 9, period: 'month', highlight: true, features: ['Shared AI quota', 'Review workflow', 'Priority fixes'], cta: { label: 'Start', href: '#' } },
      { name: 'Custom', price: 'Ask', features: ['Your design system', 'Training'], cta: { label: 'Contact', href: '#' } }
    ],
    config: { currency: 'EUR', badge: 'recommended' }
  },
  mount: function (el, data, config) {
    var W = WiMark, h = W.h;
    var plans = W.list(data);
    el.appendChild(h('div', { class: 'wm-grid wm-pricing', style: { '--cols': String(Math.max(1, plans.length)) } }, plans.map(function (p) {
      var price = typeof p.price === 'number' ? W.fmt(p.price, { style: 'currency', currency: config.currency || 'EUR', maximumFractionDigits: 2 }) : String(p.price || '');
      return h('div', 'wm-card wm-pricing-plan' + (p.highlight ? ' wm-pricing-hi' : ''),
        p.highlight && config.badge ? h('span', 'wm-pricing-badge', config.badge) : null,
        h('div', 'wm-label', p.name || ''),
        h('div', 'wm-pricing-price', price, p.period ? h('span', 'wm-muted', ' / ' + p.period) : null),
        p.text ? W.paras(p.text) : null,
        h('ul', null, W.list(p.features).map(function (f) { return h('li', null, h('span', { 'aria-hidden': 'true' }, '✓ '), W.inline(f)); })),
        p.cta && W.url(p.cta.href) ? h('a', { class: 'wm-btn' + (p.highlight ? ' wm-btn-accent' : ''), href: W.url(p.cta.href) }, p.cta.label || '→') : null);
    })));
  }
});
