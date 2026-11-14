package main

import (
	"errors"
	"flag"
	"fmt"
	"io"
	"mime"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"gomark/engine"
)

// usageError is a wrong invocation (exit code 2).
type usageError string

func (u usageError) Error() string { return string(u) }

// ctx holds the flags and arguments of one command.
type ctx struct {
	args                       []string
	site, lang, out, addr, msg string
	build, del, force          bool
}

// parse reads the shared flags, allowed anywhere.
func parse(c command, args []string) (*ctx, error) {
	cx := &ctx{}
	fs := flag.NewFlagSet(c.name, flag.ContinueOnError)
	fs.SetOutput(io.Discard)
	fs.StringVar(&cx.site, "site", "", "")
	fs.StringVar(&cx.lang, "lang", "", "")
	fs.StringVar(&cx.out, "out", "", "")
	fs.StringVar(&cx.addr, "addr", ":8080", "")
	fs.StringVar(&cx.msg, "m", "update", "")
	fs.BoolVar(&cx.build, "build", false, "")
	fs.BoolVar(&cx.del, "delete", false, "")
	fs.BoolVar(&cx.force, "force", false, "")
	for {
		if err := fs.Parse(args); errors.Is(err, flag.ErrHelp) {
			fmt.Printf("usage: %s\n%s\n\n%s", usage(c), c.help, flagsHelp)
			return nil, err
		} else if err != nil {
			return nil, usageError(err.Error())
		}
		if fs.NArg() == 0 {
			return cx, nil
		}
		cx.args, args = append(cx.args, fs.Arg(0)), fs.Args()[1:]
	}
}

// arity checks the argument count.
func (cx *ctx) arity(min, max int) error {
	if n := len(cx.args); n < min || n > max {
		return usageError(fmt.Sprintf("expected %d to %d arguments, got %d", min, max, n))
	}
	return nil
}

// arg returns the i-th positional argument, or "".
func (cx *ctx) arg(i int) string {
	if i < len(cx.args) {
		return cx.args[i]
	}
	return ""
}

// open loads -site, or the nearest site upwards.
func (cx *ctx) open() (*engine.Site, error) {
	dir := cx.site
	if dir == "" {
		var err error
		if dir, err = engine.Find("."); err != nil {
			return nil, err
		}
	}
	s, err := engine.Open(dir)
	if s != nil {
		for _, w := range s.Warnings {
			fmt.Fprintln(os.Stderr, "warning:", w)
		}
	}
	return s, err
}

// rel shortens p relative to the working folder.
func rel(p string) string {
	if wd, err := os.Getwd(); err == nil {
		if r, err := filepath.Rel(wd, p); err == nil && len(r) < len(p) {
			return r
		}
	}
	return p
}

func warnSkipped(skipped []string) {
	for _, p := range skipped {
		fmt.Fprintln(os.Stderr, "warning: beyond max_depth, ignored:", p)
	}
}

// ─── Site ───────────────────────────────────────────────────────────────────

func cmdInit(cx *ctx) error {
	if err := cx.arity(0, 2); err != nil {
		return err
	}
	dir := cx.arg(0)
	if dir == "" {
		dir = "."
	}
	s, err := engine.Init(dir, cx.arg(1), cx.out, cx.force)
	if err != nil {
		return err
	}
	fmt.Println("created", filepath.Join(s.Dir, engine.ConfigFile))
	if dir != "." {
		fmt.Println("next: cd", dir)
	}
	return nil
}

func cmdBuild(cx *ctx) error {
	if err := cx.arity(0, 0); err != nil {
		return err
	}
	s, err := cx.open()
	if err != nil {
		return err
	}
	start := time.Now()
	st, err := s.Build(cx.lang, cx.out)
	if err != nil {
		return err
	}
	warnSkipped(st.Skipped)
	fmt.Printf("built %s → %s: %d pages", st.Lang, rel(st.Out), st.Pages)
	if st.Missing > 0 {
		fmt.Printf(" (%d copied from another language)", st.Missing)
	}
	fmt.Printf(", %d files, %d assets in %d ms\n", st.HTMLFiles, st.Assets, time.Since(start).Milliseconds())
	return nil
}

func cmdServe(cx *ctx) error {
	if err := cx.arity(0, 0); err != nil {
		return err
	}
	out := cx.out
	if cx.build || out == "" {
		s, err := cx.open()
		if err != nil {
			return err
		}
		if out == "" {
			out = s.Out()
		}
		if cx.build {
			if err := cmdBuild(cx); err != nil {
				return err
			}
		}
	}
	if !isDir(out) {
		return fmt.Errorf("%s not found (run: gomark build, or serve -build)", out)
	}
	fmt.Printf("serving %s on http://localhost%s\n", out, cx.addr)
	return http.ListenAndServe(cx.addr, http.FileServer(http.Dir(out)))
}

