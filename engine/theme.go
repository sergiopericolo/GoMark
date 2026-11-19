package engine

import (
	"fmt"
	"image/color"
	"io/fs"
	"math"
	"regexp"
	"slices"
	"sort"
	"strconv"
	"strings"
)

// Theme classes. A theme declares one in its header (" * class: <name>") and
// CheckTheme verifies it against the colors the theme actually uses.
const (
	ClassMonochrome = "monochrome" // ink on paper: neutrals, one highlight hue
)

// highlightTokens may hold the one hue a monochrome theme allows: a light
// touch for a dot, a warning or a highlight. Every other token is neutral.
var highlightTokens = []string{"--mark", "--wm-warn", "--wm-hl"}

func isHighlight(token string) bool {
	return slices.ContainsFunc(highlightTokens, func(p string) bool { return strings.HasPrefix(token, p) })
}

// ThemeClasses lists the classes in order.
var ThemeClasses = []string{ClassMonochrome}

const (
	neutralChroma = 0.06 // below this a color is a neutral (gray), not a hue
	hueTolerance  = 40.0 // degrees: hues closer than this are one family
)

var (
	themeClassRe = regexp.MustCompile(`(?m)^ \* class: (\w+)`)
	cssCommentRe = regexp.MustCompile(`(?s)/\*.*?\*/`)
	hexColorRe   = regexp.MustCompile(`#([0-9A-Fa-f]{6})\b`)
	cssVarRe     = regexp.MustCompile(`(--[a-z0-9-]+)\s*:\s*([^;]+);`)
)

// ThemeInfo is what CheckTheme found in a theme.
type ThemeInfo struct {
	Name     string
	Class    string // declared
	Families int    // hue families in the palette
	Accents  int    // of which in the highlight tokens
	Colors   int    // distinct colors
	Problems []string
}

func themeCSS(name string) (string, error) {
	if !slices.Contains(Themes(), name) {
		return "", fmt.Errorf("theme %q not found (available: %s)", name, strings.Join(Themes(), ", "))
	}
	b, err := fs.ReadFile(Assets, "static/themes/"+name+".css")
	return string(b), err
}

// ThemeClass returns the class a theme declares, "" if it declares none.
func ThemeClass(name string) string {
	src, err := themeCSS(name)
	if err != nil {
		return ""
	}
	if m := themeClassRe.FindStringSubmatch(src); m != nil {
		return m[1]
	}
	return ""
}

// ThemePalette lists the colors a theme declares, in file order, without
// duplicates. These are the only colors a palette image may use.
func ThemePalette(name string) (color.Palette, error) {
	src, err := themeCSS(name)
	if err != nil {
		return nil, err
	}
	var pal color.Palette
	seen := map[color.RGBA]bool{}
	for _, m := range hexColorRe.FindAllStringSubmatch(cssCommentRe.ReplaceAllString(src, ""), -1) {
		n, _ := strconv.ParseUint(m[1], 16, 32)
		c := color.RGBA{uint8(n >> 16), uint8(n >> 8), uint8(n), 255}
		if !seen[c] {
			seen[c] = true
			pal = append(pal, c)
		}
	}
	if len(pal) == 0 || len(pal) > 256 {
		return nil, fmt.Errorf("theme %q declares %d colors; a palette needs 1 to 256", name, len(pal))
	}
	return pal, nil
}

// requiredTokens are the color tokens every theme must define: the colors of
// the fallback :root in theme.css and every --wm-* token except the derived
// fills (--wm-fill-*, --wm-bg-*), which a theme sets only for textures.
func requiredTokens() []string {
	b, err := fs.ReadFile(Assets, "static/theme.css")
	if err != nil {
		return nil
	}
	src := cssCommentRe.ReplaceAllString(string(b), "")
	start := strings.Index(src, ":root")
	end := strings.Index(src[start:], "}")
	var out []string
	for _, m := range cssVarRe.FindAllStringSubmatch(src[start:start+end], -1) {
		name, value := m[1], m[2]
		derived := strings.HasPrefix(name, "--wm-fill-") || strings.HasPrefix(name, "--wm-bg-")
		if !derived && (strings.HasPrefix(name, "--wm-") || strings.Contains(value, "#")) && !slices.Contains(out, name) {
			out = append(out, name)
		}
	}
	return out
}

