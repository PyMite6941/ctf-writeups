/* md.js — shared markdown helpers (frontmatter parsing + safe rendering) */

/**
 * Split a markdown file into its YAML-ish frontmatter and body.
 * Frontmatter is a simple `key: value` block delimited by `---` lines.
 * Nested YAML is deliberately unsupported — keep writeup metadata flat.
 *
 * @param {string} raw
 * @returns {{meta: Object<string,string>, body: string}}
 */
function parseFrontmatter(raw) {
  const text = raw.replace(/^﻿/, "").replace(/\r\n/g, "\n");
  const match = text.match(/^---\n([\s\S]*?)\n---\n?/);

  if (!match) return { meta: {}, body: text };

  const meta = {};
  for (const line of match[1].split("\n")) {
    const sep = line.indexOf(":");
    if (sep === -1) continue;
    const key = line.slice(0, sep).trim();
    let value = line.slice(sep + 1).trim();
    // strip matching surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key) meta[key] = value;
  }

  return { meta, body: text.slice(match[0].length) };
}

/**
 * Render markdown to sanitised HTML.
 * Sanitising is belt-and-braces — the content is Matt's own — but these pages
 * are public and the cost is one function call.
 *
 * @param {string} markdown
 * @returns {string} HTML safe to assign to innerHTML
 */
function renderMarkdown(markdown) {
  const html = marked.parse(markdown, { gfm: true, breaks: false });
  return DOMPurify.sanitize(html);
}

/**
 * Syntax-highlight every code block inside a container, and wrap tables so
 * they scroll horizontally instead of blowing out the page on mobile.
 *
 * @param {HTMLElement} container
 */
function enhanceArticle(container) {
  if (typeof hljs === "undefined") {
    // Loud on purpose: a silent catch here once hid a wrong CDN path that
    // left every code block unhighlighted with no error anywhere.
    console.warn("highlight.js did not load — code blocks will be unstyled.");
  } else {
    container.querySelectorAll("pre code").forEach((block) => {
      try {
        hljs.highlightElement(block);
      } catch (err) {
        console.warn("Highlighting failed for a block:", err);
      }
    });
  }

  container.querySelectorAll("table").forEach((table) => {
    if (table.parentElement?.classList.contains("table-scroll")) return;
    const scroller = document.createElement("div");
    scroller.className = "table-scroll";
    table.replaceWith(scroller);
    scroller.appendChild(table);
  });
}

/** Escape a string for safe interpolation into HTML. */
function esc(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c],
  );
}