func cmdRender(cx *ctx) error {
	if err := cx.arity(0, 1); err != nil {
		return err
	}
	s, err := cx.open()
	if err != nil {
		return err
	}
	html, err := s.Render(cx.lang, cx.arg(0))
	if err == nil {
		_, err = os.Stdout.Write(html)
	}
	return err
}

func cmdPublish(cx *ctx) error {
	if err := cx.arity(0, 0); err != nil {
		return err
	}
	out := cx.out
	if out == "" {
		s, err := cx.open()
		if err != nil {
			return err
		}
		out = s.Out()
	}
	msg, err := engine.Publish(out, cx.msg)
	if err == nil {
		fmt.Println(msg)
	}
	return err
}

// ─── Content ────────────────────────────────────────────────────────────────

func cmdTree(cx *ctx) error {
	if err := cx.arity(0, 0); err != nil {
		return err
	}
	s, err := cx.open()
	if err != nil {
		return err
	}
	var skipped []string
	fmt.Println(s.Name())
	langs := s.Config.LangCodes()
	for li, lang := range langs {
		lp := branch("", li == len(langs)-1, lang+"/")
		for si, sec := range s.Config.Sections {
			sp := branch(lp, si == len(s.Config.Sections)-1, fmt.Sprintf("%s [max_depth %d]", sec.ID, sec.MaxDepth))
			t, err := s.Scan(sec, lang)
			if err != nil {
				return err
			}
			skipped = append(skipped, t.Skipped...)
			es := t.Entries()
			pre := []string{sp}
			for i, e := range es {
				name := e.Rel[strings.LastIndex(e.Rel, "/")+1:]
				if e.Dir {
					name += "/"
				}
				pre = append(pre[:e.Depth], branch(pre[e.Depth-1], lastSibling(es, i), name))
			}
		}
	}
	warnSkipped(skipped)
	return nil
}

// branch prints a tree line and returns the children prefix.
func branch(prefix string, last bool, text string) string {
	if last {
		fmt.Println(prefix + "└── " + text)
		return prefix + "    "
	}
	fmt.Println(prefix + "├── " + text)
	return prefix + "│   "
}

// lastSibling reports whether es[i] is its parent's last child.
func lastSibling(es []engine.Entry, i int) bool {
	for _, n := range es[i+1:] {
		if n.Depth <= es[i].Depth {
			return n.Depth < es[i].Depth
		}
	}
	return true
}

func cmdNew(cx *ctx) error {
	if err := cx.arity(1, 2); err != nil {
		return err
	}
	sec, rel, ok := strings.Cut(cx.arg(0), "/")
	if !ok || rel == "" {
		return usageError("path must start with a section, e.g. notes/idea.md")
	}
	s, err := cx.open()
	if err != nil {
		return err
	}
	var created string
	if strings.HasSuffix(strings.ToLower(rel), ".md") {
		created, err = s.NewPage(cx.lang, sec, rel, cx.arg(1))
	} else {
		created, err = s.NewFolder(cx.lang, sec, rel)
	}
	if err == nil {
		fmt.Println("created", created)
	}
	return err
}

func cmdMove(cx *ctx) error {
	if err := cx.arity(2, 2); err != nil {
		return err
	}
	s, err := cx.open()
	if err != nil {
		return err
	}
	moved, kept, err := s.Move(cx.lang, cx.arg(0), cx.arg(1))
	for _, m := range moved {
		fmt.Println("moved", m)
	}
	for _, k := range kept {
		fmt.Fprintf(os.Stderr, "warning: %s exists, translation not moved\n", k)
	}
	return err
}

func cmdRemove(cx *ctx) error {
	if err := cx.arity(1, 1); err != nil {
		return err
	}
	s, err := cx.open()
	if err == nil {
		err = s.Delete(cx.lang, cx.arg(0))
	}
	if err == nil {
		fmt.Println("deleted", cx.arg(0))
	}
	return err
}

// ─── Settings ───────────────────────────────────────────────────────────────

func cmdConfig(cx *ctx) error {
	if err := cx.arity(0, 2); err != nil {
		return err
	}
	s, err := cx.open()
	if err != nil {
		return err
	}
	switch len(cx.args) {
	case 0:
		for _, st := range s.Settings() {
			opts := ""
			if len(st.Options) > 0 {
				opts = "   (" + strings.Join(st.Options, "|") + ")"
			}
			fmt.Printf("%-30s %s%s\n", st.Key, st.Value, opts)
		}
	case 1:
		st, err := s.Get(cx.arg(0))
		if err != nil {
			return err
		}
		fmt.Println(st.Value)
	default:
		if err := s.Set(cx.arg(0), cx.arg(1)); err != nil {
			return err
		}
		fmt.Println(cx.arg(0), "=", cx.arg(1))
	}
	return nil
}

