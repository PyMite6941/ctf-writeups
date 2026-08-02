/* index.js — builds the writeup listing.
 *
 * manifest.json holds ONLY a list of slugs. Every piece of displayed
 * metadata (title, platform, category, difficulty, date) is read from the
 * frontmatter of the markdown file itself, so the .md is the single source
 * of truth and the counts below can never drift out of sync with reality.
 *
 * A static host can't enumerate a directory, which is the only reason the
 * slug list exists at all.
 */

(function () {
  "use strict";

  const listEl = document.getElementById("post-list");
  const statsEl = document.getElementById("stats");
  const filtersEl = document.getElementById("filters");

  let posts = [];
  let activeCategory = "All";

  init();

  async function init() {
    let slugs;
    try {
      const res = await fetch("posts/manifest.json", { cache: "no-cache" });
      if (!res.ok) throw new Error(`manifest.json returned ${res.status}`);
      slugs = await res.json();
    } catch (err) {
      showError(err);
      return;
    }

    if (!Array.isArray(slugs)) {
      showError(new Error("manifest.json must contain an array of slugs"));
      return;
    }

    posts = (await Promise.all(slugs.map(loadPost))).filter(Boolean);

    // Newest first. Undated posts sort last rather than disappearing.
    posts.sort((a, b) => (b.date || "").localeCompare(a.date || ""));

    renderStats();
    renderFilters();
    renderList();
  }

  /** Fetch one writeup and read its metadata straight from the frontmatter. */
  async function loadPost(slug) {
    if (typeof slug !== "string" || !/^[a-z0-9-]+$/i.test(slug)) {
      console.warn(`Skipping invalid slug: ${JSON.stringify(slug)}`);
      return null;
    }

    try {
      const res = await fetch(`posts/${slug}.md`, { cache: "no-cache" });
      if (!res.ok) throw new Error(`returned ${res.status}`);
      const { meta } = parseFrontmatter(await res.text());
      return {
        slug,
        title: meta.title || slug,
        platform: meta.platform || "",
        category: meta.category || "",
        difficulty: meta.difficulty || "",
        date: meta.date || "",
      };
    } catch (err) {
      // Listed but missing/unreadable — warn and carry on rather than
      // taking the whole page down for one bad entry.
      console.warn(`Could not load posts/${slug}.md — ${err.message}`);
      return null;
    }
  }

  /** Counts are derived from the loaded posts, never hardcoded. */
  function renderStats() {
    const count = (key) =>
      new Set(posts.map((p) => p[key]).filter(Boolean)).size;

    const stats = [
      [posts.length, posts.length === 1 ? "Writeup" : "Writeups"],
      [count("category"), count("category") === 1 ? "Category" : "Categories"],
      [count("platform"), count("platform") === 1 ? "Platform" : "Platforms"],
    ];

    statsEl.innerHTML = stats
      .map(
        ([num, label]) =>
          `<div class="stat"><span class="num">${num}</span><span class="label">${label}</span></div>`,
      )
      .join("");
  }

  function renderFilters() {
    const categories = [
      "All",
      ...new Set(posts.map((p) => p.category).filter(Boolean)),
    ];

    // Nothing to filter between with 0 or 1 real category.
    if (categories.length <= 2) {
      filtersEl.innerHTML = "";
      return;
    }

    filtersEl.innerHTML = categories
      .map(
        (cat) =>
          `<button class="filter-btn${cat === activeCategory ? " active" : ""}" data-cat="${esc(cat)}">${esc(cat)}</button>`,
      )
      .join("");

    filtersEl.addEventListener("click", (e) => {
      const btn = e.target.closest(".filter-btn");
      if (!btn) return;
      activeCategory = btn.dataset.cat;
      filtersEl
        .querySelectorAll(".filter-btn")
        .forEach((b) => b.classList.toggle("active", b === btn));
      renderList();
    });
  }

  function renderList() {
    const visible =
      activeCategory === "All"
        ? posts
        : posts.filter((p) => p.category === activeCategory);

    if (visible.length === 0) {
      listEl.innerHTML = `<li class="empty">No writeups published yet.</li>`;
      return;
    }

    listEl.innerHTML = visible
      .map((post) => {
        const meta = [
          post.platform && `<span class="pill">${esc(post.platform)}</span>`,
          post.category && `<span class="pill">${esc(post.category)}</span>`,
          post.difficulty &&
            `<span class="pill diff-${esc(post.difficulty)}">${esc(post.difficulty)}</span>`,
          post.date && `<span>${esc(post.date)}</span>`,
        ]
          .filter(Boolean)
          .join("");

        return `
          <li class="post-item">
            <a href="writeup.html?post=${encodeURIComponent(post.slug)}">
              <h2>${esc(post.title)}</h2>
              <div class="post-meta">${meta}</div>
            </a>
          </li>`;
      })
      .join("");
  }

  function showError(err) {
    const isFileProtocol = window.location.protocol === "file:";
    listEl.innerHTML = `
      <li class="empty">
        <strong>Couldn't load the writeup index.</strong>
        <p style="margin:.75rem 0 0">${esc(err.message)}</p>
        ${
          isFileProtocol
            ? `<p style="margin:.75rem 0 0">You've opened this file directly from disk.
               <code>fetch()</code> is blocked on <code>file://</code>, so you need a local
               server:<br><code>python -m http.server</code> then visit
               <code>http://localhost:8000</code>.</p>`
            : ""
        }
      </li>`;
    statsEl.innerHTML = "";
  }
})();
