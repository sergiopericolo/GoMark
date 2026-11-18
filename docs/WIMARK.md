# WiMark

WiMarks are GoMark's widgets: a ```` ```widget-<name> ```` block holding
`{ "data": …, "config": … }` becomes a widget in the browser. An empty block
shows the widget's example. There are 100 engine WiMarks in four classes, one
folder each under `static/widgets/`; a site adds its own in `<site>/widgets/`.

```sh
gomark widget                   # list them by class
gomark widget preview           # the catalog, live: every widget, an editor, a theme switch
gomark widget catalog -out dir  # the same catalog as static files
gomark widget new charts/meter  # a new site widget that already follows the rules
```

The catalog uses the site's fonts, sizes and theme. Each widget has an editor:
a form for its `config`, the full JSON, and **copy markdown** to paste the block
into a page. The theme menu switches between every theme, grouped by class, to
check that nothing breaks.

## Rules

A WiMark never decides colors or fonts: the theme does (see [THEMES.md](THEMES.md)).
The engine's tests check every engine widget, and `gomark ai widget` checks
every generated one, against the same rules (`engine/rules.go`):

- one file, one `WiMark.register('<file name>', …)`, a doc comment first;
- no hex/rgb/hsl colors, no font families, no colors in `style`, SVG attributes or canvas strings;
- nodes through `WiMark.h` / `WiMark.svg` and `WiMark.inline` — no `innerHTML`, no `eval`;
- no network access (`fetch`, XHR, WebSocket, `import()`).

Series use `WiMark.series(i)` (eight, in a fixed order; a ninth folds into
"other"), states use `'wm-' + WiMark.state(name)` and always come with an icon
and a label. Charts carry a legend for two or more series, direct labels up to
four, tooltips and a collapsed data table.

## Runtime

`static/widgets.js` gives every widget the same tools: `h`, `svg`, `inline`,
`paras`, `url`, `asset`, `tabular`, `cell`, `seriesData`, `fmt`, `fmtDate`,
`scale.linear`, `scale.band`, `chart`, `parts`, `legend`, `table`, `dataTable`,
`codeBlock`, `diagram` (layered layout, boxes, links), `math.compile` (a safe
expression parser for `function` and `polar`), `store`, `copy`, `typeset`.

## Images

