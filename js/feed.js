// Feed with posts, reactions, comments, repost, share
window.Feed = (function () {
  const FEED_KEY = "lk.feed",
    COMMENTS_KEY = "lk.comments";
  let posts = [];
  const REACTIONS = [
    { k: "like", e: "👍", l: "Like", c: "r-like" },
    { k: "celebrate", e: "👏", l: "Celebrate", c: "r-celebrate" },
    { k: "support", e: "❤️", l: "Support", c: "r-support" },
    { k: "insightful", e: "💡", l: "Insightful", c: "r-insightful" },
    { k: "funny", e: "😂", l: "Funny", c: "r-funny" },
  ];
  const rMap = Object.fromEntries(REACTIONS.map((r) => [r.k, r]));

  function load() {
    posts = LS.get(FEED_KEY, null);
    if (!posts) {
      posts = makeFeed();
      LS.set(FEED_KEY, posts);
    }
  }
  function save() {
    LS.set(FEED_KEY, posts);
  }
  function getComments(pid) {
    const all = LS.get(COMMENTS_KEY, {});
    return all[pid] || [];
  }
  function setComments(pid, list) {
    const all = LS.get(COMMENTS_KEY, {});
    all[pid] = list;
    LS.set(COMMENTS_KEY, all);
  }

  function totalReactions(p) {
    return Object.values(p.reactions).reduce((a, b) => a + b, 0);
  }

  function formatBody(text) {
    // escape
    const esc = text.replace(
      /[&<>]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c],
    );
    // hashtags
    const withTags = esc.replace(/(#\w+)/g, '<span class="hashtag">$1</span>');
    return withTags;
  }

  function postHTML(p) {
    const total = totalReactions(p);
    const topR = Object.entries(p.reactions)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .filter(([, c]) => c > 0);
    const long = p.body.length > 260;
    const short = long ? p.body.slice(0, 260) + "…" : p.body;
    const myR = p.myReaction ? rMap[p.myReaction] : null;
    return `<article class="card post" data-id="${p.id}">
      <div class="post-head">
        <a href="/profile.html?u=${p.authorId}"><img src="${p.avatar}" alt=""/></a>
        <div class="post-meta">
          <div class="post-author"><a href="/profile.html?u=${p.authorId}">${p.author}</a></div>
          <div class="post-role">${p.role} at ${p.company}</div>
          <div class="post-time">${p.time} · 🌐</div>
        </div>
        <button class="follow-btn ${p.following ? "following" : ""}" data-act="follow">${p.following ? "✓ Following" : "+ Follow"}</button>
        <button class="icon-btn" data-act="save" title="Save">${p.saved ? "★" : "☆"}</button>
      </div>
      <div class="post-body"><span class="body-text">${formatBody(long ? short : p.body)}</span>${long ? `<button class="see-more" data-act="more">see more</button>` : ""}</div>
      ${p.image ? `<img class="post-image" src="${p.image}" alt=""/>` : ""}
      <div class="post-metrics">
        <div class="metrics-left">${topR.length ? `<span class="reactions-stack">${topR.map(([k]) => `<span class="${rMap[k].c}">${rMap[k].e}</span>`).join("")}</span>` : ""}
        <span style="margin-left:6px">${total.toLocaleString()}</span></div>
        <div><span data-act="show-comments" style="cursor:pointer">${p.commentsCount} comments</span> · ${p.shares} reposts</div>
      </div>
      <div class="post-actions">
        <div class="action-wrap">
          <button class="action-btn ${p.myReaction ? "active" : ""}" data-act="react" style="${myR ? `color:var(--primary)` : ""}">
            <span style="font-size:18px">${myR ? myR.e : "👍"}</span>
            <span>${myR ? myR.l : "Like"}</span>
          </button>
        </div>
        <button class="action-btn" data-act="show-comments">${ICON.comment}<span>Comment</span></button>
        <button class="action-btn" data-act="repost">${ICON.repost}<span>Repost</span></button>
        <button class="action-btn" data-act="send">${ICON.send}<span>Send</span></button>
      </div>
      <div class="comments hidden" data-role="comments"></div>
    </article>`;
  }

  function render() {
    const feed = document.getElementById("feed");
    feed.innerHTML = posts
      .slice(0, page * 10)
      .map(postHTML)
      .join("");
  }

  let page = 1;
  function renderMore() {
    page++;
    render();
  }

  function toggleReaction(pid, kind) {
    const p = posts.find((x) => x.id === pid);
    if (!p) return;
    if (p.myReaction === kind) {
      p.reactions[kind] = Math.max(0, p.reactions[kind] - 1);
      p.myReaction = null;
    } else {
      if (p.myReaction) {
        p.reactions[p.myReaction] = Math.max(0, p.reactions[p.myReaction] - 1);
      }
      p.reactions[kind] = (p.reactions[kind] || 0) + 1;
      p.myReaction = kind;
      addNotif({
        actor: p.author,
        avatar: p.avatar,
        text: `You reacted ${rMap[kind].e} to a post by ${p.author}`,
      });
    }
    save();
    render();
  }

  function commentsHTML(pid) {
    const list = getComments(pid);
    const me = getUser();
    return `<div class="comment-input">
      <img src="${me.avatar}"/>
      <div class="box" style="flex:1">
        <textarea placeholder="Add a comment…"></textarea>
        <div class="row"><button class="btn ghost" data-act="cancel-c">Cancel</button><button class="btn" data-act="send-c">Post</button></div>
      </div></div>
      <div data-role="clist">${list.map((c) => commentHTML(pid, c)).join("") || ""}</div>`;
  }
  function commentHTML(pid, c, isReply = false) {
    return `<div class="comment ${isReply ? "reply" : ""}" data-cid="${c.id}">
      <img src="${c.avatar}"/>
      <div class="bubble">
        <div><span class="who">${c.author}</span><span class="when">${c.time}</span></div>
        <div class="txt">${c.text.replace(/[<>&]/g, (x) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[x])}</div>
        <div class="tools">
          <button data-cact="like">${c.liked ? "♥ Liked" : "♡ Like"} ${c.likes || 0}</button>
          <button data-cact="reply">Reply</button>
          ${c.author === getUser().name ? `<button data-cact="delete" style="color:var(--danger)">Delete</button>` : ""}
        </div>
        ${(c.replies || []).length ? `<div class="replies">${c.replies.map((r) => commentHTML(pid, r, true)).join("")}</div>` : ""}
      </div>
    </div>`;
  }

  function attachCommentEvents(article, pid) {
    const box = article.querySelector('[data-role="comments"]');
    const ta = box.querySelector("textarea");
    box.querySelector('[data-act="cancel-c"]').onclick = () => {
      ta.value = "";
    };
    box.querySelector('[data-act="send-c"]').onclick = () => {
      const t = ta.value.trim();
      if (!t) return;
      const me = getUser();
      const list = getComments(pid);
      list.push({
        id: "c" + Date.now(),
        author: me.name,
        avatar: me.avatar,
        text: t,
        time: "now",
        likes: 0,
        liked: false,
        replies: [],
      });
      setComments(pid, list);
      const p = posts.find((x) => x.id === pid);
      p.commentsCount++;
      save();
      ta.value = "";
      box.querySelector('[data-role="clist"]').innerHTML = list
        .map((c) => commentHTML(pid, c))
        .join("");
      article.querySelector('[data-act="show-comments"]').textContent =
        `${p.commentsCount} comments`;
      wireCommentActions(box, pid);
    };
    wireCommentActions(box, pid);
  }
  function wireCommentActions(box, pid) {
    box.querySelectorAll("[data-cid]").forEach((el) => {
      const cid = el.dataset.cid;
      el.querySelectorAll("[data-cact]").forEach((btn) => {
        btn.onclick = () => {
          const list = getComments(pid);
          const find = (arr) => {
            for (const c of arr) {
              if (c.id === cid) return { p: arr, c };
              if (c.replies) {
                const f = find(c.replies);
                if (f) return f;
              }
            }
            return null;
          };
          const found = find(list);
          if (!found) return;
          const { p: parent, c } = found;
          const act = btn.dataset.cact;
          if (act === "like") {
            c.liked = !c.liked;
            c.likes = (c.likes || 0) + (c.liked ? 1 : -1);
          }
          if (act === "delete") {
            parent.splice(parent.indexOf(c), 1);
            const p = posts.find((x) => x.id === pid);
            p.commentsCount = Math.max(0, p.commentsCount - 1);
            save();
          }
          if (act === "reply") {
            const t = prompt("Reply:");
            if (!t) return;
            const me = getUser();
            c.replies = c.replies || [];
            c.replies.push({
              id: "c" + Date.now(),
              author: me.name,
              avatar: me.avatar,
              text: t,
              time: "now",
              likes: 0,
              liked: false,
              replies: [],
            });
            const p = posts.find((x) => x.id === pid);
            p.commentsCount++;
            save();
          }
          setComments(pid, list);
          box.querySelector('[data-role="clist"]').innerHTML = list
            .map((c) => commentHTML(pid, c))
            .join("");
          wireCommentActions(box, pid);
        };
      });
    });
  }

  function openReactionPop(article, pid, anchor) {
    const existing = article.querySelector(".reaction-pop");
    if (existing) {
      existing.remove();
      return;
    }
    const pop = document.createElement("div");
    pop.className = "reaction-pop";
    pop.innerHTML = REACTIONS.map(
      (r) => `<button title="${r.l}" data-r="${r.k}">${r.e}</button>`,
    ).join("");
    anchor.parentElement.appendChild(pop);
    pop.querySelectorAll("[data-r]").forEach(
      (b) =>
        (b.onclick = (e) => {
          e.stopPropagation();
          toggleReaction(pid, b.dataset.r);
        }),
    );
    setTimeout(
      () =>
        document.addEventListener("click", function h(ev) {
          if (
            !ev.target.closest(".reaction-pop") &&
            !ev.target.closest('[data-act="react"]')
          ) {
            pop.remove();
            document.removeEventListener("click", h);
          }
        }),
      10,
    );
  }

  function onFeedClick(e) {
    const article = e.target.closest(".post");
    if (!article) return;
    const pid = article.dataset.id;
    const p = posts.find((x) => x.id === pid);
    if (!p) return;
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const act = btn.dataset.act;
    if (act === "follow") {
      p.following = !p.following;
      save();
      btn.classList.toggle("following");
      btn.textContent = p.following ? "✓ Following" : "+ Follow";
      toast(p.following ? `Following ${p.author}` : "Unfollowed");
      return;
    }
    if (act === "save") {
      p.saved = !p.saved;
      save();
      btn.textContent = p.saved ? "★" : "☆";
      toast(p.saved ? "Saved" : "Removed from saved");
      return;
    }
    if (act === "more") {
      btn.parentElement.querySelector(".body-text").innerHTML = formatBody(
        p.body,
      );
      btn.textContent = "see less";
      btn.dataset.act = "less";
      return;
    }
    if (act === "less") {
      btn.parentElement.querySelector(".body-text").innerHTML = formatBody(
        p.body.slice(0, 260) + "…",
      );
      btn.textContent = "see more";
      btn.dataset.act = "more";
      return;
    }
    if (act === "react") {
      // Long-press style: click toggles like, right-click / long shows picker
      if (e.detail === 2 || e.shiftKey) {
        openReactionPop(article, pid, btn);
        return;
      }
      toggleReaction(pid, p.myReaction || "like");
      btn.classList.add("pulse");
      setTimeout(() => btn.classList.remove("pulse"), 350);
      return;
    }
    if (act === "show-comments") {
      const box = article.querySelector('[data-role="comments"]');
      box.classList.toggle("hidden");
      if (!box.dataset.built) {
        box.innerHTML = commentsHTML(pid);
        box.dataset.built = "1";
        attachCommentEvents(article, pid);
      }
      return;
    }
    if (act === "repost") {
      const wrap = document.createElement("div");
      wrap.innerHTML = `<p>Repost this to your feed?</p>
      <textarea class="compose" placeholder="Add your thoughts (optional)"></textarea>`;
      const foot = document.createElement("div");
      foot.style.display = "flex";
      foot.style.gap = "8px";
      foot.innerHTML = `<button class="btn outline" data-act="instant">Repost instantly</button><button class="btn" data-act="thoughts">Repost with thoughts</button>`;
      const m = openModal(wrap, { title: "Repost", footer: foot });
      foot.addEventListener("click", (ev) => {
        const b = ev.target.closest("button");
        if (!b) return;
        const me = getUser();
        const text = wrap.querySelector("textarea").value.trim();
        const newP = {
          ...JSON.parse(JSON.stringify(p)),
          id: "p" + Date.now(),
          authorId: me.id,
          author: me.name,
          avatar: me.avatar,
          role: me.headline || "",
          company: "",
          time: "now",
          body:
            (b.dataset.act === "thoughts" && text ? text + "\n\n" : "") +
            `♻ Reposted from ${p.author}:\n\n` +
            p.body,
          reactions: {
            like: 0,
            celebrate: 0,
            support: 0,
            insightful: 0,
            funny: 0,
          },
          myReaction: null,
          commentsCount: 0,
          shares: 0,
          reposted: true,
          saved: false,
          following: false,
        };
        posts.unshift(newP);
        p.shares++;
        save();
        render();
        addNotif({
          actor: me.name,
          avatar: me.avatar,
          text: `You reposted ${p.author}'s post`,
        });
        toast("Reposted", "success");
        m.close();
      });
      return;
    }
    if (act === "send") {
      const wrap = document.createElement("div");
      wrap.innerHTML = `<input class="compose" style="min-height:0;height:38px;border:1px solid var(--border);border-radius:8px;padding:8px" placeholder="Search connections"/>
      <div style="max-height:300px;overflow:auto;margin-top:8px" id="sendList"></div>`;
      const m = openModal(wrap, { title: "Send post" });
      const list = SEED.people.slice(0, 10);
      const draw = (q = "") =>
        (wrap.querySelector("#sendList").innerHTML = list
          .filter((x) => x.name.toLowerCase().includes(q.toLowerCase()))
          .map(
            (x) => `
        <label class="rail-item" style="cursor:pointer"><img src="${x.avatar}"/><div class="info"><b>${x.name}</b><span>${x.role}</span></div><input type="checkbox" data-uid="${x.id}"/></label>`,
          )
          .join(""));
      draw();
      wrap.querySelector(".compose").oninput = (e) => draw(e.target.value);
      const foot = document.createElement("div");
      foot.innerHTML = `<button class="btn" id="doSend">Send</button>`;
      m.modal
        .appendChild(
          Object.assign(document.createElement("div"), {
            className: "modal-foot",
          }),
        )
        .appendChild(foot.firstChild);
      m.modal.querySelector("#doSend").onclick = () => {
        const to = [...wrap.querySelectorAll("input:checked")].map(
          (i) => i.dataset.uid,
        );
        if (!to.length) {
          toast("Select at least one connection", "error");
          return;
        }
        p.shares++;
        save();
        render();
        toast(
          `Sent to ${to.length} ${to.length === 1 ? "person" : "people"}`,
          "success",
        );
        m.close();
      };
      return;
    }
  }

  function compose(kind) {
    const me = getUser();
    const wrap = document.createElement("div");
    wrap.innerHTML = `<div style="display:flex;gap:10px;align-items:center;margin-bottom:12px">
      <img src="${me.avatar}" style="width:44px;height:44px;border-radius:50%"/>
      <div><b>${me.name}</b><div style="color:var(--muted);font-size:12px">Post to Anyone</div></div>
    </div>
    <textarea class="compose" placeholder="What do you want to talk about?"></textarea>
    <div id="imgPreview"></div>`;
    const foot = document.createElement("div");
    foot.style.display = "flex";
    foot.style.justifyContent = "space-between";
    foot.style.width = "100%";
    foot.style.alignItems = "center";
    foot.innerHTML = `
      <div class="compose-tools">
        <button class="icon-btn" title="Photo" data-t="photo">${ICON.photo}</button>
        <button class="icon-btn" title="Video" data-t="video">${ICON.vid}</button>
        <button class="icon-btn" title="Poll" data-t="poll">${ICON.poll}</button>
        <button class="icon-btn" title="Emoji" data-t="emoji">😊</button>
      </div>
      <button class="btn" id="publish" disabled>Post</button>`;
    const m = openModal(wrap, {
      title: `Create ${kind || "post"}`,
      footer: foot,
    });
    const ta = wrap.querySelector("textarea");
    const pub = m.modal.querySelector("#publish");
    ta.oninput = () => (pub.disabled = !ta.value.trim());
    // Kind seeds
    if (kind === "Poll") {
      ta.value = "Which do you prefer?\n\nOption A:\nOption B:\n\n#poll";
      ta.oninput();
    }
    if (kind === "Event") {
      ta.value = "📅 Event: \nDate: \nLocation: \n\n#event";
      ta.oninput();
    }
    if (kind === "Article") {
      ta.value = "Article title\n\nOpening paragraph…\n\n#article";
      ta.oninput();
    }
    // Tools
    m.modal.querySelector('[data-t="photo"]').onclick = () => {
      const url = coverImg(Math.random().toString());
      wrap.querySelector("#imgPreview").innerHTML =
        `<img src="${url}" style="width:100%;border-radius:8px;margin-top:8px"/>`;
      wrap.dataset.image = url;
      pub.disabled = false;
    };
    m.modal.querySelector('[data-t="video"]').onclick = () =>
      toast("Video attached (demo)");
    m.modal.querySelector('[data-t="poll"]').onclick = () => {
      ta.value += "\n\n📊 Poll:\n- Option 1\n- Option 2";
      ta.oninput();
    };
    m.modal.querySelector('[data-t="emoji"]').onclick = () => {
      ta.value += " 🎉";
      ta.oninput();
    };
    pub.onclick = () => {
      const text = ta.value.trim();
      if (!text) return;
      const newP = {
        id: "p" + Date.now(),
        authorId: me.id,
        author: me.name,
        avatar: me.avatar,
        role: me.headline || "Member",
        company: "",
        time: "now",
        body: text,
        image: wrap.dataset.image || null,
        reactions: {
          like: 0,
          celebrate: 0,
          support: 0,
          insightful: 0,
          funny: 0,
        },
        myReaction: null,
        commentsCount: 0,
        shares: 0,
        reposted: false,
        saved: false,
        following: false,
      };
      posts.unshift(newP);
      save();
      render();
      addNotif({
        actor: me.name,
        avatar: me.avatar,
        text: "Your post is live",
      });
      toast("Post published", "success");
      m.close();
    };
  }

  function initInfinite() {
    const sentinel = document.getElementById("skel");
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && page * 10 < posts.length) {
        sentinel.innerHTML = Array(2)
          .fill(
            `<div class="card skel-post"><div class="skel r1"></div><div class="skel r2"></div><div class="skel r3"></div></div>`,
          )
          .join("");
        setTimeout(() => {
          renderMore();
          sentinel.innerHTML = "";
        }, 400);
      }
    });
    io.observe(sentinel);
  }

  function init() {
    load();
    render();
    document.getElementById("feed").addEventListener("click", onFeedClick);
    // Right-click on reaction opens picker
    document.getElementById("feed").addEventListener("contextmenu", (e) => {
      const btn = e.target.closest('[data-act="react"]');
      if (!btn) return;
      e.preventDefault();
      const article = btn.closest(".post");
      openReactionPop(article, article.dataset.id, btn);
    });
    initInfinite();
  }
  return { init, compose };
})();
