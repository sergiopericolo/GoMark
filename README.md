# GoMark

Markdown in, static site out. One binary, no runtime.

```sh
go install .
gomark init mysite "My Site"
cd mysite
gomark section add notes Notes 3
gomark new notes/first.md "First page"
gomark build          # → dist/
gomark serve          # http://localhost:8080
```

`gomark help` lists every command and flag.

## Sites

A site is a folder:

```
gomark.toml      settings: languages, style, sections, ai
sections/        one <id>.toml per section (layout, columns, theme)
en/<section>/    pages, one folder per language
media/           images
widgets/         the site's widgets
dist/            output
```

- The same path in two languages is the same page. A missing translation is
  published from another language, with a notice.
- A section with `max_depth = N` holds pages up to N levels deep. Deeper pages
  are skipped and reported.
- Colors live only in the theme. One monochrome theme ships: `light`,
  anthracite on ivory, with code in a dark pane and one warm yellow kept for
  a dot, a notice or a highlight (`--mark*`, `--wm-warn*`, `--wm-hl*` only).
  Widgets spend it the same way: see the widget brief.
  `gomark theme check` verifies it.
- Every build writes a search index. Press `⌘K`, `Ctrl K` or `/` on any page.

## Widgets

A fenced block named `wimark-<name>` becomes a widget:

````md
```wimark-meter {"label": "coverage", "target": 80}
72
```
````

GoMark ships no widgets. Each site writes its own in `widgets/`:

```sh
gomark widget new meter                         # from a template
gomark widget context meter "one value vs a target"   # the brief: rules, runtime, models
gomark widget check                             # rules + syntax for every widget
gomark widget preview                           # see them live, in every theme
```

A widget is one JS file calling `WiMark.register`. The runtime
(`static/widgets.js`) provides the helpers. The theme decides the colors and
fonts, so widgets use classes, never colors.

With Claude Code, run `gomark widget skill` once in the site. It installs
`.claude/skills/gomark-widget/SKILL.md`, and Claude Code then writes widgets
in a loop: brief, write, check, look, fix.

## AI

```sh
gomark translate notes/first.md          # into every language that misses it
gomark translate notes/first.md -lang it # into one language (-force replaces it)
gomark ai convert report.pdf notes/report.md
gomark ai show <id>
gomark ai apply <id>
```

`translate` is one step: it reads the page from the language that has it,
checks the translation and writes it. A translation must keep the text as it
is: same paragraphs, list items, table rows, code, links and formulas, and
widget blocks copied exactly. A translation that fails a check is not written:
it stays a proposal in `.gomark/ai/` to fix and `apply`. The other AI commands
only write proposals, and nothing goes into the site until `apply`.

Set the provider once in `[ai]`; keys come from the environment only:

| `provider` | Key | Notes |
|---|---|---|
| `deepseek` | `DEEPSEEK_API_KEY` | `model = "deepseek-flash"` (or `deepseek-v4-pro`); `effort` low/medium → low, high → high, xhigh/max → max |
| `anthropic` | `ANTHROPIC_API_KEY` | |
| `openai` | `OPENAI_API_KEY` | any compatible API via `GOMARK_AI_ENDPOINT` |
| `command` | — | runs `GOMARK_AI_COMMAND`, e.g. `claude -p` |

## License

[MIT](LICENSE)
