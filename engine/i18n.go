package engine

// strs is the built-in dictionary of interface strings.
var strs = map[string]map[string]string{
	"it": {
		"docs": "Documentazione", "folders": "Cartelle", "pages": "Pagine", "files": "File",
		"on_this_page": "In questa pagina", "no_toc": "Nessun indice", "index": "indice",
		"depth": "profondità", "language": "Lingua",
		"untranslated": "Questa pagina non è disponibile in italiano: viene mostrata la versione in un'altra lingua.",
		"copy":         "copia", "copied": "copiato", "words": "parole", "min_read": "min di lettura",
		"expand": "Espandi", "collapse": "Comprimi", "sections": "Sezioni", "home": "home",
		"skip_content": "Vai al contenuto", "empty_section": "Nessuna pagina in questa cartella.",
		"wm_data": "dati", "wm_search": "cerca", "wm_no_data": "nessun dato", "wm_other": "altro", "wm_total": "totale",
		"wm_show": "mostra", "wm_hide": "nascondi", "wm_reset": "ripristina", "wm_all": "tutti",
		"search": "Cerca", "search_none": "Nessun risultato", "search_move": "scorri",
		"search_go": "apri", "search_close": "chiudi", "search_tab": "completa", "search_filters": "Filtri",
		"sq_section": "in una sezione del sito", "sq_heading": "sotto le intestazioni che corrispondono",
		"sq_title": "nel titolo", "sq_code": "nei blocchi di codice, di un linguaggio", "sq_in": "dove cercare le parole",
		"sq_has": "pagine con code, math, table, image, link, quote, task, widget", "sq_path": "nel percorso del file",
		"sq_phrase": "queste parole, in quest'ordine", "sq_not": "senza", "sq_or": "l'una o l'altra", "sq_regex": "un'espressione regolare",
	},
	"en": {
		"docs": "Documentation", "folders": "Folders", "pages": "Pages", "files": "Files",
		"on_this_page": "On this page", "no_toc": "No outline", "index": "index",
		"depth": "depth", "language": "Language",
		"untranslated": "This page is not available in English: showing the version in another language.",
		"copy":         "copy", "copied": "copied", "words": "words", "min_read": "min read",
		"expand": "Expand", "collapse": "Collapse", "sections": "Sections", "home": "home",
		"skip_content": "Skip to content", "empty_section": "No pages in this folder.",
		"wm_data": "data", "wm_search": "search", "wm_no_data": "no data", "wm_other": "other", "wm_total": "total",
		"wm_show": "show", "wm_hide": "hide", "wm_reset": "reset", "wm_all": "all",
		"search": "Search", "search_none": "No results", "search_move": "move",
		"search_go": "open", "search_close": "close", "search_tab": "complete", "search_filters": "Filters",
		"sq_section": "in one section of the site", "sq_heading": "under the headings that match",
		"sq_title": "in the title", "sq_code": "in the code blocks, of one language", "sq_in": "where the words look",
		"sq_has": "pages with code, math, table, image, link, quote, task, widget", "sq_path": "in the file path",
		"sq_phrase": "these words, in this order", "sq_not": "without it", "sq_or": "either one", "sq_regex": "a regular expression",
	},
}

// uiStrings layers English ← the language's dictionary ← [strings.<lang>].
func uiStrings(cfg *Config, lang string) map[string]string {
	out := map[string]string{}
	for _, m := range []map[string]string{strs["en"], strs[lang], cfg.Strings[lang]} {
		for k, v := range m {
			out[k] = v
		}
	}
	return out
}
