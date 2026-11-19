# WiMark

WiMarks are GoMark's widgets. A fenced block whose language is
`wimark-<name>` becomes a widget in the browser; short options go on the
fence line as inline JSON, the rest in the body:

````md
```wimark-callout {"kind": "warning", "title": "Breaking change"}
`Open` now fails when `gomark.toml` is missing.
```

```wimark-badges
[["build", "passing", "ok"], ["coverage", "87%", "warn"], ["go", "1.24"]]
```

```wimark-plot {"fn": "sin(x)", "x": [-6.28, 6.28]}
```
````

- **Options** (fence line): one JSON object, kept on one line.
- **Body**: JSON for most WiMarks — an object adds keys to the options, an
  array becomes the item list (`items`). Text WiMarks (code, math, diagrams
  written as lines…) read the body as plain text instead.
- **Tuples** keep the JSON short: `["label", value, "state"]` instead of
  `{"label": …, "value": …, "state": …}`; objects work too.
- **Sections**: text bodies with several parts (tabs, columns, diffs, HTTP)
  split them with `=== Title` lines.
- **Math**: `$…$` inside any text is typeset; `$$…$$` on its own paragraph
  is display math.
- An empty block shows the WiMark's example.

There are 123 engine WiMarks, one file each in `static/widgets/`; a site
adds its own in `<site>/widgets/` (folders are free there).

```sh
gomark widget                   # list them
gomark widget preview           # the catalog, live: every WiMark, its source, a theme switch
gomark widget catalog -out dir  # the same catalog as static files
gomark widget new charts/meter  # a new site WiMark that already follows the rules
```

The catalog uses the site's fonts, sizes and theme. Each WiMark shows its
source exactly as you would write it, a form for its options and **copy
markdown**. `?only=plot,venn` shows some WiMarks, `?theme=duo` picks a theme.

## Rules

A WiMark never decides colors or fonts: the theme does (see [THEMES.md](THEMES.md)).
The engine's tests check every engine WiMark, and `gomark ai widget` checks
every generated one, against the same rules (`engine/rules.go`):

- one file, one `WiMark.register('<file name>', …)`, a doc comment first;
- no hex/rgb/hsl colors, no font families, no colors in `style`, SVG attributes or canvas strings;
- nodes through `WiMark.h` / `WiMark.svg` and `WiMark.inline` — no `innerHTML`, no `eval`;
- no network access (`fetch`, XHR, WebSocket, `import()`).

Series use `WiMark.series(i)` (eight, in a fixed order; a ninth folds into
"other"), states use `'wm-' + WiMark.state(name)` and always come with an icon
and a label.

## Writing one

```js
WiMark.register('meter', {
  title: 'Meter', description: 'One value against a target.',
  input: 'json',                      // or 'text': the body arrives as v.text
  example: { opts: { label: 'coverage', target: 80 }, body: 72 },
  mount: function (el, v) { /* v = defaults + options + body (v.items, v.value or keys) */ }
});
```

## Runtime

`static/widgets.js` gives every WiMark the same tools: `h`, `svg`, `inline`
(with `$math$`), `prose`, `tex`, `rows` (tuples → objects), `lines`,
`sections`, `url`, `asset`, `cell`, `fmt`, `fmtDate`, `scale.linear`,
`scale.band`, `chart`, `plotPath`, `parts`, `legend`, `table`, `grid`
(sortable, filterable), `parseCSV`, `dataTable`, `codeBlock`, `diagram`
(layered layout, boxes, links), `math.compile` (a safe expression parser),
`math.value`, `store`, `copy`, `typeset`.

## Images

`image` and `gallery` are processed at build. A site image (`media/…`) is:

1. turned upright from its EXIF orientation (JPEG);
2. shrunk to `max_width` (1600, gallery 900) — never enlarged;
3. re-encoded: `"format": "auto"` (default) keeps screenshots, diagrams and
   anything with transparency as a lossless indexed PNG when it has up to
   256 colors, and makes photos JPEG (`quality`, default 82); `"jpeg"` and
   `"png"` force one;
