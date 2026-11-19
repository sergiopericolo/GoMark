package engine

import (
	"bytes"
	"encoding/binary"
	"fmt"
	"image"
	"image/color"
	"image/draw"
	"image/jpeg"
	"image/png"
	"math"
	"strings"

	_ "image/gif" // decoding only
)

// ImageOptions drive the image WiMark.
type ImageOptions struct {
	Palette  string // theme name: map pixels to its palette (PNG output)
	MaxWidth int    // shrink wider images to this width; 0 = keep
	Quality  int    // JPEG quality 1..100; 0 = 82
	Format   string // "auto" (or ""), "jpeg" or "png"
	NoDither bool   // palette images: nearest color only, no error diffusion
}

// ImageStats reports a compression: sizes in bytes, output size in pixels,
// and the palette size (0 when the image is not mapped to a palette).
type ImageStats struct {
	Before, After int64
	Width, Height int
	Colors        int
	Kept          bool // the source was smaller than any re-encoding: kept as is
}

// encoderVersion is part of the cache key of processed images: changing the
// encoder re-encodes them.
const encoderVersion = 2

// EncodeImage re-encodes raw and returns the bytes and their extension.
//
//   - JPEG photos are turned upright from their EXIF orientation.
//   - Wider images shrink to o.MaxWidth (box filter); smaller ones are not enlarged.
//   - "auto" picks PNG for images with transparency or up to 256 colors
//     (screenshots, diagrams: stored as an indexed PNG, losslessly) and JPEG
//     for everything else (photos).
//   - With o.Palette the image is mapped to that theme's colors with
//     Floyd–Steinberg dithering; transparent pixels stay transparent.
//   - An image that needs no change and would only grow is returned as it was.
func EncodeImage(raw []byte, o ImageOptions) ([]byte, string, ImageStats, error) {
	st := ImageStats{Before: int64(len(raw))}
	dec, kind, err := image.Decode(bytes.NewReader(raw))
	if err != nil {
		return nil, "", st, fmt.Errorf("not a PNG, JPEG or GIF image: %w", err)
	}
	src := toNRGBA(dec)
	changed := false
	if kind == "jpeg" {
		if or := exifOrientation(raw); or > 1 && or <= 8 {
			src, changed = orient(src, or), true
		}
	}
	if o.MaxWidth > 0 && src.Rect.Dx() > o.MaxWidth {
		src, changed = shrink(src, o.MaxWidth), true
	}
	st.Width, st.Height = src.Rect.Dx(), src.Rect.Dy()

	format := strings.ToLower(o.Format)
	if format == "jpg" {
		format = "jpeg"
	}
	alpha := hasAlpha(src)
	var own color.Palette // the image's own colors, nil past 256
	switch {
	case o.Palette != "":
		if format == "jpeg" {
			return nil, "", st, fmt.Errorf("a palette image is a PNG, not a JPEG")
		}
		format = "png"
	case format == "" || format == "auto":
		if own = ownPalette(src); alpha || own != nil {
			format = "png"
		} else {
			format = "jpeg"
		}
	case format == "png":
		own = ownPalette(src)
	case format != "jpeg":
		return nil, "", st, fmt.Errorf("format must be auto, jpeg or png (got %q)", o.Format)
	}

	var buf bytes.Buffer
	enc := png.Encoder{CompressionLevel: png.BestCompression}
	switch {
	case o.Palette != "":
		pal, err := ThemePalette(o.Palette)
		if err != nil {
			return nil, "", st, err
		}
		st.Colors = len(pal)
		err = enc.Encode(&buf, paletteImage(src, pal, alpha, !o.NoDither))
		if err != nil {
			return nil, "", st, err
		}
	case format == "jpeg":
		q := o.Quality
		if q <= 0 || q > 100 {
			q = 82
		}
		if err := jpeg.Encode(&buf, flatten(src), &jpeg.Options{Quality: q}); err != nil {
			return nil, "", st, err
		}
	case own != nil:
		if err := enc.Encode(&buf, indexed(src, own)); err != nil {
			return nil, "", st, err
		}
	default:
		if err := enc.Encode(&buf, src); err != nil {
			return nil, "", st, err
		}
	}
	ext := map[string]string{"jpeg": ".jpg", "png": ".png"}[format]
	// Re-encoding must never cost bytes: an image already in the right format,
	// with nothing to resize, rotate or map, stays as it was when smaller.
	if !changed && o.Palette == "" && kind == format && len(raw) <= buf.Len() {
		st.After, st.Kept = int64(len(raw)), true
		return raw, ext, st, nil
	}
	st.After = int64(buf.Len())
	return buf.Bytes(), ext, st, nil
}

