---
name: gomark-widget
description: Create, fix or restyle a GoMark widget (WiMark) in this site, the JavaScript behind a ```wimark-<name> block. Use when the user asks for a new widget, chart, interactive diagram or visualization in a GoMark page, or when a widget does not render.
---

# GoMark widgets

A WiMark is one JavaScript file in `widgets/` (folders allowed) that calls
`WiMark.register('<file name>', …)`. A page uses it with a fenced block:

````md
```wimark-meter {"label": "coverage", "target": 80}
72
```
````

Options go on the fence line as one-line JSON; the body is JSON (an array
becomes `v.items`) or text (`input: 'text'` → `v.text`). Blocks named
`widget-…` or using a `{"data", "config"}` payload are an old format: rewrite
them as `wimark-…` with flat options.

## Loop

Work in this order and do not skip the check or the look.

1. **Reuse first.** `gomark widget` lists the site's WiMarks. Extend one if it
   fits.
2. **Create.** `gomark widget new <folder/name>` writes a file that already
   follows the rules.
3. **Read the brief.** `gomark widget context <name> "<what it shows>"`
   prints the rules, the runtime reference (every helper of
   `static/widgets.js`), the shared CSS classes and the closest WiMarks as
   models. Add `-like a,b` to pick the models. Read all of it before writing.
4. **Write** the widget from the brief.
5. **Check.** `gomark widget check widgets/<path>.js` until it prints `ok`.
   It applies the rules and parses the file with node.
6. **Look.** Use the block in a page, then `gomark build`, or
   `gomark widget preview` and open `http://localhost:8080/?only=<name>`.
   Check every theme with `&theme=light`, `dark`, `duo`, `duo-dark`. Without
   a browser tool, take a screenshot with headless Chrome:

   ```sh
   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new \
     --hide-scrollbars --window-size=1440,1200 --virtual-time-budget=4000 \
     --screenshot=/tmp/wimark.png "file://$PWD/dist/<page>/index.html"
   ```

   Headless Chrome on macOS never goes below a 500px viewport: test narrow
   layouts at 500px. Fix what you see, then check again.

## Rules that matter most

- The theme decides the look. No colors or font families in JavaScript, in
  `style`, in SVG attributes or in canvas strings. Use classes:
  `WiMark.series(i)` for series, `'wm-' + WiMark.state(name)` for states,
  `wm-line`, `wm-dot`, `wm-mark`, `wm-guide`, `wm-area-shade`, `wm-btn`,
  `wm-slider` / `wm-range`, `wm-grid` (with `--cols`), `wm-label`, `wm-delta`.
- A widget has no stylesheet of its own. `style` is for geometry only
  (width, height, margins, `--cols`).
- Build nodes with `WiMark.h` and `WiMark.svg`, text with `WiMark.inline`.
  No `innerHTML`, no `eval`, no network, no dependencies, ES5 (`var`,
  `function`).
- Prefer SVG and the runtime helpers to canvas: `WiMark.chart`,
  `WiMark.scale.linear` / `band`, `axisY`, `axisXLinear`, `WiMark.plotPath`,
  `WiMark.legend`, `WiMark.dataTable`.
- On input, clear the chart container (`textContent = ''`) and draw again.
- Throw an `Error` with a clear message on bad input: the page shows it in
  place of the widget.
- Two charts side by side: `wm-grid` with `--cols: 2` and
  `WiMark.chart(el, { width: 420, … })`, so their text keeps its size.
- Keep labels on one line: non-breaking spaces (`' '`) and hyphens
  (`'‑'`) in slider labels.
- `example` must show the widget well when the block is empty.
