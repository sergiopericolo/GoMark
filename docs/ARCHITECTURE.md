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
| `engine/settings.go` | `Settings`, `Get`, `Set`: every value by dotted key |
| `engine/tree.go` | `Scan` and **the** depth rule (`keep`) |
| `engine/render.go` | `Build`, `Render` (one page in memory), `PreviewWidgets` |
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
├── en/<section>/…
├── it/<section>/…
├── widgets/        site widgets (optional)
└── dist/           output ([site] out)
```

`Open` → decode → `normalize` (defaults) → `validate`. `Set` changes one value;
an invalid result leaves the config untouched.

## Depth

Depth is the number of path segments inside a section (`cv.md` = 1,
`a/b.md` = 2). A page is kept if depth ≤ `max_depth`; a folder if depth <
`max_depth`. The rule lives only in `keep`; skipped entries are reported, and
`new`/`mv` refuse them.

## Build

```
Build(lang, out)
 ├─ clean out (keeps .git, .gitignore, CNAME, .nojekyll)
 ├─ per section: Scan → pick (lang, default, other) → Markdown
 │   ├─ <section>/<folder>/index.html
 │   └─ <section>/<page>/index.html
 ├─ index.html
 └─ static/
```

`Render` runs the same steps in memory for one page. Links are relative, so
the site works from any sub-path and from `file://`.

## Assets

`templates/` and `static/` are embedded in the binary. When both folders sit
next to the binary or in the working folder, they are used instead, so themes
and widgets change without recompiling.

## Frontend

`layout.html` receives an `engine.Context` and picks the layout from
`DepthMode`: `home`, `flat` (files · content · outline) or `multi`
(folders · files · content · outline).

Widgets register with `Widgets.register(name, { dependencies, example, mount })`.
Go detects the widgets each page uses and loads only their scripts.
`engine.js` mounts every ```` ```widget-<name> ```` block; an empty block uses
`example`. The widget name is the file name; folders are free. Site widgets
(`<site>/widgets/`) are merged with the engine's and win on equal names; both
end up in `<out>/static/widgets/`.
