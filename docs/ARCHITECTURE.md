# Architecture

```
site (.md + gomark.toml) ──▶ engine ──▶ output (static HTML)
                               ▲
                         CLI (main.go, cli.go)
```

`engine` never prints or exits: every operation returns a result or an error.
The CLI is a thin layer on top; any other front end can reuse it as is.

| File | Role |
|---|---|
| `engine/site.go` | `Site`, `Open`, `Load`, `Init`, `Save`, `Find`, `Out`, `Lang` |
| `engine/config.go` | `gomark.toml`: types, defaults, validation, commented output |
| `engine/section.go` | `sections/<id>.toml`: layout, columns, theme, per-section style, grid tracks |
| `engine/theme.go` | theme classes, palettes, `CheckTheme` |
| `engine/image.go`, `media.go` | image encoder (resize, JPEG/PNG, palette + dithering); image WiMark at build, `media/` |
| `engine/catalog.go` | WiMark classes, the catalog page |
| `engine/rules.go` | the WiMark rules (`CheckWidgetSource`) |
| `engine/ai.go`, `aiguard.go` | `gomark ai`: providers, proposals, apply; output checks |
| `engine/settings.go` | `Settings`, `Get`, `Set`: every value by dotted key |
| `engine/tree.go` | `Scan` and **the** depth rule (`keep`) |
| `engine/render.go` | `Build` (every language, switch links), `Render` (one page in memory) |
| `engine/ops.go` | pages, folders, sections, languages, theme, `Publish` |
| `engine/assets.go` | `Assets`, `Themes`, `Widgets`, `NewWidget`, `Asset`, static copy |
| `engine/markdown.go`, `math.go` | Goldmark, outline, `$…$` / `$$…$$`, widget detection |
| `engine/i18n.go` | interface strings |
| `main.go`, `cli.go` | commands, flags, output |
| `templates/`, `static/` | frontend |

## Site

```
mysite/
├── gomark.toml     [site] [[languages]] [style] [navigation] [strings.<lang>] [[sections]]
├── sections/       one <id>.toml per section: layout, columns, [style] overrides
├── en/<section>/…
├── it/<section>/…
├── media/          images (copied; the image WiMark writes media/_wm/)
├── widgets/        site widgets (optional)
├── .gomark/        cache/ (processed images), ai/ (proposals and their log)
└── dist/           output ([site] out): one language, or <code>/ per language
```

## Section layout

`sections/<id>.toml` is created with the section and holds only its own layout:

- `layout`: `columns` (folders · files · content · index) or `page` (one
  HTML page from `index.md`, no columns);
- `index`: `right`, `left` or `none` for the "On this page" column;
- `[columns]`: percentages of the width. Left out, the px widths of `[style]`
  are used; set, the content column takes the rest (validated to leave ≥ 10%);
- `[style]`: any value of the global `[style]`, for this section only.

Only the values written in the file are persisted: `gomark config
sections.<id>.…` rewrites the file but keeps its `[style]` table, and the
resolved style is never written back.

`Open` → decode → `normalize` (defaults) → `validate`. `Set` changes one value;
an invalid result leaves the config untouched.

## Depth

Depth is the number of path segments inside a section (`cv.md` = 1,
`a/b.md` = 2). A page is kept if depth ≤ `max_depth`; a folder if depth <
`max_depth`. The rule lives only in `keep`; skipped entries are reported, and
`new`/`mv` refuse them.

## Build

```
Build(lang, out)                  one language → out/; several → out/<code>/ + out/index.html
 ├─ clean out (keeps .git, .gitignore, CNAME, .nojekyll)
 ├─ per section: Scan → pick (lang, default, other) → images → Markdown
 │   ├─ layout "columns": <section>/<folder>/index.html, <section>/<page>/index.html
 │   └─ layout "page":    <section>/index.html from index.md
 ├─ index.html
 ├─ static/
 └─ media/ (+ media/_wm/ processed images)
```

`Render` runs the same steps in memory for one page. Links are relative, so
the site works from any sub-path and from `file://`.

## Assets

`templates/` and `static/` are embedded in the binary. When both folders sit
next to the binary or in the working folder, they are used instead, so themes
and widgets change without recompiling.

## Frontend

`layout.html` receives an `engine.Context` and picks the layout from
`DepthMode`: `home`, `flat` (files · content · outline), `multi`
(folders · files · content · outline) or `page` (no columns). The grid tracks
come from the section (`Grid`), the outline side from `Index`, the language
switch from `Switch`.

CSS: `layout.css` (geometry), `theme.css` (look, token fallbacks),
`wimark.css` (every widget, tokens only), `themes/<name>.css` (the palette).

Widgets register with `WiMark.register(name, { title, description, example, choices, mount })`
(`static/widgets.js` is the runtime; `Widgets` stays as an alias).
Go detects the widgets each page uses and loads only their scripts.
`engine.js` mounts every ```` ```widget-<name> ```` block; an empty block uses
`example`. The widget name is the file name; folders are free. Site widgets
(`<site>/widgets/`) are merged with the engine's and win on equal names; both
end up in `<out>/static/widgets/`.