func cmdSection(cx *ctx) error {
	s, err := cx.open()
	if err != nil {
		return err
	}
	switch cx.arg(0) {
	case "":
		for _, sec := range s.Config.Sections {
			var titles []string
			for _, l := range s.Config.LangCodes() {
				titles = append(titles, l+"="+sec.Titles.For(l, s.Config.DefaultLang()))
			}
			fmt.Printf("%-12s max_depth %d   %s\n", sec.ID, sec.MaxDepth, strings.Join(titles, "  "))
		}
		if len(s.Config.Sections) == 0 {
			fmt.Println("no sections (add one: gomark section add notes Notes 3)")
		}
		return nil
	case "add":
		if err := cx.arity(2, 4); err != nil {
			return err
		}
		id, title, depth := cx.arg(1), cx.arg(2), 1
		if title == "" {
			title = id
		}
		if cx.arg(3) != "" {
			if depth, err = strconv.Atoi(cx.arg(3)); err != nil {
				return usageError("depth must be an integer")
			}
		}
		if err := s.AddSection(id, title, depth); err != nil {
			return err
		}
		fmt.Printf("added section %s (max_depth %d)\n", id, depth)
	case "rm":
		if err := cx.arity(2, 2); err != nil {
			return err
		}
		if err := s.RemoveSection(cx.arg(1), cx.del); err != nil {
			return err
		}
		fmt.Printf("removed section %s (folders %s)\n", cx.arg(1), map[bool]string{true: "deleted", false: "kept"}[cx.del])
	default:
		return usageError("unknown subcommand " + strconv.Quote(cx.arg(0)))
	}
	return nil
}

func cmdLang(cx *ctx) error {
	s, err := cx.open()
	if err != nil {
		return err
	}
	switch cx.arg(0) {
	case "":
		for i, l := range s.Config.Languages {
			fmt.Printf("%-6s %-14s %s\n", l.Code, l.Label, map[bool]string{true: "(default)"}[i == 0])
		}
		return nil
	case "add":
		if err := cx.arity(2, 3); err != nil {
			return err
		}
		if err := s.AddLanguage(cx.arg(1), cx.arg(2)); err != nil {
			return err
		}
		fmt.Println("added language", cx.arg(1))
	case "rm":
		if err := cx.arity(2, 2); err != nil {
			return err
		}
		if err := s.RemoveLanguage(cx.arg(1)); err != nil {
			return err
		}
		fmt.Println("removed language", cx.arg(1), "(folder kept)")
	default:
		return usageError("unknown subcommand " + strconv.Quote(cx.arg(0)))
	}
	return nil
}

func cmdTheme(cx *ctx) error {
	if err := cx.arity(0, 1); err != nil {
		return err
	}
	s, err := cx.open()
	if err != nil {
		return err
	}
	if name := cx.arg(0); name != "" {
		if err := s.SetTheme(name); err != nil {
			return err
		}
		fmt.Println("theme", name)
		return nil
	}
	for _, t := range engine.Themes() {
		fmt.Println(map[bool]string{true: "*", false: " "}[t == s.Config.Site.Theme], t)
	}
	return nil
}

func cmdWidget(cx *ctx) error {
	s, _ := cx.open() // outside a site: engine widgets only, default look
	switch cx.arg(0) {
	case "":
		ws, err := s.Widgets()
		for _, w := range ws {
			from := "engine  static/" + w.Path
			if w.Site {
				from = "site    " + w.Path
			}
			fmt.Printf("%-12s %s\n", w.Name, from)
		}
		return err
	case "new":
		if err := cx.arity(2, 2); err != nil {
			return err
		}
		if s == nil {
			return fmt.Errorf("widget new needs a site (run it inside one, or use -site)")
		}
		file, err := s.NewWidget(cx.arg(1))
		if err == nil {
			fmt.Printf("created %s\nuse it with a ```widget-%s block; preview: gomark widget preview %s\n", file, path.Base(strings.TrimSuffix(file, ".js")), path.Base(strings.TrimSuffix(file, ".js")))
		}
		return err
	case "preview":
		names := cx.args[1:]
		if _, err := s.PreviewWidgets(names...); err != nil {
			return err
		}
		fmt.Printf("widget preview on http://localhost%s (reload to see changes)\n", cx.addr)
		return http.ListenAndServe(cx.addr, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			b, err := s.PreviewWidgets(names...)
			if p := strings.TrimPrefix(r.URL.Path, "/"); p != "" && p != "index.html" {
				b, err = s.Asset(p)
				w.Header().Set("Content-Type", mime.TypeByExtension(path.Ext(p)))
			}
			if err != nil {
				http.NotFound(w, r)
				return
			}
			w.Write(b)
		}))
	}
	return usageError("unknown subcommand " + strconv.Quote(cx.arg(0)))
}