// imageSize reads the size of an encoded image, 0×0 if it cannot.
func imageSize(b []byte) (int, int) {
	c, _, err := image.DecodeConfig(bytes.NewReader(b))
	if err != nil {
		return 0, 0
	}
	return c.Width, c.Height
}

// toNRGBA copies any image into non-premultiplied RGBA at the origin.
func toNRGBA(src image.Image) *image.NRGBA {
	b := src.Bounds()
	out := image.NewNRGBA(image.Rect(0, 0, b.Dx(), b.Dy()))
	draw.Draw(out, out.Rect, src, b.Min, draw.Src)
	return out
}

// hasAlpha reports whether any pixel is not fully opaque.
func hasAlpha(img *image.NRGBA) bool {
	for i := 3; i < len(img.Pix); i += 4 {
		if img.Pix[i] != 255 {
			return true
		}
	}
	return false
}

// ownPalette lists the image's colors, or nil when there are more than 256.
func ownPalette(img *image.NRGBA) color.Palette {
	seen := map[uint32]bool{}
	var pal color.Palette
	for i := 0; i < len(img.Pix); i += 4 {
		p := img.Pix[i : i+4]
		k := uint32(p[0])<<24 | uint32(p[1])<<16 | uint32(p[2])<<8 | uint32(p[3])
		if !seen[k] {
			if len(pal) == 256 {
				return nil
			}
			seen[k] = true
			pal = append(pal, color.NRGBA{p[0], p[1], p[2], p[3]})
		}
	}
	return pal
}

// indexed stores img with its own palette (it holds every color: lossless).
func indexed(img *image.NRGBA, pal color.Palette) *image.Paletted {
	idx := make(map[color.NRGBA]uint8, len(pal))
	for i, c := range pal {
		idx[c.(color.NRGBA)] = uint8(i)
	}
	out := image.NewPaletted(img.Rect, pal)
	for i, j := 0, 0; i < len(img.Pix); i, j = i+4, j+1 {
		out.Pix[j] = idx[color.NRGBA{img.Pix[i], img.Pix[i+1], img.Pix[i+2], img.Pix[i+3]}]
	}
	return out
}

// exifOrientation reads the EXIF orientation (1–8) of a JPEG, 1 if absent.
func exifOrientation(raw []byte) int {
	if len(raw) < 4 || raw[0] != 0xFF || raw[1] != 0xD8 {
		return 1
	}
	for i := 2; i+4 <= len(raw) && raw[i] == 0xFF; {
		marker, size := raw[i+1], int(binary.BigEndian.Uint16(raw[i+2:]))
		if marker == 0xDA || size < 2 || i+2+size > len(raw) {
			break // start of scan: no more metadata
		}
		seg := raw[i+4 : i+2+size]
		if marker == 0xE1 && len(seg) > 14 && string(seg[:6]) == "Exif\x00\x00" {
			return tiffOrientation(seg[6:])
		}
		i += 2 + size
	}
	return 1
}

// tiffOrientation finds tag 0x0112 in the first IFD of a TIFF header.
func tiffOrientation(t []byte) int {
	var bo binary.ByteOrder
	switch string(t[:2]) {
	case "II":
		bo = binary.LittleEndian
	case "MM":
		bo = binary.BigEndian
	default:
		return 1
	}
	ifd := int(bo.Uint32(t[4:]))
	if ifd+2 > len(t) {
		return 1
	}
	n := int(bo.Uint16(t[ifd:]))
	for k := range n {
		e := ifd + 2 + 12*k
		if e+12 > len(t) {
			break
		}
		if bo.Uint16(t[e:]) == 0x0112 {
			return int(bo.Uint16(t[e+8:]))
		}
	}
	return 1
}

// orient applies an EXIF orientation (2–8) so the picture is upright.
func orient(src *image.NRGBA, o int) *image.NRGBA {
	W, H := src.Rect.Dx(), src.Rect.Dy()
	w, h := W, H
	if o >= 5 {
		w, h = H, W
	}
	out := image.NewNRGBA(image.Rect(0, 0, w, h))
	for y := range h {
		for x := range w {
			sx, sy := x, y
			switch o {
			case 2:
				sx = W - 1 - x
			case 3:
				sx, sy = W-1-x, H-1-y
			case 4:
				sy = H - 1 - y
			case 5:
				sx, sy = y, x
			case 6:
				sx, sy = y, H-1-x
			case 7:
				sx, sy = W-1-y, H-1-x
			case 8:
				sx, sy = W-1-y, x
			}
			copy(out.Pix[out.PixOffset(x, y):][:4], src.Pix[src.PixOffset(sx, sy):][:4])
		}
	}
	return out
}

