# AI

`gomark ai` asks an AI to translate a page, to turn a document (PDF, DOCX,
HTML, text…) into a page, or to write a WiMark. **It never writes into the
site**: every run makes a *proposal* that you review and apply.

```sh
gomark ai translate notes/install.md -lang it      # from the default language (or -from en)
gomark ai convert ~/Downloads/report.pdf notes/report.md -lang it
gomark ai widget charts/meter "a horizontal bar for one value against a target"

gomark ai list                    # proposals: proposed, blocked, applied, discarded
gomark ai show <id>               # the checks and a diff against the current file
gomark ai apply <id> [-force]     # write it (checks run again; -force replaces a file)
gomark ai discard <id>
```

## Providers

```toml
[ai]
provider     = "anthropic"        # or "command"
model        = "claude-opus-5-5"
effort       = "high"             # low | medium | high | xhigh | max
max_input_kb = 10240
```

- **anthropic** — the Claude Messages API. The key comes only from
  `ANTHROPIC_API_KEY`. PDFs are sent as documents; a request declined by a
  safety classifier is retried server-side on a fallback model; refusals and
  answers cut at the token limit are reported, never applied.
- **command** — a program that reads the prompt on stdin and answers on stdout
  (e.g. `GOMARK_AI_COMMAND="claude -p"`). It comes only from the environment,
  never from the site, and runs without a shell. PDFs need `pdftotext`.

Every run costs tokens: the command says which provider and model it is
about to call before it does.

## Guardrails

| Risk | Guard |
|---|---|
| The AI writes or overwrites files | Proposals live in `.gomark/ai/<id>/`; only `apply` writes, only inside the site, never `gomark.toml` or `.gomark/`, never over a file without `-force`. |
| Instructions hidden in a document (prompt injection) | The document is sent as data inside `<document>` tags it cannot close; the prompt says never to follow it; and the output is checked whatever the model did. |
| A translation that changes more than words | Same headings and levels, identical code blocks, same links and inline code, same math, widget JSON with the same keys, numbers and identifiers (URLs, paths, dates, ids); length in a sane range. |
| Active content in a page | No `<script>`, `<iframe>`, `<object>`, `<style>`, `<form>`, event handlers or `javascript:` URLs; widget blocks must name existing widgets and hold valid JSON. |
| A widget that breaks the rules or the reader | The WiMark rules (no colors, fonts, `innerHTML`, `eval`, network, dependencies); `node --check` parses it (never runs it). |
| Edits between review and apply | `apply` runs the checks again on the stored file. |
| Secrets and a traceable history | Keys only from the environment; `.gomark/ai/log.jsonl` records every run (time, input hash, model, tokens, result), never the key or the content. |
| Large inputs and runaway costs | `max_input_kb`, 16 000 output tokens, 10-minute timeout, retries only on 429/5xx. |

A proposal that passes every check can still be wrong: review it with
`gomark ai show` before applying. Keep `.gomark/ai/` in version control if you
want the record, or add it to `.gitignore`.