4. with `"palette": true` (the page's theme) or `"palette": "<theme>"`,
   mapped to the theme's colors with Floyd–Steinberg dithering
   (`"dither": false` for flat areas and smaller files); transparency is kept;
5. kept as it was when nothing needed to change and re-encoding would only
   make it larger.

Results go to `<out>/media/_wm/` and are cached in `<site>/.gomark/cache/`
(keyed by content, options and encoder version). Paths outside the site are
refused with a warning.

## All WiMarks

| WiMark | body | What it does |
|---|---|---|
| `adr` | JSON | An architecture decision record (ADR) with status, context, decision and consequences. |
| `algorithm` | text | Numbered pseudocode: indentation kept, keywords set in bold, $math$ typeset, // comments dimmed. |
| `annotated` | text | Code with numbered markers on the lines named in "notes" and the explanations listed below. |
| `architecture` | JSON | Horizontal bands {"Layer": ["component", …]} with "A > B" links across them (dashed with "A ..> B"). |
| `array` | JSON | Array cells with indices, named pointers (i, j, lo, hi), marked cells and ranges; "steps" makes it a walkthrough. |
| `badges` | JSON | Shields-style label \| value badges; a state adds an icon, a fourth slot a link. |
| `bar` | JSON | Bars from [label, value] pairs or grouped series; "horizontal" for long, ranked labels. |
| `bases` | JSON | Integers in binary, octal, decimal and hexadecimal; negatives in two’s complement over "bits". |
| `beforeafter` | text | Two code blocks side by side ("=== Before" / "=== After", or any two titles), marked ✕ and ✓. |
| `benchmark` | JSON | Benchmarks [name, base, new, …] in one unit with the change ▲▼ against the first column, good or bad by "better". |
| `binarytree` | JSON | A binary tree from a level-order array (heaps, BSTs, LeetCode style); "mark" highlights values, "heap" shows indices. |
| `bitfield` | JSON | Register or flag fields [name, width, note?] from bit 0 upwards over numbered bits; null is reserved. |
| `boxplot` | JSON | Groups side by side: median, quartiles, whiskers at 1.5 IQR and outliers as dots. |
| `callout` | text | A boxed note with an icon and a title: note, tip, important, warning, danger. |
| `cases` | JSON | A piecewise definition from [value, condition] pairs; word conditions are set as text. |
| `changelog` | JSON | Releases with added, changed, deprecated, removed, fixed and security entries. |
| `checklist` | JSON | Items the reader can tick, with progress; ["item", true] starts ticked. Kept per browser. |
| `classdiagram` | JSON | Classes as {"Name < Parent : Interface": ["+field: type", "+method()"]}; fields and methods split, relations drawn. |
| `cli` | JSON | A command: usage line, summary, flags [flag, description, default?], subcommands and copyable examples. |
| `code` | text | Code with file name, language, line numbers from any start, highlighted lines ("2,4-6") and copy. |
| `codetabs` | text | Code blocks in tabs, one per "=== Language" or "=== file.ext" section; the choice is remembered. |
| `columns` | text | Two or more columns of text, each started by a "=== Title" line; stacks on phones. |
| `compare` | JSON | Options against features with ✓ ✕ ◐ or text; "# title" rows group features, one column is highlighted. |
| `complex` | JSON | Complex numbers "a+bi" on the Argand plane, with \|z\| and arg z listed. |
| `complexity` | JSON | Algorithms against bounds in O-notation; each bound is graded from constant to exponential. |
| `config` | JSON | Settings as [key, type, default, description]; a copyable sample file (TOML, YAML or env) is generated from the defaults. |
| `constants` | JSON | Constants as [symbol, value, unit, name]: symbol and unit in LaTeX, value copyable. |
| `coverage` | JSON | Coverage per package or file as bars, graded against "good" and "warn" thresholds, with the total. |
| `cron` | JSON | A five-field cron expression: each field explained, a sentence, and the next runs in the reader’s time zone. |
| `csv` | text | CSV or TSV text (quoted fields; the separator is guessed when omitted) as a sortable table. |
| `definition` | text | A numbered definition; the term is set in bold and can be linked to. |
| `deprecated` | text | A deprecation notice with the version, the replacement and the planned removal. |
| `deps` | JSON | Dependencies [name, version, license, purpose, url?] with a count by license. |
| `derivation` | JSON | Step-by-step equalities aligned on the relation, each with a reason in plain text. |
| `details` | text | A collapsible block for long explanations, derivations or solutions. |
| `diff` | text | A unified diff as is, or two versions compared line by line; unified or split view, context lines. |
| `distribution` | JSON | Density or mass function of normal, uniform, exponential, binomial or Poisson, with P(a ≤ X ≤ b), mean and variance. |
| `donut` | JSON | Parts of a whole with percentages and the total in the centre; past eight, parts fold into "other". |
| `endpoint` | JSON | Method and path, summary, auth, parameters [name, in, type, description], request body and example responses. |
| `env` | JSON | Variables as [NAME, "required" or default, example, description] and a .env template to copy. |
| `erd` | JSON | Tables as {"table": ["column type? pk\|fk table\|unique", …]}; foreign keys become relations, laid out in layers. |
| `errors` | JSON | Error codes [code, status?, meaning, fix] with the HTTP status graded; searchable when long. |
| `example` | text | A worked example with number and title, set apart from the main text. |
| `exercise` | JSON | A question with difficulty, an optional hint and an answer revealed on click. |
| `filetree` | text | Indented lines as a directory tree with guides; a trailing "/" marks folders, "# text" adds a note, "*" highlights. |
| `flamegraph` | text | Folded stacks ("main;parse;lex 30", as from pprof or perf) as a flame graph: width = samples; click to zoom. |
| `flowchart` | text | Lines "A -> B: label" (chains allowed, -.-> dashed) laid out in layers; "X?" is a decision, start and end are rounded. |
| `fourier` | JSON | A square, sawtooth or triangle wave and its partial Fourier sum; a slider sets the number of terms. |
| `gallery` | JSON | Images in a grid with a fixed ratio and captions; each is compressed at build. |
| `gantt` | JSON | Tasks [name, start, end, progress %, group] as bars over dates; no end is a milestone ◆; a line marks today. |
| `geometry` | JSON | Points by coordinates, then segments "AB", polygons "ABC", "circle O r", "angle BAC" — to scale. |
| `gitgraph` | text | Lines "commit msg", "branch b", "checkout b", "merge b", "tag t" drawn as commits on branch lanes. |
| `glossary` | JSON | Terms with definitions, sorted, with a jump-to-letter index; [[Term]] links another entry. |
| `graph` | JSON | Vertices and edges from "a-b", "a>b", "a-b:5" strings; circle or force layout; degrees in tooltips. |
| `growth` | JSON | Complexity classes as curves of n on one chart, optionally on a log scale. |
| `heatmap` | JSON | Rows × columns of numbers shaded in one hue (5 steps) with values: confusion matrices, correlations, latency grids. |
| `hexdump` | text | Bytes (hex, or text with "ascii": true) with offsets and ASCII; "mark": [[start, length, label]] highlights fields. |
| `histogram` | JSON | Values counted in equal bins, with the mean and the median marked. |
| `http` | text | A raw request and response (split at the "HTTP/" status line or by "===" sections); JSON bodies pretty-printed. |
| `ieee754` | JSON | The bits of a float32 or float64: sign, exponent, mantissa, the exact stored value and the rounding error. |
| `image` | JSON | A numbered figure; at build the picture is resized, compressed and optionally mapped to the theme palette. |
| `json` | text | Nested JSON with folding, types, item counts and copy; "open" sets how many levels start unfolded. |
| `keys` | JSON | Keyboard shortcuts as keycaps; "+" joins keys, a space makes a sequence, Mod adapts to the OS. |
| `kmap` | JSON | A K-map for 2–4 variables from minterms and don’t-cares, with a minimal sum of products (Quine–McCluskey). |
| `layers` | JSON | A stack of layers, top to bottom: [name, examples, note?] — network models, software layers, abstraction levels. |
| `lifecycle` | JSON | Since when an API exists, when it changed, was deprecated or removed, and what replaces it. |
| `line` | JSON | One line per series over labels; dashes and end labels keep series apart in every theme. |
| `linkedlist` | JSON | A singly or doubly linked list with named pointers (head, tail, slow, fast) and an optional cycle back to a node. |
| `logs` | text | Log lines; the level (DEBUG INFO WARN ERROR FATAL, or level=…) becomes a badge with icon, each level can be hidden. |
| `lorenz` | JSON | A live simulation of the Lorenz system with sliders, Lyapunov exponent and diagnostic plots. |
| `math` | text | A numbered display equation (LaTeX); several lines stack, & aligns them; "where" explains the symbols. |
| `matrix` | JSON | A matrix or vector from JSON rows ([1, 2] is a column vector); brackets b p v B V. |
| `memory` | JSON | Regions [name, size, note?] stacked from a base address with start and end offsets: segments, struct padding, file formats. |
| `metrics` | JSON | Key numbers as cards [label, value, change?, good\|bad?]: the change gets ▲▼ and a state, never color alone. |
| `mindmap` | text | Indented lines as a radial map: the first line in the centre, each first-level branch in its own series. |
| `numberline` | JSON | Intervals in interval notation ("[a, b)", "(-inf, 2]") and labelled points on the real line. |
| `outline` | text | Indented lines as a foldable outline with numbers 1, 1.1, 1.1.1 — for plans and syllabi. |
| `packet` | JSON | A protocol header [field, bits] drawn in rows of 32 bits with offsets, like the diagrams of RFCs. |
| `palette` | JSON | The tokens of the active theme (series, states, heat steps, surfaces) read live: switch theme to compare. |
| `parametric` | JSON | Curves x(t), y(t) — Lissajous, cycloids, astroids — drawn at equal scale. |
| `params` | JSON | Parameters as [name, type, description, default?]; "name?" is optional, everything else required. |
| `pipeline` | JSON | Stages [name, state, duration, jobs?] joined by arrows: ok, failed, running, pending, skipped — each with icon and label. |
| `plot` | JSON | Plot expressions of x with gaps at discontinuities; ranges accept "2pi"; marked points. |
| `polar` | JSON | Curves r = f(t) over one or more turns on polar rings and spokes: roses, cardioids, spirals. |
| `proof` | text | A proof, closed by a tombstone ∎; "fold" hides it behind a click. |
| `props` | JSON | Specification-style key / value pairs with notes, in one or two columns. |
| `query` | text | A query ("=== sql") and its result as CSV ("=== result"), with the row count and timing. |
| `quote` | text | A quotation with author, source and link: epigraphs and citations. |
| `recurrence` | JSON | Terms of a recurrence (a = previous term, b = the one before, n = index), as a list and a chart. |
| `references` | JSON | A numbered bibliography: [key, authors, title, year, url?]; each entry gets the anchor #ref-key. |
| `regex` | text | An editable pattern with flags; matches highlighted in each sample line, capture groups listed. |
| `riemann` | JSON | Rectangles (left, right, midpoint) or trapezoids under f, the sum, the integral and the error. |
| `scatter` | JSON | Points per group on two numeric axes, with a least-squares line, its equation and R². |
| `sequence` | text | Lines "A -> B: text" (--> for replies, A -> A for self calls, "note A: …") as lifelines with numbered messages. |
| `signature` | JSON | One function or method: highlighted signature, summary, parameters, return value, errors, since and an example. |
| `slopefield` | JSON | The direction field of an ODE dy/dx = f(x, y); "through" draws solutions through points (RK4). |
| `sparkline` | JSON | Rows of tiny line charts with the last value, the change, the minimum and the maximum. |
| `stacktrace` | text | A pasted stack trace: the error on top, frames as function · file:line, your own frames ("mine") highlighted, the rest foldable. |
| `statemachine` | text | Lines "A -> B: event" as states on a circle with curved transitions; [*] marks initial and final states. |
| `stats` | JSON | n, mean, standard deviation, min, quartiles, max and a 95% confidence interval of each sample. |
| `status` | JSON | Services [name, state, uptime, history] with icon and label; history "ooo!x" is a strip of up, degraded, down. |
| `steps` | JSON | A numbered procedure: each step a line of text or a title with its explanation. |
| `struct` | JSON | A struct, record or message: fields [name, type, note]; "type?" marks optional, sizes add up when given. |
| `symbols` | JSON | A table of symbols (LaTeX) and their meaning: the notation section of a paper. |
| `system` | text | Equations one per line, grouped by a brace and aligned on =, ≤ or ≥; optional solution line. |
| `table` | JSON | A table from rows of JSON: alignment (l c r per column), caption, sorting, filtering, a totals row. |
| `tabs` | text | Panes of text behind tabs, each started by a "=== Title" line; keyboard accessible. |
| `terminal` | text | A shell session: lines starting with "$ " or "> " are commands with a copy button, "# " are comments, the rest is output. |
| `tests` | JSON | Test results [name, pass\|fail\|skip, duration, message?] with totals and failures first. |
| `theorem` | text | Theorem, lemma, proposition, corollary, axiom, conjecture or remark, numbered and named. |
| `timeline` | JSON | Dated events on a line: ["date", "title", "text"?, "state"?]. |
| `tldr` | text | A short summary box with the key points of a page, one per line. |
| `toc` | JSON | Numbered contents of the page headings (h2–h4), built when the page loads. |
| `tradeoffs` | JSON | Pros and cons of a design choice side by side, with icons. |
| `tree` | text | Indented lines drawn as a tidy tree, top-down or left-right: parse trees, hierarchies, decision trees. |
| `treemap` | JSON | Sizes as nested rectangles (squarified); "dir/file" paths group by their first part — bundle and disk usage. |
| `truthtable` | JSON | Every row of one or more boolean expressions, computed; tautologies and contradictions flagged. |
| `unitcircle` | JSON | Angles (degrees) on the unit circle with cos and sin projections and a value table. |
| `vectorfield` | JSON | A 2D vector field F(x, y) = (dx, dy) as arrows of equal length, shaded by magnitude. |
| `vectors` | JSON | Vectors as arrows on a square grid: [name, [x, y], from?, "dashed"?] — sums, projections, bases. |
| `venn` | JSON | Two or three sets as circles; region keys A, B, AB, ABC… hold the elements, "out" the rest. |
| `waterfall` | JSON | Phases [name, start, end] on one time axis — request timing, startup phases, pipeline stages — with durations. |
| `wave` | JSON | Digital signals from WaveDrom-like strings: p clock, 0/1 levels, x unknown, z high-Z, = data with labels, . repeats. |
