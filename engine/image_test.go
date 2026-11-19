package engine

import (
	"bytes"
	"encoding/binary"
	"image"
	"image/color"
	"image/jpeg"
	"image/png"
	"math/rand"
	"os"
	"testing"
)

func encodePNG(t *testing.T, img image.Image) []byte {
	t.Helper()
	var b bytes.Buffer
	if err := png.Encode(&b, img); err != nil {
		t.Fatal(err)
	}
	return b.Bytes()
}

// photo is a noisy gradient: thousands of colors, like a photograph.
func photo(w, h int) *image.RGBA {
	img := image.NewRGBA(image.Rect(0, 0, w, h))
	r := rand.New(rand.NewSource(1))
	for y := range h {
		for x := range w {
			n := uint8(r.Intn(24))
			img.Set(x, y, color.RGBA{uint8(255*x/w) ^ n, uint8(255*y/h) ^ n, 120 + n, 255})
		}
	}
	return img
}

func TestAutoPicksJPEGForPhotosAndIndexedPNGForScreenshots(t *testing.T) {
	Assets = os.DirFS("..")
	b, ext, st, err := EncodeImage(encodePNG(t, photo(300, 200)), ImageOptions{})
	if err != nil {
		t.Fatal(err)
	}
	if ext != ".jpg" || st.After >= st.Before {
		t.Errorf("a photo PNG must become a smaller JPEG, got %s %d → %d", ext, st.Before, st.After)
	}
	if _, f, _ := image.DecodeConfig(bytes.NewReader(b)); f != "jpeg" {
		t.Errorf("the bytes are %s, not jpeg", f)
	}

	shot := image.NewRGBA(image.Rect(0, 0, 300, 200)) // four flat colors
	for y := range 200 {
		for x := range 300 {
			shot.Set(x, y, []color.RGBA{{250, 250, 250, 255}, {30, 30, 30, 255}, {200, 60, 60, 255}, {60, 60, 200, 255}}[(x/75+y/50)%4])
		}
	}
	b, ext, _, err = EncodeImage(encodePNG(t, shot), ImageOptions{})
	if err != nil {
		t.Fatal(err)
	}
	img, err := png.Decode(bytes.NewReader(b))
	if err != nil || ext != ".png" {
		t.Fatalf("a screenshot must stay a PNG: %s %v", ext, err)
	}
	p, ok := img.(*image.Paletted)
	if !ok || len(p.Palette) != 4 {
		t.Fatalf("want an indexed PNG with the 4 colors, got %T", img)
	}
	for y := range 200 { // lossless
		for x := range 300 {
			r1, g1, b1, _ := shot.At(x, y).RGBA()
			r2, g2, b2, _ := img.At(x, y).RGBA()
			if r1 != r2 || g1 != g2 || b1 != b2 {
				t.Fatalf("pixel %d,%d changed", x, y)
			}
		}
	}
}

func TestReencodingNeverGrowsAnUntouchedImage(t *testing.T) {
	var src bytes.Buffer
	if err := jpeg.Encode(&src, photo(200, 100), &jpeg.Options{Quality: 40}); err != nil {
		t.Fatal(err)
	}
	b, ext, st, err := EncodeImage(src.Bytes(), ImageOptions{Quality: 95})
	if err != nil {
		t.Fatal(err)
	}
	if !st.Kept || !bytes.Equal(b, src.Bytes()) || ext != ".jpg" {
		t.Errorf("a q40 JPEG re-encoded at q95 must be kept as is (kept=%v, %d → %d)", st.Kept, st.Before, st.After)
	}
}

// withOrientation inserts an EXIF APP1 segment with the given orientation.
func withOrientation(jpg []byte, o uint16) []byte {
	tiff := []byte("MM\x00\x2a\x00\x00\x00\x08\x00\x01\x01\x12\x00\x03\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00")
	binary.BigEndian.PutUint16(tiff[18:], o)
	seg := append([]byte("Exif\x00\x00"), tiff...)
	app1 := []byte{0xFF, 0xE1, 0, 0}
	binary.BigEndian.PutUint16(app1[2:], uint16(len(seg)+2))
	out := append([]byte{}, jpg[:2]...)
	out = append(out, app1...)
	out = append(out, seg...)
	return append(out, jpg[2:]...)
}

func TestJPEGsAreTurnedUprightFromEXIF(t *testing.T) {
	img := image.NewRGBA(image.Rect(0, 0, 40, 20))
	for y := range 20 {
		for x := range 40 {
			c := color.RGBA{255, 255, 255, 255}
			if x < 10 && y < 10 {
				c = color.RGBA{0, 0, 0, 255} // black mark top left
			}
			img.Set(x, y, c)
		}
	}
	var src bytes.Buffer
	if err := jpeg.Encode(&src, img, &jpeg.Options{Quality: 95}); err != nil {
		t.Fatal(err)
	}
	b, _, st, err := EncodeImage(withOrientation(src.Bytes(), 6), ImageOptions{Format: "png"})
	if err != nil {
		t.Fatal(err)
	}
	if st.Width != 20 || st.Height != 40 {
		t.Fatalf("orientation 6 must swap the sides, got %d×%d", st.Width, st.Height)
	}
	out, _ := png.Decode(bytes.NewReader(b))
	// Rotated 90° clockwise, the top-left mark ends top right.
	if r, _, _, _ := out.At(17, 2).RGBA(); r>>8 > 60 {
		t.Error("the mark is not at the top right after rotation")
	}
	if r, _, _, _ := out.At(2, 2).RGBA(); r>>8 < 200 {
		t.Error("the top left should be white after rotation")
	}
}

func TestPaletteKeepsTransparency(t *testing.T) {
	Assets = os.DirFS("..")
	img := image.NewNRGBA(image.Rect(0, 0, 20, 20))
	for y := range 20 {
		for x := range 20 {
			if x < 10 {
				img.Set(x, y, color.NRGBA{200, 80, 40, 255})
			}
		}
	}
	b, ext, st, err := EncodeImage(encodePNG(t, img), ImageOptions{Palette: "light"})
	if err != nil {
		t.Fatal(err)
	}
	out, err := png.Decode(bytes.NewReader(b))
	if err != nil || ext != ".png" {
		t.Fatal(err)
	}
	p := out.(*image.Paletted)
	if len(p.Palette) != st.Colors+1 {
		t.Errorf("want the theme palette plus a transparent entry, got %d colors for %d", len(p.Palette), st.Colors)
	}
	if _, _, _, a := out.At(15, 5).RGBA(); a != 0 {
		t.Error("a transparent pixel became opaque")
	}
	if _, _, _, a := out.At(5, 5).RGBA(); a == 0 {
		t.Error("an opaque pixel became transparent")
	}
}
