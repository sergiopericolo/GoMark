package engine

import (
	"bytes"
	"fmt"
	"image"
	"image/color"
	"image/draw"
	"image/jpeg"
	"image/png"
	"math"
	"os"
	"path/filepath"
	"strings"

	_ "image/gif" // decoding only
)

// ImageOptions drive CompressImage and the image WiMark.
type ImageOptions struct {
	Palette  string // theme name: map pixels to its palette (PNG output)
	MaxWidth int    // shrink wider images to this width; 0 = keep
	Quality  int    // JPEG quality 1..100; 0 = 82
}

// ImageStats reports a compression: sizes in bytes, output size in pixels,
// and the palette size (0 when the image is not mapped to a palette).
type ImageStats struct {
	Before, After int64
	Width, Height int
	Colors        int
}

// CompressImage reads in (PNG, JPEG or GIF) and writes out; see EncodeImage.
func CompressImage(in, out string, o ImageOptions) (ImageStats, error) {
	raw, err := os.ReadFile(in)
	if err != nil {
		return ImageStats{}, err
	}
	b, st, err := EncodeImage(raw, filepath.Ext(out), o)
	if err != nil {
		return st, fmt.Errorf("%s: %w", in, err)
	}
	if err := os.MkdirAll(filepath.Dir(out), 0o755); err != nil {
		return st, err
	}
	return st, os.WriteFile(out, b, 0o644)
}

// EncodeImage re-encodes raw. ext picks the format: .jpg/.jpeg (JPEG),
// otherwise PNG at the best compression. With o.Palette the image is mapped
// to that theme's colors with Floyd–Steinberg dithering, and must be a PNG.
func EncodeImage(raw []byte, ext string, o ImageOptions) ([]byte, ImageStats, error) {
	st := ImageStats{Before: int64(len(raw))}
	src, _, err := image.Decode(bytes.NewReader(raw))
	if err != nil {
		return nil, st, fmt.Errorf("not a PNG, JPEG or GIF image: %w", err)
	}
	if o.MaxWidth > 0 && src.Bounds().Dx() > o.MaxWidth {
		src = shrink(src, o.MaxWidth)
	}
	st.Width, st.Height = src.Bounds().Dx(), src.Bounds().Dy()
	ext = strings.ToLower(ext)
	quality := o.Quality
	if quality <= 0 || quality > 100 {
		quality = 82
	}
	var buf bytes.Buffer
	switch {
	case o.Palette != "":
		if ext != ".png" {
			return nil, st, fmt.Errorf("a palette image must be a .png (got %q)", ext)
		}
		pal, err := ThemePalette(o.Palette)
		if err != nil {
			return nil, st, err
		}
		st.Colors = len(pal)
		err = (&png.Encoder{CompressionLevel: png.BestCompression}).Encode(&buf, paletteImage(src, pal))
		if err != nil {
			return nil, st, err
		}
	case ext == ".jpg" || ext == ".jpeg":
		if err := jpeg.Encode(&buf, flatten(src), &jpeg.Options{Quality: quality}); err != nil {
			return nil, st, err
		}
	case ext == ".png":
		if err := (&png.Encoder{CompressionLevel: png.BestCompression}).Encode(&buf, src); err != nil {
			return nil, st, err
		}
	default:
		return nil, st, fmt.Errorf("output must be .png, .jpg or .jpeg (got %q)", ext)
	}
	st.After = int64(buf.Len())
	return buf.Bytes(), st, nil
}

// imageSize reads the size of an encoded image, 0×0 if it cannot.
func imageSize(b []byte) (int, int) {
	c, _, err := image.DecodeConfig(bytes.NewReader(b))
	if err != nil {
		return 0, 0
	}
	return c.Width, c.Height
}

