import { EditorState } from "@codemirror/state";
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection } from "@codemirror/view";
import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";

type Lang = "css" | "html" | "js";

const langExtensions = {
  css: () => css(),
  html: () => html(),
  js: () => javascript(),
};

export class CodeEditor {
  private views = new Map<Lang, EditorView>();
  private container: HTMLElement;
  private activeLang: Lang = "css";
  private onChange: (lang: Lang, content: string) => void;

  constructor(container: HTMLElement, onChange: (lang: Lang, content: string) => void) {
    this.container = container;
    this.onChange = onChange;
  }

  init(initialCode: { css: string; html: string; js: string }): void {
    for (const lang of ["css", "html", "js"] as Lang[]) {
      const div = document.createElement("div");
      div.style.height = "100%";
      div.style.display = lang === this.activeLang ? "flex" : "none";
      div.style.flexDirection = "column";
      div.dataset.lang = lang;
      this.container.appendChild(div);

      const state = EditorState.create({
        doc: initialCode[lang] || "",
        extensions: [
          lineNumbers(),
          highlightActiveLine(),
          highlightActiveLineGutter(),
          drawSelection(),
          langExtensions[lang](),
          oneDark,
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              this.onChange(lang, update.state.doc.toString());
            }
          }),
          EditorView.theme({
            "&": { height: "100%", fontSize: "13px" },
            ".cm-scroller": { overflow: "auto" },
          }),
        ],
      });

      const view = new EditorView({ state, parent: div });
      this.views.set(lang, view);
    }
  }

  switchTab(lang: Lang): void {
    this.activeLang = lang;
    for (const [l, view] of this.views) {
      const el = view.dom.parentElement;
      if (el) el.style.display = l === lang ? "flex" : "none";
    }
    this.views.get(lang)?.focus();
  }

  getContent(lang: Lang): string {
    return this.views.get(lang)?.state.doc.toString() || "";
  }

  setContent(lang: Lang, content: string): void {
    const view = this.views.get(lang);
    if (!view) return;
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: content },
    });
  }

  getAllContent(): { css: string; html: string; js: string } {
    return {
      css: this.getContent("css"),
      html: this.getContent("html"),
      js: this.getContent("js"),
    };
  }

  getActiveLang(): Lang {
    return this.activeLang;
  }

  destroy(): void {
    for (const view of this.views.values()) {
      view.destroy();
    }
    this.views.clear();
  }
}
