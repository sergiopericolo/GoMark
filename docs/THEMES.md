# Themes

A theme is one file in `static/themes/`. It declares its **class** in the
header and every color it uses; nothing else in GoMark holds a color.

```css
/*
 * class: bicolor
 * GoMark theme — duo: white panels, slate and amber.
 */
:root { --bg: #FFFFFF; … --wm-1: #4D576A; … }
```

| Class | Palette | Bundled |
|---|---|---|
| `monochrome` | one hue family (plus neutrals) | `light`, `dark`, `blueprint` |
| `bicolor` | exactly two hue families | `duo`, `duo-dark` |
| `colored` | three or more | `spectrum`, `spectrum-dark` |

```sh
gomark theme              # list, with classes
gomark theme duo          # use one
gomark theme check        # verify every theme: class vs palette, all tokens present
gomark config sections.notes.theme spectrum   # one section only
```

`gomark theme check` reads the colors a theme declares, groups their hues
(neutrals ignored) and compares the number of families with the class. It also
checks that the theme defines every token of `static/theme.css` and every
`--wm-*` token — a theme missing one would break some widget.

## Tokens widgets read

| Token | Job |
|---|---|
| `--wm-1` … `--wm-8` | series, in a fixed order (never cycled) |
| `--wm-on-1` … `--wm-on-8` | text on a series fill |
| `--wm-dash-1` … `--wm-dash-8` | line dashes per series |
| `--wm-fill-N`, `--wm-bg-N` | optional textures for fills (SVG and HTML) |
| `--wm-pos` `--wm-neg` `--wm-warn` `--wm-info` (+ `-soft`, `--wm-on-…`) | states, always with icon and label |
| `--wm-heat-0` … `--wm-heat-4` | sequential ramp, one hue, low → high |
| `--wm-accent`, `--wm-on-accent`, `--wm-soft`, `--wm-grid` | highlight, subtle fill, chart grid |

## Why widgets never break across classes

Colors alone never carry meaning. In a monochrome theme eight series cannot be
told apart by hue, so the theme gives series 4–8 **dashes** (lines) and
**textures** (fills: 45°/135° hatching drawn by the runtime); legends draw the
same dash and texture, charts add direct labels and a data table. States differ
by **icon and shape** too (✓ round, ✕ square, ! diamond). A bicolor theme
alternates its two hues and adds dashes past the fourth series; a colored theme
uses eight validated hues (colorblind-safe order, checked for both light and
dark surfaces).

## Making a theme

Copy a theme of the class you want, change the colors, keep every token, then
run `gomark theme check`. Fonts and sizes are not in themes: they come from
`[style]` in `gomark.toml` (or a section's own `[style]`).