// shrink scales src down to width w, averaging every source pixel that falls
// in an output pixel (box filter): no aliasing, no extra dependency.
func shrink(src image.Image, w int) image.Image {
	b := src.Bounds()
	h := max(1, int(math.Round(float64(b.Dy())*float64(w)/float64(b.Dx()))))
	in := image.NewNRGBA(b)
	draw.Draw(in, b, src, b.Min, draw.Src)
	out := image.NewNRGBA(image.Rect(0, 0, w, h))
	sx, sy := float64(b.Dx())/float64(w), float64(b.Dy())/float64(h)
	for y := range h {
		y0, y1 := int(float64(y)*sy), max(int(float64(y)*sy)+1, int(float64(y+1)*sy))
		for x := range w {
			x0, x1 := int(float64(x)*sx), max(int(float64(x)*sx)+1, int(float64(x+1)*sx))
			var r, g, bl, a, n float64
			for yy := y0; yy < y1 && yy < b.Dy(); yy++ {
				i := in.PixOffset(b.Min.X+x0, b.Min.Y+yy)
				for xx := x0; xx < x1 && xx < b.Dx(); xx++ {
					p := in.Pix[i : i+4]
					alpha := float64(p[3])
					r += float64(p[0]) * alpha
					g += float64(p[1]) * alpha
					bl += float64(p[2]) * alpha
					a += alpha
					n++
					i += 4
				}
			}
			o := out.PixOffset(x, y)
			if a > 0 {
				out.Pix[o], out.Pix[o+1], out.Pix[o+2] = uint8(r/a+0.5), uint8(g/a+0.5), uint8(bl/a+0.5)
			}
			out.Pix[o+3] = uint8(a/n + 0.5)
		}
	}
	return out
}

// flatten composes src on white: JPEG has no transparency.
func flatten(src image.Image) image.Image {
	out := image.NewRGBA(src.Bounds())
	draw.Draw(out, out.Bounds(), image.White, image.Point{}, draw.Src)
	draw.Draw(out, out.Bounds(), src, src.Bounds().Min, draw.Over)
	return out
}

// paletteImage maps src to pal with Floyd–Steinberg error diffusion. Alpha is
// flattened on white first, since a palette has no transparency.
func paletteImage(src image.Image, pal color.Palette) *image.Paletted {
	b := src.Bounds()
	w, h := b.Dx(), b.Dy()
	// Working copy in float RGB, so the diffused error can go past 0..255.
	work := make([]float64, w*h*3)
	for y := range h {
		for x := range w {
			// RGBA() is premultiplied: adding the missing alpha composes on white.
			r, g, bl, a := src.At(b.Min.X+x, b.Min.Y+y).RGBA()
			white := 255 - float64(a>>8)
			i := (y*w + x) * 3
			work[i] = float64(r>>8) + white
			work[i+1] = float64(g>>8) + white
			work[i+2] = float64(bl>>8) + white
		}
	}
	out := image.NewPaletted(image.Rect(0, 0, w, h), pal)
	clamp := func(v float64) uint8 { return uint8(math.Max(0, math.Min(255, math.Round(v)))) }
	spread := func(x, y int, e [3]float64, k float64) {
		if x < 0 || x >= w || y >= h {
			return
		}
		i := (y*w + x) * 3
		for c := range 3 {
			work[i+c] += e[c] * k
		}
	}
	for y := range h {
		for x := range w {
			i := (y*w + x) * 3
			idx := pal.Index(color.RGBA{clamp(work[i]), clamp(work[i+1]), clamp(work[i+2]), 255})
			out.SetColorIndex(x, y, uint8(idx))
			got := color.RGBAModel.Convert(pal[idx]).(color.RGBA)
			e := [3]float64{work[i] - float64(got.R), work[i+1] - float64(got.G), work[i+2] - float64(got.B)}
			spread(x+1, y, e, 7.0/16)
			spread(x-1, y+1, e, 3.0/16)
			spread(x, y+1, e, 5.0/16)
			spread(x+1, y+1, e, 1.0/16)
		}
	}
	return out
}
