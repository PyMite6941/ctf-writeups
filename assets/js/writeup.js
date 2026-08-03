/* writeup.js — renders a single markdown writeup from ?post=<slug> */

(function () {
  "use strict";

  const headerEl = document.getElementById("post-header");
  const articleEl = document.getElementById("article");

  const slug = new URLSearchParams(window.location.search).get("post");

  init();

  async function init() {
    if (!slug) {
      showError(
        "No writeup specified.",
        'Add a <code>?post=&lt;slug&gt;</code> parameter, or go back to the <a href="index.html">index</a>.',
      );
      return;
    }

    // Slugs map directly onto filenames, so keep them boring — this both
    // prevents path traversal and catches typos early.
    if (!/^[a-z0-9-]+$/i.test(slug)) {
      showError(
        "Invalid writeup name.",
        "Slugs may only contain letters, numbers and hyphens.",
      );
      return;
    }

    let raw;
    try {
      const res = await fetch(`posts/${slug}.md`, { cache: "no-cache" });
      if (!res.ok) throw new Error(`posts/${slug}.md returned ${res.status}`);
      raw = await res.text();
    } catch (err) {
      const fileHint =
        window.location.protocol === "file:"
          ? "<p>You've opened this file directly from disk. <code>fetch()</code> is blocked on <code>file://</code> — run <code>python -m http.server</code> and use <code>http://localhost:8000</code> instead.</p>"
          : "";
      showError(
        "Couldn't load that writeup.",
        `<p>${esc(err.message)}</p>${fileHint}
         <p>Check that <code>posts/${esc(slug)}.md</code> exists and is listed in
         <code>posts/manifest.json</code>.</p>`,
      );
      return;
    }

    const { meta, body } = parseFrontmatter(raw);
    renderHeader(meta);
    articleEl.innerHTML = renderMarkdown(body);
    enhanceArticle(articleEl);
  }

  function renderHeader(meta) {
    const title = meta.title || slug;
    document.title = `${title} — CTF Writeups`;

    const pills = [
      meta.platform && `<span class="pill">${esc(meta.platform)}</span>`,
      meta.category && `<span class="pill">${esc(meta.category)}</span>`,
      meta.difficulty &&
        `<span class="pill diff-${esc(meta.difficulty)}">${esc(meta.difficulty)}</span>`,
      meta.date && `<span>${esc(meta.date)}</span>`,
    ]
      .filter(Boolean)
      .join("");

    // Only linkify http(s) so a stray value can't become a javascript: URL.
    const isSafeUrl = /^https?:\/\//i.test(meta.url || "");
    const link = isSafeUrl
      ? `<p style="margin:.6rem 0 0"><a class="text-link" href="${esc(meta.url)}" target="_blank" rel="noopener noreferrer">View the challenge →</a></p>`
      : "";

    headerEl.innerHTML = `
      <h1>${esc(title)}</h1>
      <div class="post-meta">${pills}</div>
      ${meta.tools ? `<p class="post-meta" style="margin-top:.6rem">Tools: ${esc(meta.tools)}</p>` : ""}
      ${link}
    `;
  }

  function showError(heading, detailHtml) {
    headerEl.innerHTML = `<h1>${esc(heading)}</h1>`;
    articleEl.innerHTML = `<div class="empty">${detailHtml}</div>`;
  }
})();
