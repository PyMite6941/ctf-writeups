/* index.js — builds the writeup listing from posts/manifest.json */

(function () {
  "use strict";

  const listEl = document.getElementById("post-list");
  const statsEl = document.getElementById("stats");
  const filtersEl = document.getElementById("filters");

  let posts = [];
  let activeCategory = "All";

  init();

  async function init() {
    try {
      const res = await fetch("posts/manifest.json", { cache: "no-cache" });
      if (!res.ok) throw new Error(`manifest.json returned ${res.status}`);
      posts = await res.json();
    } catch (err) {
      showError(err);
      return;
    }

    if (!Array.isArray(posts)) {
      showError(new Error("manifest.json must contain an array"));
      return;
    }

    // newest first
    posts.sort((a, b) => String(b.date ?? "").localeCompare(String(a.date ?? "")));

    renderStats();
    renderFilters();
    renderList();
  }

  function renderStats() {
    const categories = new Set(posts.map((p) => p.category).filter(Boolean));
    const platforms = new Set(posts.map((p) => p.platform).filter(Boolean));

    statsEl.innerHTML = `
      <div class="stat"><span class="num">${posts.length}</span><span class="label">Writeups</span></div>
      <div class="stat"><span class="num">${categories.size}</span><span class="label">Categories</span></div>
      <div class="stat"><span class="num">${platforms.size}</span><span class="label">Platforms</span></div>
    `;
  }

  function renderFilters() {
    const categories = [
      "All",
      ...new Set(posts.map((p) => p.category).filter(Boolean)),
    ];

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
      listEl.innerHTML = `<li class="empty">No writeups here yet.</li>`;
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
