/*
 * outline — a foldable nested list with hierarchical numbers, from indented text.
 *   ```wimark-outline {"numbers": true, "open": 1}
 *   Parsing
 *     Lexer
 *     Parser
 *   Evaluation
 *   ```
 */
WiMark.register('outline', {
  title: 'Outline',
  description: 'Indented lines as a foldable outline with numbers 1, 1.1, 1.1.1 — for plans and syllabi.',
  input: 'text',
  example: { opts: { open: 2 }, body: 'Foundations\n  Sets and functions\n  Relations\n    Equivalence relations\n    Orders\nAlgebra\n  Groups\n  Rings and fields\nAnalysis\n  Limits\n  Continuity' },
  mount: function (el, v) {
    var W = WiMark, h = W.h;
    var root = { kids: [] }, stack = [{ ind: -1, node: root }];
    W.lines(v.text).forEach(function (ln) {
      var ind = ln.match(/^\s*/)[0].replace(/\t/g, '  ').length, node = { text: ln.trim().replace(/^[-*]\s+/, ''), kids: [] };
      while (stack[stack.length - 1].ind >= ind) stack.pop();
      stack[stack.length - 1].node.kids.push(node);
      stack.push({ ind: ind, node: node });
    });
    var open = W.num(v.open, 1);
    function draw(list, prefix, depth) {
      var ul = h('ul', 'wm-outline' + (depth ? '' : ' wm-outline-root'));
      list.forEach(function (n, i) {
        var num = prefix + (i + 1), label = [v.numbers !== false ? h('span', 'wm-outline-n', num) : null, W.inline(n.text)];
        ul.appendChild(h('li', null, n.kids.length ? h('details', { open: depth < open }, h('summary', null, label), draw(n.kids, num + '.', depth + 1)) : h('div', 'wm-outline-leaf', label)));
      });
      return ul;
    }
    el.appendChild(draw(root.kids, '', 0));
  }
});
