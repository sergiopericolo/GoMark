# CLI

```
gomark <command> [args] [flags]
```

Commands run on the nearest folder holding `gomark.toml` (or `-site <dir>`).
Flags may appear anywhere. Exit codes: `0` ok, `1` error, `2` wrong usage.

## Site

| Command | |
|---|---|
| `init [dir] [title]` | create a site (default: this folder; `-force` rewrites the config, `-out` sets the output) |
| `build` | build one language (`-lang`, `-out`) |
| `serve` | serve the output (`-build`, `-addr`) |
| `render [section[/path]]` | print the HTML of the home, a section, a folder or a page |
| `publish` | `git add`, `commit`, `push` in the output folder (`-m`) |

## Content

| Command | |
|---|---|
| `tree` | sections, folders and pages of every language |
| `new <section/path.md> [title]` | create a page (`-lang`) |
| `new <section/path>` | create a folder |
| `mv <src> <dst>` | move a page or folder; its translations follow |
| `rm <section/path>` | delete a page or folder in one language |

## Settings

| Command | |
|---|---|
| `config` | list every setting, with allowed values |
| `config <key> [value]` | read or set one |
| `section` · `section add <id> [title] [depth]` · `section rm <id>` | sections (`-delete` removes folders) |
| `lang` · `lang add <code> [label]` · `lang rm <code>` | languages (the first is the default) |
| `theme [name]` | list or set the theme |
| `widget` · `widget new <[folder/]name>` · `widget preview [name…]` | list, create in `<site>/widgets/`, or preview (`-addr`) |

Setting keys: `site.*`, `style.*`, `navigation.*`, `languages.default`,
`languages.<code>.label|description`, `sections.<id>.max_depth`,
`sections.<id>.title.<code>`.

## Example

```sh
gomark init blog "Blog" && cd blog
gomark lang add it Italiano
gomark section add notes Notes 3
gomark config sections.notes.title.it Appunti
gomark new notes/go/basics.md "Go basics"
gomark new notes/go/basics.md "Basi di Go" -lang it
gomark theme dark
gomark build && gomark build -lang it -out dist-it
```
