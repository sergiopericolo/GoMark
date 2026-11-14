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
2. **One build, one language.** `gomark build` builds the first language; `-lang it` another.
3. **Missing page, copied with a notice.** A page that exists only in another language is still published.
4. **One depth rule.** A section with `max_depth = N` holds pages up to N levels; `1` is flat.
   Anything deeper is not published and always reported.

## Sites

Every site is a self-contained folder: `gomark.toml`, one content folder per
language, and its output (`dist/` by default). Commands work on the nearest
folder holding `gomark.toml`, or on `-site <dir>`.

## Widgets

A ` ```widget-<name> ` block holding `{ "data": …, "config": … }` becomes a
widget in the browser. Widgets come from the engine (`static/widgets/`) or from
the site (`<site>/widgets/`); a site widget wins over an engine widget with the
same name. The name is the file name; folders are only for order. Pages load
only the widgets they use, and an empty block shows the widget's example.

```sh
gomark widget new charts/gauge     # → <site>/widgets/charts/gauge.js
gomark widget preview gauge        # live gallery in the browser
```

## Docs

- [CLI](docs/CLI.md) — every command
- [Architecture](docs/ARCHITECTURE.md) — how the engine works