`image` and `gallery` are processed at build: a site image (`media/…`) is
resized to `max_width`, re-encoded (`quality`, `format`) and, with
`"palette": true` (the page's theme) or `"palette": "<theme>"`, mapped to the
theme's colors with dithering — a monochrome or bicolor site gets pictures in
its own tones. Results go to `<out>/media/_wm/` and are cached in
`<site>/.gomark/cache/`. Paths outside the site are refused with a warning.
The same encoder is a command: `gomark image in.jpg out.png [theme] -width 1200`.

## General (25)

| WiMark | What it does |
|---|---|
| `accordion` | Collapsible sections; optionally only one open at a time. |
| `badges` | Shields-style labels (label \| value) with optional state and link. |
| `bullets` | Nested list with marker per list or per item (✓ ✕ → ★ numbers…), optionally with a state. |
| `callout` | A boxed note with an icon: info, tip, success, warning, danger. |
| `cards` | A responsive grid of cards; each can link somewhere and carry tags. |
| `changelog` | Versions with typed changes, Keep-a-Changelog style. |
| `countdown` | Live time left until a date, then a message. |
| `gallery` | A grid of captioned images with a fixed ratio; build-time compression. |
| `glossary` | Terms with definitions, sorted, with a jump-to-letter index and cross references. |
| `hero` | A large opening block with title, subtitle and call-to-action buttons. |
| `image` | A figure; at build the image is resized, compressed and optionally mapped to the theme palette. |
| `kanban` | Columns of cards with counts; each column can carry a state. |
| `links` | Call-to-action buttons or a described link list. |
| `profile` | A person or project card with picture, facts and links. |
| `progress` | Labelled bars showing value against a maximum. |
| `proscons` | Advantages and drawbacks side by side, with icons. |
| `quote` | A pull quote with author, source and link. |
| `rating` | Scores as stars, dots or segments, with half steps. |
| `roadmap` | Phases with period, state (done / active / planned) and items. |
| `spoiler` | Hidden or blurred text revealed on click (answers, solutions). |
| `steps` | A numbered process with done / current / todo states. |
| `tabs` | Switch between panes of text; keyboard accessible. |
| `timeline` | Dated events along a vertical or horizontal line; optional state per event. |
| `toc` | Numbered contents of the page headings, built in the browser. |
| `todo` | A checklist with progress; the reader can tick items (kept in the browser). |

## Markdown replacements (25)

| WiMark | What it does |
|---|---|
| `annotated` | Code with numbered markers on lines and the explanations below. |
| `aside` | Main text with a side note (left or right) that stacks on narrow screens. |
| `cardtable` | Each row becomes a card with labelled fields — tables that survive phones. |
| `code` | Code with file name, line numbers, highlighted lines and copy. |
| `codecompare` | Two code blocks side by side, for before / after or two approaches. |
| `codetabs` | Several code blocks in tabs (one per language or file). |
| `columns` | Two or more columns of text: separate blocks side by side, or one flowing text. |
| `comparison` | Products against features with ✓ ✕ ◐, grouped, one product highlighted. |
| `csv` | Paste CSV (quotes, any delimiter) and get a formatted table. |
| `diff` | Line changes between two versions (computed, or from a unified diff), unified or split. |
| `filtertable` | Search across rows; optionally filter by the values of one column. |
| `footnotes` | Text with numbered references [^key] and back-linked notes. |
| `formula` | A numbered display equation (LaTeX via MathJax) with the meaning of its symbols. |
| `grouped` | Rows grouped under headings, with optional subtotals of numeric columns. |
| `highlight` | Text with ==marked== passages (marker, underline or box), Markdown has no mark. |
| `keyvalue` | Specification-style pairs in one or two columns, with notes. |
| `matrix` | Row × column grid (confusion, RACI, compatibility); numbers can be shaded. |
| `outline` | A foldable nested list with hierarchical numbering. |
| `pricing` | Plans side by side with price, features and a call to action; one highlighted. |
| `schedule` | A weekly timetable; events span slots and keep a series per kind. |
| `sortable` | Click a header to sort; numbers, dates and text each sort naturally. |
| `split` | Two panes with a chosen width ratio; each pane is text or code. |
| `table` | A richer Markdown table: column formats, alignment, caption, stripes, row headers. |
| `terminal` | A shell session; commands are copyable, output is dimmed. |
| `totals` | Adds a total (and optionally an average) row for every numeric column. |

## Developer (25)

| WiMark | What it does |
|---|---|
| `api` | Method and path, parameters table, request body and responses with examples. |
| `architecture` | Horizontal bands of components (front end, engine, storage…) with links across them. |
| `bitfield` | Fields of a register or header over numbered bits, wrapped in lanes. |
| `classdiagram` | Classes with fields and methods; extends, implements, uses and has relations. |
| `cli` | Usage line, subcommands and flags of a command, with copyable examples. |
| `env` | A reference of environment variables with a ready-to-copy .env template. |
| `erd` | Tables with keys and types, joined by labelled relations with cardinality. |
| `filetree` | A directory tree from indented text or nested data, with notes per entry. |
| `flowchart` | Nodes and arrows auto-laid out in layers (top-down or left-right), with shapes and labels. |
| `gantt` | Tasks as bars over dates with progress, milestones, groups (one series each) and today. |
| `gitgraph` | Commits on branch lanes (one series per branch) with forks, merges and tags. |
| `hexdump` | Bytes in hex with offsets and printable characters; ranges can be highlighted. |
| `http` | A request and its response with headers and pretty-printed JSON bodies. |
| `json` | Explore nested JSON: fold objects and arrays, see types and sizes, copy the whole. |
| `logs` | Log lines with level badges (icon + label) and toggles per level. |
| `mindmap` | A topic at the centre with branches around it; each first-level branch is one series. |
| `network` | Nodes and links placed by a force layout (same input, same picture); groups as series. |
| `palette` | Shows the active theme’s tokens (what every WiMark reads); switch theme to compare classes. |
| `regex` | Edit a pattern and see matches highlighted in test strings, with capture groups. |
| `sequence` | Actors with lifelines and numbered messages, replies dashed, self-calls looped. |
| `shortcuts` | Keycaps for shortcuts, grouped; Mod adapts to Mac (⌘) or others (Ctrl). |
| `stack` | Tools grouped by layer with versions, notes and links. |
| `statemachine` | States on a circle with curved, labelled transitions, initial and final states, self loops. |
| `status` | Services with state (icon + label), uptime and a history strip. |
| `tree` | A hierarchy as a tidy tree, top-down or left-right; leaves evenly spaced. |

## Data (25)

| WiMark | What it does |
|---|---|
| `area` | Filled lines over time; stacked mode shows parts adding up to a total. |
| `bar` | Compare amounts across categories; several series become grouped bars. |
| `boxplot` | Median, quartiles, whiskers and outliers for several groups side by side. |
| `bullet` | Compact bar against a target line over shaded qualitative ranges. |
| `calendar` | Every day of a year as a cell shaded by value; weeks across, weekdays down. |
| `donut` | Parts of a whole around a centre that states the total. |
| `function` | Plot math expressions of x — parsed safely, never evaluated as code; gaps at discontinuities. |
| `funnel` | Ordered stages shaded light to dark, with the share kept at each step. |
| `gauge` | One value on a half dial, with optional state bands (icon + label for the current one). |
| `hbar` | Ranked bars with readable long labels and values at the end. |
| `heatmap` | A grid shaded light to dark (one hue), with the numbers and a scale. |
| `histogram` | Distribution of values in equal bins, with the mean marked. |
| `kpi` | Big numbers with ▲▼ change (good or bad by direction), target bar and sparkline. |
| `line` | Change over an ordered axis; dashes and end labels keep series apart in every theme. |
| `lorenz` | A live simulation of the Lorenz system with sliders, Lyapunov exponent and diagnostic plots. |
| `pie` | Parts of a whole with percentages; small parts fold into “other” after eight. |
| `polar` | Curves r = f(t) for t over one or more turns, on polar rings. |
| `radar` | Profiles over several measures; best with up to three series. |
| `scatter` | Relation between two measures, up to three groups, with an optional trend line. |
| `sparkline` | Small inline trends in rows with last value, change, minimum and maximum. |
| `stacked` | Totals and their parts; in percent mode every bar is 100%. |
| `stats` | Count, mean, median, standard deviation, quartiles and range of one or more samples. |
| `treemap` | Rectangles sized by value (squarified layout) with labels where they fit. |
| `waffle` | A grid of 100 squares split by share; each square is 1%. |
| `waterfall` | Gains (▲) and losses (▼) from a start to an end, with running totals. |