// CheckTheme verifies a theme: a known class, a palette whose hue families
// match the class, and every required token.
func CheckTheme(name string) (ThemeInfo, error) {
	info := ThemeInfo{Name: name, Class: ThemeClass(name)}
	src, err := themeCSS(name)
	if err != nil {
		return info, err
	}
	pal, err := ThemePalette(name)
	if err != nil {
		return info, err
	}
	info.Colors = len(pal)
	info.Families = hueFamilies(pal)
	body := cssCommentRe.ReplaceAllString(src, "")
	var hues []string // tokens with a hue outside the highlight tokens
	var accents color.Palette
	for _, m := range cssVarRe.FindAllStringSubmatch(body, -1) {
		for _, h := range hexColorRe.FindAllStringSubmatch(m[2], -1) {
			n, _ := strconv.ParseUint(h[1], 16, 32)
			c := color.RGBA{uint8(n >> 16), uint8(n >> 8), uint8(n), 255}
			if isHighlight(m[1]) {
				accents = append(accents, c)
			} else if _, chroma := hue(c); chroma >= neutralChroma && !slices.Contains(hues, m[1]) {
				hues = append(hues, m[1])
			}
		}
	}
	info.Accents = hueFamilies(accents)
	switch info.Class {
	case "":
		info.Problems = append(info.Problems, `no class declared (add " * class: monochrome" to the header)`)
	case ClassMonochrome:
		if len(hues) > 0 {
			info.Problems = append(info.Problems, fmt.Sprintf("monochrome but these tokens have a hue (want neutrals; a hue only in %s*): %s", strings.Join(highlightTokens, "*, "), strings.Join(hues, " ")))
		}
		if info.Accents > 1 {
			info.Problems = append(info.Problems, fmt.Sprintf("the highlight tokens use %d hue families (want one)", info.Accents))
		}
	default:
		info.Problems = append(info.Problems, fmt.Sprintf("unknown class %q (use %s)", info.Class, strings.Join(ThemeClasses, ", ")))
	}
	declared := map[string]bool{}
	for _, m := range cssVarRe.FindAllStringSubmatch(body, -1) {
		declared[m[1]] = true
	}
	var missing []string
	for _, t := range requiredTokens() {
		if !declared[t] {
			missing = append(missing, t)
		}
	}
	if len(missing) > 0 {
		info.Problems = append(info.Problems, "missing tokens: "+strings.Join(missing, " "))
	}
	return info, nil
}

// hueFamilies counts groups of hues within hueTolerance of each other,
// ignoring neutrals; the hue circle wraps at 360°.
func hueFamilies(pal color.Palette) int {
	var hues []float64
	for _, c := range pal {
		if h, chroma := hue(c); chroma >= neutralChroma {
			hues = append(hues, h)
		}
	}
	if len(hues) == 0 {
		return 0
	}
	sort.Float64s(hues)
	families, start := 1, hues[0]
	for _, h := range hues[1:] {
		if h-start > hueTolerance {
			families++
			start = h
		}
	}
	// The last family joins the first when they meet across 0°.
	if families > 1 && hues[0]+360-hues[len(hues)-1] <= hueTolerance && start != hues[0] {
		families--
	}
	return families
}

// hue returns the hue in degrees and the chroma (0..1) of c.
func hue(c color.Color) (float64, float64) {
	r16, g16, b16, _ := c.RGBA()
	r, g, b := float64(r16)/65535, float64(g16)/65535, float64(b16)/65535
	hi, lo := math.Max(r, math.Max(g, b)), math.Min(r, math.Min(g, b))
	chroma := hi - lo
	if chroma == 0 {
		return 0, 0
	}
	var h float64
	switch hi {
	case r:
		h = math.Mod((g-b)/chroma, 6)
	case g:
		h = (b-r)/chroma + 2
	default:
		h = (r-g)/chroma + 4
	}
	h *= 60
	if h < 0 {
		h += 360
	}
	return h, chroma
}
