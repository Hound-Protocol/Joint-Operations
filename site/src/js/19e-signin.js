  /* ---------------- Sign-in with GitHub and the profile (ADR 0017, docs/signin.md) ----------------
     The relay (tools/signin-relay/worker.js) swaps GitHub's one-time sign-in code for a short-lived user token and posts it
     back to this window. The token stays in this tab only (sessionStorage) and can read nothing but the restricted document
     repositories the person's GitHub teams already allow. The keycard comes from the person's signed staff card, matched by
     GitHub account number; anyone else signed in holds a member card (LV2). While config.signin.relay is empty, sign-in is off. */
  var SI_KEY = "hp.signin";
  var SI = null;
  try { SI = JSON.parse(sessionStorage.getItem(SI_KEY) || "null"); } catch (e) { SI = null; }
  function siCfg() { return cfg.signin || {}; }
  function siOn() { return !!siCfg().relay; }
  function siSave() { try { if (SI) sessionStorage.setItem(SI_KEY, JSON.stringify(SI)); else sessionStorage.removeItem(SI_KEY); } catch (e) { /* private mode: the session lives in this page only */ } }
  function siIn() { return !!(SI && SI.token && SI.user && (!SI.exp || SI.exp > Date.now())); }
  function siApi(path, raw) {
    var h = { Authorization: "Bearer " + SI.token, Accept: raw ? "application/vnd.github.raw+json" : "application/vnd.github+json" };
    if (typeof fetch !== "function") return Promise.reject(new Error("This browser cannot sign in"));
    return fetch("https://api.github.com" + path, { headers: h, cache: "no-store" }).then(function (r) {
      if (r.status === 401) { SI = null; siSave(); siBadge(); }
      if (!r.ok) { var e = new Error("HTTP " + r.status); e.status = r.status; throw e; }
      return raw ? r.text() : r.json();
    });
  }
  function signIn() {
    if (!siOn()) return Promise.reject(new Error("Sign-in is not switched on yet."));
    var relay = siCfg().relay.replace(/\/$/, ""), origin;
    try { origin = new URL(relay).origin; } catch (e) { return Promise.reject(new Error("The sign-in relay address is not valid.")); }
    var w = window.open(relay + "/login", "hpsignin", "width=520,height=720");
    if (!w) return Promise.reject(new Error("Allow pop-ups for this site to sign in."));
    return new Promise(function (ok, fail) {
      var done = false, t;
      function on(e) {
        if (e.origin !== origin || !e.data || !e.data.houndSignin) return;
        done = true; clearInterval(t); window.removeEventListener("message", on);
        var m = e.data.houndSignin;
        if (m.error || !m.token) { fail(new Error(m.error || "Sign-in failed.")); return; }
        SI = { token: m.token, exp: m.expires_in ? Date.now() + m.expires_in * 1000 : 0 };
        siApi("/user").then(function (u) {
          SI.user = { id: u.id, login: u.login, name: u.name || "", avatar: u.avatar_url };
          siSave(); siBadge(); ok(SI.user);
        }, function () { SI = null; siSave(); fail(new Error("Could not read your GitHub account.")); });
      }
      window.addEventListener("message", on);
      t = setInterval(function () { if (w.closed && !done) { clearInterval(t); window.removeEventListener("message", on); fail(new Error("The sign-in window was closed.")); } }, 500);
    });
  }
  function signOut() { SI = null; siSave(); siBadge(); }
  /* The person's card: their active staff card, or a member card (LV2) */
  function siCard() {
    if (!siIn()) return null;
    var staff = (data.staff && data.staff.staff) || [];
    var s = staff.filter(function (x) { return x.github_id === SI.user.id && x.status === "active"; })[0];
    if (s) return Object.assign({}, s, { avatar: SI.user.avatar, name: s.name || SI.user.name });
    return { id: "MEMBER", login: SI.user.login, name: SI.user.name, github_id: SI.user.id, avatar: SI.user.avatar, card: "LV2", department: "Member", since: "", status: "active", member: true };
  }
  function siLevel() { var c = siCard(); return c ? +String(c.card).slice(2) : 1; }
  /* The badge in the top bar: "Sign in", or the person's level and name */
  function siBadge() {
    var b = $("#siBadge");
    if (!siOn()) { if (b) b.remove(); return; }
    if (!b) {
      var keys = $("#keys"); if (!keys) return;
      keys.insertAdjacentHTML("beforebegin", '<a class="si-badge" id="siBadge" href="#/profile"></a>');
      b = $("#siBadge");
    }
    var c = siCard();
    b.innerHTML = c ? '<i style="--hk:' + (KC_LV[c.card] || KC_LV.LV2)[1] + '">' + esc(c.card) + "</i><span>" + esc(c.name || c.login) + "</span>" : "<i>ID</i><span>Sign in</span>";
    b.classList.toggle("in", !!c);
    b.setAttribute("aria-label", c ? "Your profile, " + c.card : "Sign in with GitHub");
  }

  /* ---- Restricted document areas: one private repository per clearance ---- */
  var siTrees = {};
  function siArea(a) {
    if (siTrees[a.repo]) return siTrees[a.repo];
    return (siTrees[a.repo] = siApi("/repos/" + a.repo).then(function (r) {
      return siApi("/repos/" + a.repo + "/git/trees/" + encodeURIComponent(r.default_branch) + "?recursive=1");
    }).then(function (t) {
      return (t.tree || []).filter(function (n) { return n.type === "blob" && /\.md$/i.test(n.path) && !/(^|\/)README\.md$/i.test(n.path); }).map(function (n) { return n.path; });
    }, function (e) { delete siTrees[a.repo]; throw e; }));
  }
  function siTitle(path) { return path.replace(/\.md$/i, "").split("/").pop().replace(/[-_]+/g, " ").replace(/^\w/, function (c) { return c.toUpperCase(); }); }

  function viewProfile() {
    var v = $("#view");
    v.innerHTML = shell("Hound ID", "Profile", loading("Opening your profile"));
    Promise.all([loadLocal("staff"), loadLocal("records"), loadLocal("records-key"), loadLocal("contracts")]).then(function (res) {
      if (currentView !== "profile") return;
      var keys = (res[2] && res[2].keys) || [];
      if (!siIn()) return drawSignedOut();
      var c = siCard(), lvl = siLevel(), areas = siCfg().areas || [];
      $("#vb").innerHTML =
        '<div class="kc-profile">' + keycard(c, { big: true }) +
        '<dl class="kc-facts"><div><dt>GitHub</dt><dd><a href="https://github.com/' + encodeURIComponent(c.login) + '" target="_blank" rel="noopener noreferrer">' + esc(c.login) + "</a> · account #" + esc(c.github_id) + "</dd></div>" +
          "<div><dt>Card</dt><dd>" + (c.member ? 'Member card. Staff cards are issued by Administration (<a href="#/guides/hp-gde-009">how</a>).' : '<a href="#/verify/' + esc(c.id) + '">Signed staff card ' + esc(c.id) + "</a>") + "</dd></div>" +
          "<div><dt>Session</dt><dd>" + (SI.exp ? "Signed in until " + esc(new Date(SI.exp).toTimeString().slice(0, 5)) + " in this tab" : "Signed in, in this tab") + "</dd></div>" +
          '<div><dt></dt><dd><button class="btn small" id="siOut">Sign out</button></dd></div></dl></div>' +
        '<div class="label">Your documents</div>' +
        '<p class="sub">Restricted documents live in private repositories, one per clearance. GitHub decides what you can read, through your teams; your card shows what your clearance should open.</p>' +
        (areas.length ? '<div class="si-areas">' + areas.map(function (a, i) {
          var need = +String(a.card).slice(2), open = lvl >= need;
          return '<section class="si-area' + (open ? "" : " locked") + '" data-a="' + i + '" style="--hk:' + (KC_LV[a.card] || KC_LV.LV3)[1] + '"><header><b>' + esc(a.title) + "</b><span>" + esc(a.card) + " and up</span></header>" +
            '<div class="si-list">' + (open ? loading("Checking access") : '<p class="sub">Needs ' + esc(a.card) + " clearance.</p>") + "</div></section>";
        }).join("") + "</div>" : '<div class="empty">No restricted areas yet</div>') +
        '<article class="dossier si-reader" id="siDoc" hidden></article>';
      $("#siOut").addEventListener("click", function () { signOut(); status("Signed out"); viewProfile(); });
      areas.forEach(function (a, i) {
        if (lvl < +String(a.card).slice(2)) return;
        var box = $('.si-area[data-a="' + i + '"] .si-list');
        siArea(a).then(function (paths) {
          if (currentView !== "profile") return;
          box.innerHTML = paths.length ? "<ul>" + paths.map(function (p) { return '<li><button type="button" data-p="' + esc(p) + '">' + esc(siTitle(p)) + "<small>" + esc(p) + "</small></button></li>"; }).join("") + "</ul>" : '<p class="sub">No documents here yet.</p>';
          $$("button[data-p]", box).forEach(function (b) { b.addEventListener("click", function () { siOpen(a, b.getAttribute("data-p")); }); });
        }, function (e) {
          box.innerHTML = '<p class="sub">' + (e.status === 404 || e.status === 403 ? "GitHub has not given your account access yet. Ask Administration to add you to the right team." : "Could not reach GitHub. Try again later.") + "</p>";
        });
      });
      if (keys.length && !c.member) markVerified([c], keys);
      else $$('.kc-profile [data-rid] .vs').forEach(function (el) { el.innerHTML = '<span class="status claimed">Signed in</span>'; });
    });
  }
  function siOpen(a, path) {
    var d = $("#siDoc"); if (!d) return;
    d.hidden = false; d.className = "dossier si-reader k-project"; d.innerHTML = loading("Opening " + path);
    siApi("/repos/" + a.repo + "/contents/" + path.split("/").map(encodeURIComponent).join("/"), true).then(function (md) {
      d.style.setProperty("--g", (KC_LV[a.card] || KC_LV.LV3)[1]); d.style.setProperty("--gd", "#4d5a60");
      d.innerHTML = '<div class="ds-tab"><b>' + esc(a.card) + "</b>" + esc(a.title) + '</div><div class="ds-folder"><div class="ds-page">' +
        '<header class="ds-head"><span><img src="assets/brand/hound-protocol-mark-light.svg" alt="" width="20" height="20">Hound Protocol</span><span class="ds-class">Restricted · ' + esc(a.card) + "</span></header>" +
        '<h1 class="ds-title">' + esc(siTitle(path)) + '</h1><div class="ds-meta"><span>' + esc(a.repo) + " · " + esc(path) + '</span><a href="https://github.com/' + esc(a.repo) + "/blob/HEAD/" + esc(path) + '" target="_blank" rel="noopener noreferrer">GitHub</a></div>' +
        '<div class="sh-body ds-body">' + markdown(md.replace(/^# .*\n/, ""), path) + '</div><footer class="ds-foot"><span>Restricted to ' + esc(a.card) + " and up. Do not copy it to public places.</span></footer></div></div>";
      d.classList.remove("in"); void d.offsetWidth; d.classList.add("in");
      if (d.scrollIntoView) d.scrollIntoView({ behavior: opts.motion ? "smooth" : "auto", block: "start" });
    }, function () { d.innerHTML = '<div class="empty">Could not open this document</div>'; });
  }
  function drawSignedOut() {
    var on = siOn();
    $("#vb").innerHTML =
      '<div class="kc-profile">' + keycard(KC_SPECIMEN, { big: true, specimen: true }) +
      '<div class="si-intro"><h3>Sign in with your Hound ID</h3>' +
        "<p>Sign in with GitHub to see your keycard and the documents your clearance opens. Staff get their signed staff card; everyone else gets a member card.</p>" +
        (on ? '<button class="btn primary" id="siGo">Sign in with GitHub</button><p class="sub" id="siMsg">A small GitHub window opens. We never see your password, and nothing is stored on a server.</p>'
            : '<p class="note">Sign-in is not switched on yet.</p>') +
        '<p class="sub">How it works and what is kept: <a href="#/docs/signin">sign-in</a> · <a href="#/docs/privacy">privacy</a></p></div></div>';
    var go = $("#siGo");
    if (go) go.addEventListener("click", function () {
      go.disabled = true; $("#siMsg").textContent = "Waiting for GitHub…";
      signIn().then(function () { status("Signed in"); blip("go"); viewProfile(); }, function (e) { go.disabled = false; $("#siMsg").textContent = e.message; });
    });
  }
