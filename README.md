# GoMark

Markdown in, static site out. One binary, no runtime.

```sh
go install .                    # installs the gomark command

gomark init mysite "My Site"    # a site is a folder with gomark.toml
cd mysite
gomark section add notes Notes 3
gomark new notes/first.md "First page"
gomark build                    # → mysite/dist
gomark serve                    # http://localhost:8080
```

## Rules

1. **Same path, same page.** `en/notes/x.md` and `it/notes/x.md` are one page in two languages.
2. **Every page in every language.** The first language is the default. A page
   missing in a language is published anyway, with a notice. With two
   languages every page has a switch to the other; with more, a menu. One
   language builds into `dist/`; several into `dist/<code>/`.
3. **One depth rule.** A section with `max_depth = N` holds pages up to N levels; `1` is flat.
   Anything deeper is not published and always reported.
4. **The theme decides the look.** Colors live only in the theme; widgets use
   its tokens, so switching theme never breaks a page.

## Sites

Every site is a self-contained folder: `gomark.toml`, `sections/<id>.toml`
(one per section), one content folder per language, `media/` for images,
`widgets/` for its own widgets, and its output (`dist/` by default). Commands
work on the nearest folder holding `gomark.toml`, or on `-site <dir>`.

## Sections

Each section has its own `sections/<id>.toml`, created with it:

```toml
layout = "columns"   # "columns" | "page" (one HTML page, no columns)
index  = "right"     # "right" | "left" | "none" — the "On this page" column
theme  = ""          # this section only; "" = the site theme

[columns]            # percent of the width; left out = the px widths of [style]
folders = 18
files   = 22
index   = 20

[style]              # any [style] value, for this section only
body_font = "sans"
```

Or without editing files: `gomark config sections.notes.index left`.

## Themes

Three classes: **monochrome** (`light`, `dark`, `blueprint`), **bicolor**
(`duo`, `duo-dark`), **colored** (`spectrum`, `spectrum-dark`). `gomark theme
check` verifies each theme's palette against its class. See [docs/THEMES.md](docs/THEMES.md).

## WiMark

A ` ```wimark-<name> {"inline": "options"} ` block becomes a widget: 123 of them
for technical writing — theorems and proofs, equations and derivations, plots,
K-maps, data structures, API references, diagrams from plain lines, registers,
benchmarks — in one list, plus the site's own. The body is short JSON (tuples
like `["build", "passing", "ok"]`) or plain text. An empty block shows the example.

```sh
gomark widget preview              # catalog: every WiMark live, its source, a theme switch
gomark widget new charts/gauge     # → <site>/widgets/charts/gauge.js
```

The `image` WiMark compresses pictures at build and can map them to the
theme's palette. See [docs/WIMARK.md](docs/WIMARK.md).

## AI

```sh
gomark ai translate notes/first.md -lang it
gomark ai convert report.pdf notes/report.md
gomark ai widget meter "a bar for one value against a target"
gomark ai show <id> && gomark ai apply <id>
```

The AI only makes proposals; each is checked (structure, code, links, active
HTML, widget rules) and written only by `apply`. See [docs/AI.md](docs/AI.md).

## Docs

- [CLI](docs/CLI.md) — every command
- [Architecture](docs/ARCHITECTURE.md) — how the engine works
- [Themes](docs/THEMES.md) · [WiMark](docs/WIMARK.md) · [AI](docs/AI.md)

## License

[MIT](LICENSE)
