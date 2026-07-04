import MarkdownIt from "markdown-it";
import hljs from "highlight.js";
import { katex } from "@mdit/plugin-katex";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .trim()
      .replace(/[^\w\u4e00-\u9fa5\s-]/g, "")
      .replace(/[\s_]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "heading"
  );
}

function highlightCode(str: string, lang: string): string {
  if (lang && hljs.getLanguage(lang)) {
    try {
      return hljs.highlight(str, { language: lang }).value;
    } catch {
      // fall through to empty
    }
  }
  return "";
}

let mdInstance: MarkdownIt | null = null;

function getMd(): MarkdownIt {
  if (mdInstance) return mdInstance;

  const md = new MarkdownIt({
    html: false,
    linkify: true,
    typographer: true,
    highlight: (str: string, lang: string) => highlightCode(str, lang),
  });

  md.use(katex);

  md.renderer.rules.fence = function (tokens, idx) {
    const token = tokens[idx];
    const info = token.info ? token.info.trim() : "";
    const lang = info.split(/\s+/g)[0];
    const content = token.content;

    if (lang === "mermaid") {
      return `<div class="mermaid">${escapeHtml(content)}</div>\n`;
    }

    let highlighted = highlightCode(content, lang);
    if (!highlighted) {
      highlighted = escapeHtml(content);
    }
    const codeClass = lang
      ? ` class="hljs language-${lang}"`
      : ' class="hljs"';
    return `<pre class="hljs"><code${codeClass}>${highlighted}</code></pre>\n`;
  };

  md.renderer.rules.heading_open = function (tokens, idx, options, _env, self) {
    const token = tokens[idx];
    if (token.tag === "h2" || token.tag === "h3") {
      const inline = tokens[idx + 1];
      const text = inline && inline.content ? inline.content : "";
      token.attrSet("id", slugify(text));
    }
    return self.renderToken(tokens, idx, options);
  };

  mdInstance = md;
  return md;
}

export function renderMarkdown(content: string): string {
  return getMd().render(content);
}

export interface Heading {
  id: string;
  text: string;
  level: number;
}

export function extractHeadings(html: string): Heading[] {
  const headings: Heading[] = [];
  const regex = /<h([23])[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/gi;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(html)) !== null) {
    const level = parseInt(m[1], 10);
    const id = m[2];
    const text = m[3].replace(/<[^>]+>/g, "").trim();
    headings.push({ id, text, level });
  }
  return headings;
}