// shrink scales src down to width w, averaging every source pixel that falls
// in an output pixel (box filter, weighted by alpha): no aliasing, no extra
// dependency.
func shrink(in *image.NRGBA, w int) *image.NRGBA {
	W, H := in.Rect.Dx(), in.Rect.Dy()
	h := max(1, int(math.Round(float64(H)*float64(w)/float64(W))))
	out := image.NewNRGBA(image.Rect(0, 0, w, h))
	sx, sy := float64(W)/float64(w), float64(H)/float64(h)
	for y := range h {
		y0, y1 := int(float64(y)*sy), max(int(float64(y)*sy)+1, int(float64(y+1)*sy))
		for x := range w {
			x0, x1 := int(float64(x)*sx), max(int(float64(x)*sx)+1, int(float64(x+1)*sx))
			var r, g, bl, a, n float64
			for yy := y0; yy < y1 && yy < H; yy++ {
				i := in.PixOffset(x0, yy)
				for xx := x0; xx < x1 && xx < W; xx++ {
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
func flatten(src *image.NRGBA) image.Image {
	out := image.NewRGBA(src.Rect)
	draw.Draw(out, out.Rect, image.White, image.Point{}, draw.Src)
	draw.Draw(out, out.Rect, src, image.Point{}, draw.Over)
	return out
}

// paletteImage maps src to the theme palette pal. With dither, the error of
// every pixel is diffused to its neighbours (Floyd–Steinberg, serpentine, the
// working values kept in 0..255 so the error never builds up into streaks).
// With alpha, pixels under half opacity use an extra transparent entry.
func paletteImage(src *image.NRGBA, pal color.Palette, alpha, dither bool) *image.Paletted {
	w, h := src.Rect.Dx(), src.Rect.Dy()
	rgb := make([][3]float64, len(pal))
	for i, c := range pal {
		r, g, b, _ := c.RGBA()
		rgb[i] = [3]float64{float64(r >> 8), float64(g >> 8), float64(b >> 8)}
	}
	transparent := -1
	if alpha && len(pal) < 256 {
		transparent = len(pal)
		pal = append(pal[:len(pal):len(pal)], color.NRGBA{})
	}
	// nearest uses the "redmean" weighted distance, closer to the eye than
	// plain RGB. Without dithering, results are memoized per 5-bit color.
	memo := map[uint16]uint8{}
	nearest := func(c [3]float64) uint8 {
		var key uint16
		if !dither {
			key = uint16(c[0])>>3<<10 | uint16(c[1])>>3<<5 | uint16(c[2])>>3
			if i, ok := memo[key]; ok {
				return i
			}
		}
		best, bd := 0, math.Inf(1)
		for i, p := range rgb {
			rm := (c[0] + p[0]) / 2
			dr, dg, db := c[0]-p[0], c[1]-p[1], c[2]-p[2]
			if d := (2+rm/256)*dr*dr + 4*dg*dg + (2+(255-rm)/256)*db*db; d < bd {
				best, bd = i, d
			}
		}
		if !dither {
			memo[key] = uint8(best)
		}
		return uint8(best)
	}
	work := make([][3]float64, w*h)
	for i := range work {
		p := src.Pix[i*4 : i*4+3]
		work[i] = [3]float64{float64(p[0]), float64(p[1]), float64(p[2])}
	}
	out := image.NewPaletted(image.Rect(0, 0, w, h), pal)
	spread := func(x, y int, e [3]float64, k float64) {
		if x >= 0 && x < w && y < h {
			for c := range 3 {
				work[y*w+x][c] += e[c] * k
			}
		}
	}
	for y := range h {
		dir, x0 := 1, 0
		if y%2 == 1 {
			dir, x0 = -1, w-1
		}
		for x := x0; x >= 0 && x < w; x += dir {
			i := y*w + x
			if transparent >= 0 && src.Pix[i*4+3] < 128 {
				out.Pix[i] = uint8(transparent)
				continue
			}
			c := work[i]
			for k := range 3 {
				c[k] = math.Max(0, math.Min(255, c[k]))
			}
			idx := nearest(c)
			out.Pix[i] = idx
			if !dither {
				continue
			}
			e := [3]float64{c[0] - rgb[idx][0], c[1] - rgb[idx][1], c[2] - rgb[idx][2]}
			spread(x+dir, y, e, 7.0/16)
			spread(x-dir, y+1, e, 3.0/16)
			spread(x, y+1, e, 5.0/16)
			spread(x+dir, y+1, e, 1.0/16)
		}
	}
	return out
}
