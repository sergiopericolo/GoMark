// Command gomark is the GoMark command line, a thin layer over package engine.
package main

import (
	"embed"
	"errors"
	"flag"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"strings"

	"gomark/engine"
)

//go:embed templates static
var embedded embed.FS

func main() {
	engine.Assets = assets()
	os.Exit(run(os.Args[1:]))
}

// assets prefers templates/ and static/ on disk (next to the binary or here)
// over the embedded copy.
func assets() fs.FS {
	dirs := []string{"."}
	if exe, err := os.Executable(); err == nil {
		dirs = append([]string{filepath.Dir(exe)}, dirs...)
	}
	for _, d := range dirs {
		if isDir(filepath.Join(d, "templates")) && isDir(filepath.Join(d, "static")) {
			return os.DirFS(d)
		}
	}
	return embedded
}

func isDir(p string) bool {
	info, err := os.Stat(p)
	return err == nil && info.IsDir()
}

// command is a CLI entry; the table is also the help.
type command struct {
	name, args, help string
	run              func(*ctx) error
}

var commands = []command{
	{"init", "[dir] [title]", "create a site (default: this folder)", cmdInit},
	{"build", "", "build every language (or -lang) into the output folder", cmdBuild},
	{"serve", "", "serve the output folder", cmdServe},
	{"render", "[section[/path]]", "print the HTML of one page", cmdRender},
	{"publish", "", "git add, commit and push the output folder", cmdPublish},
	{"tree", "", "show sections, folders and pages", cmdTree},
	{"new", "<section/path[.md]> [title]", "create a page, or a folder without .md", cmdNew},
	{"mv", "<src> <dst>", "move a page or folder, with its translations", cmdMove},
	{"rm", "<section/path>", "delete a page or folder", cmdRemove},
	{"config", "[key [value]]", "list, read or set a setting", cmdConfig},
	{"section", "[add <id> [title] [depth] | rm <id>]", "list, add or remove sections", cmdSection},
	{"lang", "[add <code> [label] | rm <code>]", "list, add or remove languages", cmdLang},
	{"theme", "[name | check]", "list themes with their class, set one, or check them all", cmdTheme},
	{"ai", "<translate|convert|widget|list|show|apply|discard> …", "AI proposals, checked, applied only on request", cmdAI},
	{"widget", "[new <name> | catalog | preview]", "list WiMarks, create one in the site, write or serve the catalog", cmdWidget},
}

const flagsHelp = `Flags (anywhere on the line):
  -site <dir>    site folder (default: nearest folder with gomark.toml)
  -lang <code>   language (default: the site's first)
  -out <dir>     output folder (default: [site] out, i.e. dist)
  -addr <addr>   serve / widget preview address (default :8080)
  -build         serve: build first
  -delete        section rm: delete the folders too
  -force         init: rewrite an existing gomark.toml; ai apply: replace a file
  -from <code>   ai translate: source language (default: the site's first)
  -m <msg>       publish: commit message
`

func usage(c command) string { return strings.TrimSpace("gomark " + c.name + " " + c.args) }

func help() {
	fmt.Print("gomark — Markdown in, static site out.\n\nUsage: gomark <command> [args] [flags]\n\n")
	for _, c := range commands {
		fmt.Printf("  %-46s %s\n", strings.TrimPrefix(usage(c), "gomark "), c.help)
	}
	fmt.Print("\n" + flagsHelp)
}

// run executes a command. Exit: 0 ok, 1 error, 2 usage.
func run(args []string) int {
	if len(args) == 0 || args[0] == "help" || args[0] == "-h" || args[0] == "--help" {
		help()
		return 0
	}
	if args[0] == "version" || args[0] == "-v" || args[0] == "--version" {
		fmt.Println("gomark", engine.Version)
		return 0
	}
	for _, c := range commands {
		if c.name != args[0] {
			continue
		}
		cx, err := parse(c, args[1:])
		if err == nil {
			err = c.run(cx)
		}
		var u usageError
		switch {
		case err == nil, errors.Is(err, flag.ErrHelp):
			return 0
		case errors.As(err, &u):
			fmt.Fprintf(os.Stderr, "error: %s\nusage: %s\n", u, usage(c))
			return 2
		default:
			fmt.Fprintln(os.Stderr, "error:", err)
			return 1
		}
	}
	fmt.Fprintf(os.Stderr, "error: unknown command %q (see: gomark help)\n", args[0])
	return 2
}
