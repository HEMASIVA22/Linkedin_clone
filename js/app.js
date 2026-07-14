// Shared shell: session, nav, search, toasts, theme
(function () {
  const AUTH_KEY = "lk.user";
  const THEME_KEY = "lk.theme";
  const SEARCH_HIST_KEY = "lk.searchhist";

  // Session
  window.getUser = () => LS.get(AUTH_KEY, null);
  window.setUser = (u) => LS.set(AUTH_KEY, u);
  window.logout = () => {
    LS.del(AUTH_KEY);
    location.href = "./index.html";
  };

  // Require auth on non-auth pages
  window.requireAuth = () => {
    const u = getUser();
    if (!u) {
      location.href = "./index.html";
      return null;
    }
    return u;
  };

  // Theme
  const applyTheme = (t) => {
    document.documentElement.setAttribute("data-theme", t);
  };
  window.applyTheme = applyTheme;
  applyTheme(LS.get(THEME_KEY, "light"));

  // Toast
  window.toast = (msg, type = "") => {
    let host = document.querySelector(".toasts");
    if (!host) {
      host = document.createElement("div");
      host.className = "toasts";
      document.body.appendChild(host);
    }
    const t = document.createElement("div");
    t.className = "toast " + type;
    t.textContent = msg;
    host.appendChild(t);
    setTimeout(() => {
      t.style.opacity = "0";
      t.style.transition = "opacity .3s";
      setTimeout(() => t.remove(), 300);
    }, 2400);
  };

  // Modal helper
  window.openModal = (contentEl, opts = {}) => {
    const back = document.createElement("div");
    back.className = "modal-back";
    const modal = document.createElement("div");
    modal.className = "modal";
    if (opts.title) {
      const h = document.createElement("div");
      h.className = "modal-head";
      h.innerHTML = `<h3>${opts.title}</h3><button class="icon-btn" data-close>${ICON.x}</button>`;
      modal.appendChild(h);
    }
    const body = document.createElement("div");
    body.className = "modal-body";
    body.appendChild(contentEl);
    modal.appendChild(body);
    if (opts.footer) {
      const f = document.createElement("div");
      f.className = "modal-foot";
      f.appendChild(opts.footer);
      modal.appendChild(f);
    }
    back.appendChild(modal);
    document.body.appendChild(back);
    const close = () => back.remove();
    back.addEventListener("click", (e) => {
      if (e.target === back) close();
    });
    modal.addEventListener("click", (e) => {
      if (e.target.closest("[data-close]")) close();
    });
    document.addEventListener("keydown", function esc(e) {
      if (e.key === "Escape") {
        close();
        document.removeEventListener("keydown", esc);
      }
    });
    return { close, modal };
  };

  // Nav render
  window.renderNav = (active) => {
    const u = getUser();
    if (!u) return "";
    const notifCount = (LS.get("lk.notif", []) || []).filter(
      (n) => !n.read,
    ).length;
    const links = [
      ["home", "Home", "./home.html", ICON.home],
      ["network", "My Network", "./network.html", ICON.network],
      ["jobs", "Jobs", "./jobs.html", ICON.jobs],
      ["messages", "Messaging", "./messages.html", ICON.msg],
      ["notifications", "Notifications", "./notifications.html", ICON.bell],
      ["videos", "Videos", "./videos.html", ICON.video],
    ];
    const linksHtml = links
      .map(
        ([k, l, h, ic]) => `
      <a class="nav-link ${active === k ? "active" : ""} ${k === "videos" ? "desktop-only" : ""}" href="${h}">
        ${ic}<span>${l}</span>
        ${k === "notifications" && notifCount ? `<span class="badge">${notifCount > 9 ? "9+" : notifCount}</span>` : ""}
      </a>`,
      )
      .join("");
    return `
      <header class="nav"><div class="nav-inner">
        <a class="brand" href="./home.html"><div class="brand-logo">in</div></a>
        <div class="search">
          <span class="ic">${ICON.search}</span>
          <input id="globalSearch" placeholder="Search people, jobs, posts…" autocomplete="off"/>
          <div id="searchDD" class="search-dd hidden"></div>
        </div>
        <nav class="nav-links">
          ${linksHtml}
          <a class="nav-link desktop-only" href="./profile.html">
            <img class="avatar" src="${u.avatar}" alt=""/><span>Me</span>
          </a>
          <a class="nav-link desktop-only" href="./settings.html" title="Settings">${ICON.gear}<span>Settings</span></a>
        </nav>
      </div></header>
      <nav class="mobile-nav"><div class="row">
        ${links
          .filter((l) =>
            ["home", "network", "jobs", "videos", "notifications"].includes(
              l[0],
            ),
          )
          .map(
            ([k, l, h, ic]) => `
          <a class="nav-link ${active === k ? "active" : ""}" href="${h}">${ic}<span>${l}</span>
          ${k === "notifications" && notifCount ? `<span class="badge">${notifCount > 9 ? "9+" : notifCount}</span>` : ""}</a>`,
          )
          .join("")}
      </div></nav>`;
  };

  window.mountNav = (active) => {
    const u = requireAuth();
    if (!u) return;
    const host = document.getElementById("nav");
    if (host) host.innerHTML = renderNav(active);
    wireSearch();
  };

  // Search
  function wireSearch() {
    const input = document.getElementById("globalSearch");
    if (!input) return;
    const dd = document.getElementById("searchDD");
    const hist = () => LS.get(SEARCH_HIST_KEY, []);
    const pushHist = (q) => {
      const h = hist().filter((x) => x !== q);
      h.unshift(q);
      LS.set(SEARCH_HIST_KEY, h.slice(0, 6));
    };

    const render = (q) => {
      const query = q.trim().toLowerCase();
      dd.classList.remove("hidden");
      if (!query) {
        const h = hist();
        dd.innerHTML =
          `<div class="hd"><span>Recent searches</span>${h.length ? '<button id="clearHist" style="color:var(--primary);font-weight:700">Clear</button>' : ""}</div>` +
          (h.length
            ? h
                .map(
                  (x) =>
                    `<div class="row" data-q="${x}">${ICON.search}<span>${x}</span></div>`,
                )
                .join("")
            : `<div class="empty">No recent searches</div>`);
        const c = document.getElementById("clearHist");
        if (c)
          c.onclick = (e) => {
            e.stopPropagation();
            LS.set(SEARCH_HIST_KEY, []);
            render("");
          };
      } else {
        const hl = (t) =>
          t.replace(
            new RegExp(
              "(" + query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")",
              "ig",
            ),
            "<mark>$1</mark>",
          );
        const people = SEED.people
          .filter(
            (p) =>
              p.name.toLowerCase().includes(query) ||
              p.company.toLowerCase().includes(query),
          )
          .slice(0, 5);
        const jobs = SEED.jobs
          .filter(
            (j) =>
              j.title.toLowerCase().includes(query) ||
              j.company.toLowerCase().includes(query),
          )
          .slice(0, 4);
        const tags = SEED.hashtags.filter((h) => h.includes(query)).slice(0, 4);
        let html = "";
        if (people.length) {
          html += `<div class="hd">People</div>`;
          html += people
            .map(
              (p) =>
                `<a class="row" href="./profile.html?u=${p.id}"><img class="avatar" style="width:32px;height:32px" src="${p.avatar}"/><div><b>${hl(p.name)}</b><div style="color:var(--muted);font-size:12px">${hl(p.role)} at ${hl(p.company)}</div></div></a>`,
            )
            .join("");
        }
        if (jobs.length) {
          html += `<div class="hd">Jobs</div>`;
          html += jobs
            .map(
              (j) =>
                `<a class="row" href="./jobs.html?j=${j.id}">${ICON.jobs}<div><b>${hl(j.title)}</b><div style="color:var(--muted);font-size:12px">${hl(j.company)} • ${j.location}</div></div></a>`,
            )
            .join("");
        }
        if (tags.length) {
          html += `<div class="hd">Hashtags</div>`;
          html += tags
            .map(
              (t) =>
                `<div class="row" data-q="${t}">#<b>${hl(t.slice(1))}</b></div>`,
            )
            .join("");
        }
        if (!html) html = `<div class="empty">No matches for "${q}"</div>`;
        dd.innerHTML = html;
      }
      dd.querySelectorAll("[data-q]").forEach((el) =>
        el.addEventListener("click", () => {
          input.value = el.dataset.q;
          render(el.dataset.q);
        }),
      );
    };

    input.addEventListener("focus", () => render(input.value));
    input.addEventListener("input", () => render(input.value));
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && input.value.trim()) {
        pushHist(input.value.trim());
        toast("Searching: " + input.value);
        dd.classList.add("hidden");
      }
      if (e.key === "Escape") {
        dd.classList.add("hidden");
        input.blur();
      }
    });
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".search")) dd.classList.add("hidden");
    });

    // Keyboard shortcut: /
    document.addEventListener("keydown", (e) => {
      if (
        e.key === "/" &&
        document.activeElement.tagName !== "INPUT" &&
        document.activeElement.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        input.focus();
      }
    });
  }

  // Notifications helper
  window.addNotif = (n) => {
    const list = LS.get("lk.notif", []);
    list.unshift({ id: "n" + Date.now(), read: false, time: "now", ...n });
    LS.set("lk.notif", list.slice(0, 50));
  };
})();
