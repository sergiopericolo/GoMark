package main

import (
	"context"
	"errors"
	"flag"
	"fmt"
	"io"
	"mime"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"slices"
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
	from, like                 string
	build, del, force          bool
}

// parse reads the shared flags, allowed anywhere.
func parse(c command, args []string) (*ctx, error) {
	cx := &ctx{}
	fs := flag.NewFlagSet(c.name, flag.ContinueOnError)
	fs.SetOutput(io.Discard)
	fs.StringVar(&cx.site, "site", "", "")
	fs.StringVar(&cx.lang, "lang", "", "")
	fs.StringVar(&cx.from, "from", "", "")
	fs.StringVar(&cx.like, "like", "", "")
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

// likes splits -like "a, b" into names.
func (cx *ctx) likes() []string {
	var out []string
	for _, n := range strings.Split(cx.like, ",") {
		if n = strings.TrimSpace(n); n != "" {
			out = append(out, n)
		}
	}
	return out
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
	all, err := s.Build(cx.lang, cx.out)
	if err != nil {
		return err
	}
	for _, st := range all {
		warnSkipped(st.Skipped)
		fmt.Printf("built %s → %s: %d pages", st.Lang, rel(st.Out), st.Pages)
		if st.Missing > 0 {
			fmt.Printf(" (%d shown from another language, with a notice)", st.Missing)
		}
		fmt.Printf(", %d files, %d assets", st.HTMLFiles, st.Assets)
		if st.Images > 0 {
			fmt.Printf(", %d images", st.Images)
		}
		fmt.Println()
		for _, w := range st.Warnings {
			fmt.Fprintln(os.Stderr, "warning:", w)
		}
	}
	fmt.Printf("done in %d ms\n", time.Since(start).Milliseconds())
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
		if cx.del {
			fmt.Printf("removed section %s and its folders\n", cx.arg(1))
		} else {
			fmt.Printf("removed section %s (folders kept)\n", cx.arg(1))
		}
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
			def := ""
			if i == 0 {
				def = "(default)"
			}
			fmt.Printf("%-6s %-14s %s\n", l.Code, l.Label, def)
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
	switch name := cx.arg(0); name {
	case "":
		for _, t := range engine.Themes() {
			mark := " "
			if t == s.Config.Site.Theme {
				mark = "*"
			}
			fmt.Printf("%s %-16s %s\n", mark, t, engine.ThemeClass(t))
		}
	case "check":
		bad := 0
		for _, t := range engine.Themes() {
			info, err := engine.CheckTheme(t)
			if err != nil {
				return err
			}
			status := "ok"
			if len(info.Problems) > 0 {
				status = strings.Join(info.Problems, "; ")
				bad++
			}
			fmt.Printf("%-16s %-11s %d hue families, %2d colors  %s\n", t, info.Class, info.Families, info.Colors, status)
		}
		if bad > 0 {
			return fmt.Errorf("%d theme(s) with problems", bad)
		}
	default:
		if err := s.SetTheme(name); err != nil {
			return err
		}
		fmt.Println("theme", name, "("+engine.ThemeClass(name)+")")
	}
	return nil
}

func size(n int64) string {
	if n < 1024 {
		return fmt.Sprintf("%d B", n)
	}
	return fmt.Sprintf("%.1f KB", float64(n)/1024)
}

func cmdWidget(cx *ctx) error {
	s, _ := cx.open() // outside a site: no widgets, default look
	switch cx.arg(0) {
	case "":
		ws, err := s.Widgets()
		slices.SortFunc(ws, func(a, b engine.Widget) int { return strings.Compare(a.Name, b.Name) })
		for _, w := range ws {
			fmt.Printf("  %-14s %s\n", w.Name, w.Summary())
		}
		if len(ws) == 0 && err == nil {
			fmt.Println("no WiMarks yet: create one with gomark widget new <name> or gomark ai widget <name> \"<description>\"")
			return nil
		}
		fmt.Printf("%d WiMarks: use them as ```wimark-<name> {options} blocks\n", len(ws))
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
			name := path.Base(strings.TrimSuffix(file, ".js"))
			fmt.Printf("created %s\nuse it with a ```wimark-%s block; see it in: gomark widget preview\n", file, name)
		}
		return err
	case "check":
		if s == nil {
			return fmt.Errorf("widget check needs a site (run it inside one, or use -site)")
		}
		files := cx.args[1:]
		if len(files) == 0 {
			ws, err := s.Widgets()
			if err != nil {
				return err
			}
			for _, w := range ws {
				files = append(files, filepath.Join(s.Dir, filepath.FromSlash(w.Path))) // w.Path is widgets/…
			}
		}
		if len(files) == 0 {
			fmt.Println("no WiMarks to check")
			return nil
		}
		bad := 0
		for _, f := range files {
			problems, notes, err := s.CheckWidgetFile(context.Background(), f)
			if err != nil {
				return err
			}
			if len(problems) == 0 {
				fmt.Println("ok  ", rel(f))
			} else {
				bad++
				fmt.Println("fail", rel(f))
			}
			for _, p := range problems {
				fmt.Println("  ✕", p)
			}
			for _, n := range notes {
				fmt.Println("  !", n)
			}
		}
		if bad > 0 {
			return fmt.Errorf("%d widget(s) break the rules", bad)
		}
		return nil
	case "context":
		if err := cx.arity(3, 3); err != nil {
			return err
		}
		if s == nil {
			return fmt.Errorf("widget context needs a site (run it inside one, or use -site)")
		}
		brief, err := s.WidgetContext(path.Base(strings.TrimSuffix(cx.arg(1), ".js")), cx.arg(2), cx.likes())
		if err != nil {
			return err
		}
		fmt.Printf("# WiMark brief: %s\n\nWhat it shows: %s\n\n%s\n", cx.arg(1), cx.arg(2), brief)
		return nil
	case "skill":
		if err := cx.arity(1, 1); err != nil {
			return err
		}
		if s == nil {
			return fmt.Errorf("widget skill needs a site (run it inside one, or use -site)")
		}
		file, err := s.WriteWidgetSkill(cx.force)
		if err == nil {
			fmt.Printf("created %s\nClaude Code now uses it when you ask for a widget in this site\n", file)
		}
		return err
	case "catalog":
		if err := cx.arity(1, 1); err != nil {
			return err
		}
		out := cx.out
		if out == "" {
			out = "wimark-catalog"
			if s != nil {
				out = filepath.Join(s.Dir, "wimark-catalog")
			}
		}
		if err := s.WriteCatalog(out); err != nil {
			return err
		}
		fmt.Printf("catalog written to %s/index.html\n", rel(out))
		return nil
	case "preview":
		if err := cx.arity(1, 1); err != nil {
			return err
		}
		if _, err := s.Catalog(); err != nil {
			return err
		}
		fmt.Printf("WiMark catalog on http://localhost%s (reload to see changes)\n", cx.addr)
		return http.ListenAndServe(cx.addr, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			b, err := s.Catalog()
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

func cmdAI(cx *ctx) error {
	s, err := cx.open()
	if err != nil {
		return err
	}
	ctx := context.Background()
	var p *engine.Proposal
	announce := func(what string) {
		c := s.Config.AI
		model := c.Model
		if c.Provider == "command" {
			model = os.Getenv("GOMARK_AI_COMMAND")
		}
		fmt.Printf("asking %s (%s) to %s…\n", c.Provider, model, what)
	}
	switch cx.arg(0) {
	case "translate":
		if err := cx.arity(2, 2); err != nil {
			return err
		}
		return translate(s, cx, cx.arg(1))
	case "convert":
		if err := cx.arity(3, 3); err != nil {
			return err
		}
		announce("turn " + cx.arg(1) + " into " + cx.arg(2))
		p, err = s.AIConvert(ctx, cx.arg(1), cx.arg(2), cx.lang)
	case "widget":
		if err := cx.arity(3, 3); err != nil {
			return err
		}
		announce("write the widget " + cx.arg(1))
		p, err = s.AIWidget(ctx, cx.arg(1), cx.arg(2), cx.likes())
	case "list", "":
		ps, err := s.Proposals()
		for _, p := range ps {
			state := p.Status
			if p.Status == "proposed" && !p.OK() {
				state = "blocked"
			}
			fmt.Printf("%s  %-9s %-9s %s\n", p.ID, p.Kind, state, p.Target)
		}
		if len(ps) == 0 && err == nil {
			fmt.Println("no proposals (make one: gomark translate <section/page.md>)")
		}
		return err
	case "show":
		if err := cx.arity(2, 2); err != nil {
			return err
		}
		if p, err = s.Proposal(cx.arg(1)); err != nil {
			return err
		}
		report(p)
		old, _ := os.ReadFile(filepath.Join(s.Dir, filepath.FromSlash(p.Target)))
		fmt.Println()
		if old == nil {
			fmt.Print(p.Content())
		} else {
			fmt.Print(lineDiff(string(old), p.Content()))
		}
		return nil
	case "apply":
		if err := cx.arity(2, 2); err != nil {
			return err
		}
		if p, err = s.ApplyProposal(ctx, cx.arg(1), cx.force); err != nil {
			return err
		}
		fmt.Printf("applied %s → %s\n", p.ID, p.Target)
		return nil
	case "discard":
		if err := cx.arity(2, 2); err != nil {
			return err
		}
		if err := s.DiscardProposal(cx.arg(1)); err != nil {
			return err
		}
		fmt.Println("discarded", cx.arg(1))
		return nil
	default:
		return usageError("unknown subcommand " + strconv.Quote(cx.arg(0)))
	}
	if err != nil {
		return err
	}
	report(p)
	fmt.Printf("\nnothing was written. review: gomark ai show %s", p.ID)
	if p.OK() {
		fmt.Printf("   apply: gomark ai apply %s", p.ID)
	}
	fmt.Println()
	return nil
}

func cmdTranslate(cx *ctx) error {
	if err := cx.arity(1, 1); err != nil {
		return err
	}
	s, err := cx.open()
	if err != nil {
		return err
	}
	return translate(s, cx, cx.arg(0))
}

// translate writes a page in -lang, or in every language that misses it, in
// one step: each translation is checked and written when it passes.
func translate(s *engine.Site, cx *ctx, page string) error {
	rel, from, langs, err := s.TranslationSource(page, cx.from)
	if err != nil {
		return err
	}
	if cx.lang == from {
		return fmt.Errorf("%s/%s is the source (use -from for another one)", from, rel)
	}
	if cx.lang != "" {
		langs = []string{cx.lang}
	}
	if len(langs) == 0 {
		return fmt.Errorf("%s is already in every language (redo one with -lang <code> -force)", rel)
	}
	var failed []string
	for _, lang := range langs {
		target := lang + "/" + rel
		if _, err := os.Stat(filepath.Join(s.Dir, lang, filepath.FromSlash(rel))); err == nil && !cx.force {
			return fmt.Errorf("%s exists (-force to replace it)", target)
		}
		fmt.Printf("translating %s/%s → %s (%s %s)…\n", from, rel, target, s.Config.AI.Provider, s.Config.AI.Model)
		p, err := s.AITranslate(context.Background(), rel, from, lang)
		if err == nil && p.OK() {
			_, err = s.ApplyProposal(context.Background(), p.ID, cx.force)
		}
		switch {
		case err != nil:
			fmt.Fprintln(os.Stderr, "  ✕", err)
			failed = append(failed, target)
		case !p.OK():
			for _, x := range p.Problems {
				fmt.Println("  ✕", x)
			}
			fmt.Printf("  not written: see gomark ai show %s; fix .gomark/ai/%s/content.md, then gomark ai apply %s\n", p.ID, p.ID, p.ID)
			failed = append(failed, target)
		default:
			fmt.Println("  ✓", target)
		}
	}
	if len(failed) > 0 {
		return fmt.Errorf("not translated: %s", strings.Join(failed, ", "))
	}
	return nil
}

// report prints a proposal's summary, problems and notes.
func report(p *engine.Proposal) {
	fmt.Printf("proposal %s: %s → %s (%s, %s", p.ID, p.Kind, p.Target, p.Status, p.Provider)
	if p.Model != "" {
		fmt.Printf(" %s", p.Model)
	}
	if p.Usage.Input+p.Usage.Output > 0 {
		fmt.Printf(", %d in / %d out tokens", p.Usage.Input, p.Usage.Output)
	}
	fmt.Println(")")
	for _, x := range p.Problems {
		fmt.Println("  ✕", x)
	}
	for _, x := range p.Notes {
		fmt.Println("  !", x)
	}
	if p.OK() {
		fmt.Println("  ✓ every check passed")
	}
}

// lineDiff is a minimal unified-style diff (- old, + new) for reviews.
func lineDiff(a, b string) string {
	x, y := strings.Split(a, "\n"), strings.Split(b, "\n")
	if len(x)*len(y) > 4_000_000 {
		return b // too large to diff: show the new file
	}
	L := make([][]int, len(x)+1)
	for i := range L {
		L[i] = make([]int, len(y)+1)
	}
	for i := len(x) - 1; i >= 0; i-- {
		for j := len(y) - 1; j >= 0; j-- {
			if x[i] == y[j] {
				L[i][j] = L[i+1][j+1] + 1
			} else {
				L[i][j] = max(L[i+1][j], L[i][j+1])
			}
		}
	}
	var out strings.Builder
	i, j := 0, 0
	for i < len(x) || j < len(y) {
		switch {
		case i < len(x) && j < len(y) && x[i] == y[j]:
			out.WriteString("  " + x[i] + "\n")
			i, j = i+1, j+1
		case i < len(x) && (j >= len(y) || L[i+1][j] >= L[i][j+1]):
			out.WriteString("- " + x[i] + "\n")
			i++
		default:
			out.WriteString("+ " + y[j] + "\n")
			j++
		}
	}
	return out.String()
}
