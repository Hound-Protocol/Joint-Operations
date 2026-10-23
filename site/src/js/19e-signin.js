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
  function siIn() { return !!(SI && SI.token && SI.user && SI.exp && SI.exp > Date.now()); }
  /* Guest passes: the owner grants a link that opens LV3 (Staff) for 24 hours. The relay signs and checks the pass and
     reads the Staff documents for the guest; the pass lives in this tab only and cannot be extended here. */
  var SG_KEY = "hp.guest", SG = null;
  try { SG = JSON.parse(sessionStorage.getItem(SG_KEY) || "null"); } catch (e) { SG = null; }
  function sgSave() { try { if (SG) sessionStorage.setItem(SG_KEY, JSON.stringify(SG)); else sessionStorage.removeItem(SG_KEY); } catch (e) { /* this page only */ } }
  function sgIn() { return !!(SG && SG.pass && SG.exp > Date.now()); }
  function siRelay() { return String(siCfg().relay || "").replace(/\/$/, ""); }
  function sgApi(path, raw, pass) {
    if (typeof fetch !== "function") return Promise.reject(new Error("This browser cannot open guest passes"));
    return fetch(siRelay() + path, { headers: { Authorization: "Guest " + (pass || SG.pass) }, cache: "no-store" }).then(function (r) {
      if (r.status === 401 && !pass) { SG = null; sgSave(); siBadge(); }
      if (!r.ok) return r.json().catch(function () { return {}; }).then(function (j) { var e = new Error(j.error || "HTTP " + r.status); e.status = r.status; e.code = j.code; if (j.code === "revoked" && !pass) sgRevoked(); throw e; });
      return raw ? r.text() : r.json();
    });
  }
  /* A revoked pass: tell the guest in a small window, then return them to the signed-out profile */
  function sgRevoked() {
    if ($("#hpModal.revoked")) return;
    SG = null; sgSave(); siBadge();
    var m = hpModal({ kicker: "Hound ID · Guest pass", title: "Your guest pass has been revoked", tone: "danger",
      html: "<p>The owner has ended this guest pass. Restricted documents are closed to you now.</p><p class=\"hm-note\">If you think this is a mistake, ask the person who sent you the link.</p>", actions: [{ label: "OK", primary: true, value: true }] });
    m.el.classList.add("revoked");
    m.result.then(function () { if (currentView === "profile" || currentView === "docs") route(); });
  }
  /* While a guest pass is open, check it now and then, so a revoked pass closes within a minute */
  setInterval(function () { if (sgIn() && !document.hidden) sgApi("/guest/check").catch(function () { /* handled in sgApi */ }); }, 60 * 1000);
  document.addEventListener("visibilitychange", function () { if (!document.hidden && sgIn()) sgApi("/guest/check").catch(function () { /* handled in sgApi */ }); });
  /* LV7 holders (the owner, and any organization owner GitHub confirms) manage guest passes; the relay checks again */
  function siOwner() { if (!siIn()) return false; if (String(SI.user.id) === String(siCfg().owner || "")) return true; var c = siCard(); return !!(c && c.card === "LV7"); }
  /* Reads one restricted file, with the person's own sign-in or, for a guest, through the relay */
  function siRead(repo, path) {
    if (siIn()) return siApi("/repos/" + repo + "/contents/" + path.split("/").map(encodeURIComponent).join("/"), true);
    if (sgIn() && repo === (siCfg().guestRepo || "Hound-Protocol/hp-staff")) return sgApi("/guest/file?path=" + encodeURIComponent(path), true);
    var e = new Error("No access"); e.status = 403; return Promise.reject(e);
  }
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
    /* GitHub cannot be shown inside another page, so it opens in the smallest window its sign-in fits in, centered over this one.
       Browsers do not allow a window to be hidden or minimized; once authorized, GitHub answers at once and the window closes by itself. */
    var W = 400, H = 540, L = Math.round((window.screenX || window.screenLeft || 0) + ((window.outerWidth || screen.width) - W) / 2), T = Math.round((window.screenY || window.screenTop || 0) + ((window.outerHeight || screen.height) - H) / 2);
    var w = window.open(relay + "/login", "hpsignin", "width=" + W + ",height=" + H + ",left=" + L + ",top=" + T + ",menubar=no,toolbar=no,location=no,status=no,scrollbars=yes");
    if (!w) return Promise.reject(new Error("Allow pop-ups for this site to sign in."));
    return new Promise(function (ok, fail) {
      var done = false, t;
      function on(e) {
        if (e.origin !== origin || !e.data || !e.data.houndSignin) return;
        done = true; clearInterval(t); window.removeEventListener("message", on);
        var m = e.data.houndSignin;
        if (m.error || !m.token) { var er = new Error(m.error || "Sign-in failed."); er.code = m.code; fail(er); return; }
        /* A sign-in lasts at most 24 hours at every level (less if GitHub's token expires sooner); then sign in again */
        var cap = Date.now() + 24 * 3600 * 1000;
        SI = { token: m.token, exp: m.expires_in ? Math.min(cap, Date.now() + m.expires_in * 1000) : cap };
        siApi("/user").then(function (u) {
          SI.user = { id: u.id, login: u.login, name: u.name || "", avatar: u.avatar_url };
          siSave(); lsv("hp.verified", "1"); siBadge(); siOrg(); siFresh = Date.now(); ok(SI.user);
        }, function () { SI = null; siSave(); fail(new Error("Could not read your GitHub account.")); });
      }
      window.addEventListener("message", on);
      t = setInterval(function () { if (w.closed && !done) { clearInterval(t); window.removeEventListener("message", on); fail(new Error("The sign-in window was closed.")); } }, 500);
    });
  }
  var siFresh = 0;
  /* The sign-in window: explains the three steps, opens GitHub, waits, and reports back in the site's own design */
  function siStart(o) {
    o = o || {};
    var m = hpModal({ kicker: "Hound ID · Sign in", title: "Sign in with GitHub",
      html: '<ol class="hm-steps"><li><b>GitHub opens</b> in a small window in the middle of your screen.</li><li><b>Authorize Hound ID Sign-in</b> the first time. It can only read what your GitHub teams already allow.</li><li><b>Your keycard</b> appears here, at your clearance.</li></ol><p class="hm-note">We never see your password, and nothing about you is stored on a server.</p>',
      actions: [{ label: "Cancel", value: null }, { label: "Continue with GitHub", primary: true, run: go }] });
    function go() {
      m.body('<div class="hm-wait"><span class="spin"></span><b>Waiting for GitHub…</b><small>Finish signing in in the GitHub window. If nothing opened, allow pop-ups for this site.</small></div>');
      m.actions([{ label: "Cancel", value: null }]);
      signIn().then(function () {
        status("Signed in"); blip("go");
        m.body('<div class="hm-ok"><b>Access granted</b><small>Opening your keycard…</small></div>'); m.actions([]);
        setTimeout(function () { m.close(true); if (o.stay || currentView === "profile") route(); else location.hash = "#/profile"; }, opts.motion ? 700 : 0);
      }, function (e) {
        if (e.code === "banned") {
          m.el.querySelector(".hm-win").classList.add("hm-danger");
          m.body('<div class="hm-lv0"><span>LV0</span><b>Access revoked</b><small>This GitHub account is banned from Hound Protocol. It cannot sign in, take contracts or join sessions, on any linked account.</small><small>Appeals: <a href="#/guides/hp-sop-011">HP-SOP-011</a>.</small></div>');
          m.actions([{ label: "Close", value: null }]);
          return;
        }
        m.body('<div class="hm-err"><b>Not signed in</b><small>' + esc(e.message) + "</small></div>");
        m.actions([{ label: "Close", value: null }, { label: "Try again", primary: true, run: go }]);
      });
    }
    return m.result;
  }
  function signOut() { SI = null; siSave(); siBadge(); }
  /* Organization owners hold LV7, as GitHub itself reports it (ADR 0011: keycards come from the organization). This needs
     the sign-in app's read-only "Members" permission; without it the check fails quietly and nothing changes. */
  function siOrg() {
    if (!siIn() || (SI.org && SI.org.at > Date.now() - 10 * 60 * 1000)) return;
    var org = siCfg().org || "Hound-Protocol";
    SI.org = { at: Date.now(), role: "" };
    siApi("/user/memberships/orgs/" + encodeURIComponent(org)).then(function (m) {
      SI.org = { at: Date.now(), role: m && m.state === "active" ? m.role : "" }; siSave(); siBadge();
      if (SI.org.role === "admin" && (currentView === "profile" || currentView === "docs")) route();
    }, function () { /* no Members permission yet, or not a member */ });
  }
  /* The person's card: their active staff card, or a member card (LV2) */
  function siCard() {
    if (!siIn()) return sgIn() ? { id: "GUEST", login: "guest", name: "Guest", github_id: 0, avatar: "", card: "LV3", department: "Guest", since: "", status: "active", guest: true, exp: SG.exp } : null;
    var staff = (data.staff && data.staff.staff) || [];
    var s = staff.filter(function (x) { return x.github_id === SI.user.id && x.status === "active"; })[0];
    /* A staff card counts only once its signature checks out against the published records key, so an edited
       staff.json can never raise anyone's clearance. Until then (or if it fails) the holder is a member. */
    if (!s && SI.org && SI.org.role === "admin")
      return { id: "OWNER", login: SI.user.login, name: SI.user.name, github_id: SI.user.id, avatar: SI.user.avatar, card: "LV7", department: "Administration", since: "", status: "active", owner: true };
    if (s) {
      var v = siV[s.id];
      if (!v) siVerify(s);
      else if (v === "ok" || v === "unsupported") return Object.assign({}, s, { avatar: SI.user.avatar, name: s.name || SI.user.name, unchecked: v === "unsupported" });
    }
    return { id: "MEMBER", login: SI.user.login, name: SI.user.name, github_id: SI.user.id, avatar: SI.user.avatar, card: "LV2", department: "Member", since: "", status: "active", member: true };
  }
  var siV = {};
  function siVerify(card) {
    siV[card.id] = "wait";
    loadLocal("records-key").then(function (k) { return verifyRecord(card, (k && k.keys) || []); }).then(function (r) {
      siV[card.id] = r; siBadge();
      if (r === "ok" || r === "unsupported") { if (currentView === "profile" || currentView === "docs") route(); }
    });
  }
  function siLevel() { var c = siCard(); return c ? +String(c.card).slice(2) : 1; }
  /* The badge in the top bar: "Sign in", or the person's level and name */
  function siBadge() {
    if (!siOn()) { var t = $("#tbId"); if (t) t.remove(); return; }
    if (!tbMount()) return;
    var b = $("#siBadge"), c = siCard();
    if (c) msgLevel();
    /* A small access credential: level colour edge, picture, name over "Access Credential · level", the level number */
    var lv = c ? KC_LV[c.card] || KC_LV.LV2 : null, ph = c && !c.guest ? kcPhoto(c) : "";
    b.style.setProperty("--hk", lv ? lv[1] : "var(--jo)");
    b.innerHTML = c
      ? '<span class="sb-pic">' + (ph ? '<img src="' + esc(ph) + '" alt="" referrerpolicy="no-referrer" onerror="this.remove()">' : "") + "</span>" +
        '<span class="sb-txt"><b>' + esc(c.guest ? "Guest pass" : c.name || c.login) + "</b><small>Access Credential · " + esc(lv[0]) + "</small></span>" +
        '<span class="sb-lv"><small>LV</small>' + esc(String(c.card).slice(2)) + "</span>"
      : '<span class="sb-pic id">ID</span><span class="sb-txt"><b>Visitor</b><small>Temporary pass · Restricted</small></span><span class="sb-lv"><small>LV</small>1</span>';
    if (!c) b.style.setProperty("--hk", KC_LV.LV1[1]);
    $("#tbId").style.setProperty("--hk", c ? (KC_LV[c.card] || KC_LV.LV2)[1] : KC_LV.LV1[1]);
    b.classList.toggle("guest", !!(c && c.guest));
    b.classList.toggle("in", !!c);
    b.setAttribute("aria-label", c ? "Access credential " + c.card + ", " + (c.guest ? "guest pass" : c.name || c.login) : "Access credential LV1, visitor");
  }

  /* ---- Restricted document areas: one private repository per clearance ---- */
  var siTrees = {};
  function siArea(a) {
    if (!siIn()) {
      if (!sgIn() || a.repo !== (siCfg().guestRepo || "Hound-Protocol/hp-staff")) { var e = new Error("No access"); e.status = 403; return Promise.reject(e); }
      var gk = "guest:" + a.repo;
      return siTrees[gk] || (siTrees[gk] = sgApi("/guest/tree").then(function (j) { return j.paths || []; }, function (er) { delete siTrees[gk]; throw er; }));
    }
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
    Promise.all([loadLocal("staff"), loadLocal("records"), loadLocal("records-key"), loadLocal("contracts"), loadLocal("certificates")]).then(function (res) {
      if (currentView !== "profile") return;
      var keys = (res[2] && res[2].keys) || [];
      if (!siIn() && !sgIn()) return drawSignedOut();
      var c = siCard(), lvl = siLevel(), areas = siCfg().areas || [];
      $("#vb").innerHTML =
        '<div class="kc-profile">' + keycard(c, { big: true }) +
        '<div class="kc-side">' + (c.guest ? '<dl class="kc-facts"><div><dt>Pass</dt><dd>Guest pass with <b>LV3</b> (Staff) clearance, granted by the owner.</dd></div>' +
          "<div><dt>Expires</dt><dd>" + esc(fmtDate(new Date(c.exp).toISOString().slice(0, 10))) + " at " + esc(new Date(c.exp).toTimeString().slice(0, 5)) + " · " + esc(sgLeft(c.exp)) + " left. It cannot be extended.</dd></div>" +
          "<div><dt>Session</dt><dd>This tab only. Nothing is stored on a server.</dd></div>" +
          '</dl><button type="button" class="si-out" id="siOut"><i aria-hidden="true"></i><span>End pass<small>End guest clearance</small></span></button></div></div>' :
        '<dl class="kc-facts"><div><dt>GitHub</dt><dd><a href="https://github.com/' + encodeURIComponent(c.login) + '" target="_blank" rel="noopener noreferrer">' + esc(c.login) + "</a> · account #" + esc(c.github_id) + "</dd></div>" +
          "<div><dt>Card</dt><dd>" + (c.owner ? "Owner card: GitHub confirms you own the Hound-Protocol organization." : c.member ? 'Member card. Staff cards are issued by Administration (<a href="#/guides/hp-gde-009">how</a>).' : '<a href="#/verify/' + esc(c.id) + '">Signed staff card ' + esc(c.id) + "</a>") + "</dd></div>" +
          "<div><dt>Session</dt><dd>Signed in until " + esc(new Date(SI.exp).toTimeString().slice(0, 5)) + " in this tab (at most 24 hours)</dd></div>" +
          '</dl><button type="button" class="si-out" id="siOut"><i aria-hidden="true"></i><span>Sign out<small>Sign out of clearance</small></span></button></div></div>') +
        siCerts(c) +
        (siOwner() ? sgPanel() : "") +
        siAccess(lvl, areas) +
        "";
      $("#siOut").addEventListener("click", function () {
        (c.guest ? hpConfirm("End your guest pass?", "You will need the link again to come back, while it is still valid.", "End guest pass", "Stay", "danger")
          : hpConfirm("Are you sure you want to log out?", "Your Hound ID session in this tab ends. You can sign in again at any time.", "Log out", "Stay signed in", "danger")).then(function (yes) {
          if (!yes) return;
          if (c.guest) { SG = null; sgSave(); siBadge(); status("Guest pass ended"); } else { signOut(); status("Signed out"); }
          viewProfile();
        });
      });
      if (siOwner()) sgPanelWire();
      /* Right after signing in (the owner check may redraw the card once, so allow a few seconds) */
      if (siFresh && Date.now() - siFresh < 5000) kcReveal($(".kc-profile .hk")); else siFresh = 0;
      if (keys.length && !c.member && !c.guest && !c.owner) markVerified([c], keys);
      else $$('.kc-profile [data-rid] .vs').forEach(function (el) { el.innerHTML = c.owner ? '<span class="status done">Confirmed by GitHub</span>' : c.guest ? '<span class="status planned">Guest · until ' + esc(new Date(c.exp).toTimeString().slice(0, 5)) + "</span>" : '<span class="status claimed">Signed in</span>'; });
    });
  }
  /* Access granted and access restricted: every level's rights from ADR 0011 (config.signin.access), split at the
     holder's clearance. Restricted document areas show their files inside the level that opens them. */
  function siAccess(lvl, areas) {
    var levels = siCfg().access || [], got = [], not = [];
    levels.forEach(function (L) { (+String(L.card).slice(2) <= lvl ? got : not).push(L); });
    function item(it, open) {
      if (it.area != null) {
        var a = areas[it.area]; if (!a) return "";
        /* Information only: the documents themselves open from the Library */
        return '<li class="ax-doc"><span class="ax-t">' + esc(a.title) + " documents</span></li>";
      }
      return '<li><span class="ax-t">' + esc(it.t) + "</span>" + (it.s ? '<em class="ax-s">' + esc(it.s) + "</em>" : "") + "</li>";
    }
    function group(L, open, n) {
      var lv = KC_LV[L.card] || KC_LV.LV2;
      return '<section class="ax-lv" style="--hk:' + lv[1] + "; --n:" + n + '"><header><i>' + esc(L.card) + "</i><b>" + esc(lv[0]) + "</b>" +
        (open ? "" : "<small>Needs " + esc(L.card) + "</small>") + "</header><ul>" + L.items.map(function (it) { return item(it, open); }).join("") + "</ul></section>";
    }
    var next = not[0];
    return '<div class="ax">' +
      '<div class="ax-col ax-ok"><div class="ax-head"><span class="ax-ico" aria-hidden="true"></span><b>Access granted</b><small>Level ' + lvl + " clearance · " + plural(got.reduce(function (n, L) { return n + L.items.length; }, 0), "right") + "</small></div>" +
        got.slice().reverse().map(function (L, n) { return group(L, true, n); }).join("") + "</div>" +
      '<div class="ax-col ax-no"><div class="ax-head"><span class="ax-ico" aria-hidden="true"></span><b>Access restricted</b><small>' + (not.length ? "Opens with a higher card" : "Nothing: you hold the highest card") + "</small></div>" +
        (not.length ? not.map(function (L, n) { return group(L, false, n); }).join("") : '<p class="sub">Every level is open to you.</p>') +
        (next ? '<p class="ax-how">' + (lvl < 3 ? "A completed contract earns <b>LV3</b>; higher cards come with a department. " : "Higher cards come with a department role. ") + 'How cards are issued: <a href="#/guides/hp-gde-009">Grades, Records and Hound IDs</a>. Not sure where you fit? <a href="#/guides/hp-gde-017">Can I Contribute?</a></p>' : "") + "</div>" +
      "</div>" +
      '<p class="sub ax-note">GitHub decides what you can read in the restricted areas, through your teams; your card shows what your clearance should open. Restricted documents open from the <a href="#/docs">Library</a>. Items marked with a date or <em>Planned</em> arrive with the session browser and the API server (<a href="#/docs/adr-0011">ADR 0011</a>).</p>';
  }
  /* The holder's certificates of service, if any */
  function siCerts(c) {
    var mine = ((data.certificates && data.certificates.certificates) || []).filter(function (x) { return !c.guest && x.github_id === c.github_id; });
    if (!mine.length) return "";
    return '<section class="si-certs"><div class="label">Your certificates</div><div class="cert-list">' + mine.slice().reverse().map(function (x, n) {
      return '<a class="cert-card' + (x.status === "revoked" ? " revoked" : "") + '" style="--i:' + n + "; --hk:" + (KC_LV[x.clearance] || KC_LV.LV3)[1] + '" href="#/verify/' + esc(x.id) + '"><small>' + esc(x.id) + " · " + esc(fmtDate(x.issued)) + "</small><b>Certificate of Service</b><span>" + plural(x.records.length, "contract") + " · grade " + esc(x.grade || "–") + "</span></a>";
    }).join("") + "</div></section>";
  }
  function sgLeft(exp) { var m = Math.max(0, Math.round((exp - Date.now()) / 60000)); return m >= 60 ? Math.floor(m / 60) + " h " + (m % 60) + " min" : m + " min"; }
  /* The owner's guest pass desk: grant a 24-hour LV3 pass and copy its link. The relay checks that the request comes
     from the owner's own GitHub account; this panel only shows for the owner. */
  var SG_ISSUED = "hp.guest.issued";
  function sgIssued() { try { return (JSON.parse(sessionStorage.getItem(SG_ISSUED) || "[]") || []).filter(function (x) { return x.exp > Date.now(); }); } catch (e) { return []; } }
  function sgLink(pass) { return (cfg.siteUrl || "https://hound-protocol.github.io/Joint-Operations/") + "#/g/" + pass; }
  function sgNum(pass) { var p = String(pass).split("."); if (p.length === 3) return p[1]; try { return JSON.parse(atob(p[0].replace(/-/g, "+").replace(/_/g, "/"))).n; } catch (e) { return ""; } }
  /* The pass window: opens at once when a pass is granted (or its link asked for), with the whole link to copy */
  function sgShow(m, pass, exp) {
    var u = sgLink(pass);
    m.body('<p class="gp-lead">This guest pass has <b>LV3</b> clearance and a <b>24-hour</b> duration. You may revoke it at your discretion.</p>' +
      '<div class="gp-link"><textarea id="gpUrl" readonly rows="2" spellcheck="false" aria-label="Guest pass link">' + esc(u) + '</textarea><button type="button" class="btn small primary" id="gpCopy">Copy</button></div>' +
      '<p class="hm-note">Pass ' + esc(sgNum(pass)) + " · expires " + esc(fmtDate(new Date(exp).toISOString().slice(0, 10))) + " at " + esc(new Date(exp).toTimeString().slice(0, 5)) + ". Send it privately: anyone with this link has LV3 until it expires or you revoke it.</p>");
    m.actions([{ label: "Done", primary: true, value: true }]);
    var inp = $("#gpUrl"), cb = $("#gpCopy");
    inp.addEventListener("focus", function () { inp.select(); });
    cb.addEventListener("click", function () {
      function done() { cb.textContent = "Copied"; status("Guest link copied"); blip("go"); }
      function fallback() { inp.focus(); inp.select(); var okc = false; try { okc = document.execCommand("copy"); } catch (e) { okc = false; } if (okc) done(); else cb.textContent = "Press Ctrl+C"; }
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(u).then(done, fallback); else fallback();
    });
    setTimeout(function () { inp.focus(); inp.select(); }, 60);
  }
  function sgPanel() {
    return '<section class="gp"><header><span class="gp-ico" aria-hidden="true"></span><div><b>Guest passes</b><small>LV7 only · LV3 (Staff) access for 24 hours to whoever has the link. A pass cannot be extended.</small></div>' +
      '<button class="btn primary" id="gpGrant">Grant Guest Pass</button></header><p class="sub" id="gpMsg" aria-live="polite"></p>' +
      '<div class="gp-cols"><div class="gp-col"><div class="gp-ch"><b>Passes</b><button class="btn small danger" id="gpAll" type="button">Clear all</button></div><ul class="gp-list" id="gpList">' + sgIssued().map(sgItem).join("") + '</ul></div>' +
      '<div class="gp-col"><div class="gp-ch"><b>Requests</b><small>Visitors ask with their name</small></div><ul class="gp-list gp-asks" id="gpAsks"><li class="none"><span>Loading…</span></li></ul></div></div></section>';
  }
  function sgItem(x) {
    return '<li><code>' + esc(x.pass.slice(0, 10)) + '…</code><span>Expires ' + esc(new Date(x.exp).toTimeString().slice(0, 5)) + " · " + esc(sgLeft(x.exp)) + ' left</span><button class="btn small" data-gp="' + esc(x.pass) + '">Copy link</button></li>';
  }
  function sgOwnerApi(path, method) {
    return fetch(siRelay() + path, { method: method || "GET", headers: { Authorization: "Bearer " + SI.token }, cache: "no-store" }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) { var e = new Error(j.error || "HTTP " + r.status); e.code = j.code; throw e; } return j; });
    });
  }
  /* The live passes, from the relay: number, expiry, status, and Revoke */
  function sgLoad() {
    var ul = $("#gpList"); if (!ul) return;
    sgOwnerApi("/guest/list").then(function (j) {
      var local = {}; sgIssued().forEach(function (x) { var n = sgNum(x.pass); if (n) local[n] = x.pass; });
      var ps = j.passes || [], live = ps.filter(function (x) { return !x.expired && !x.revoked; }), old = ps.filter(function (x) { return x.expired || x.revoked; });
      function row(x) {
        var stc = x.revoked ? "rv" : x.expired ? "ex" : "ok", stl = x.revoked ? "Revoked" : x.expired ? "Expired" : "Active";
        return '<li class="' + stc + '"><span class="gp-st">' + stl + '</span><code>Pass ' + esc(x.n) + "</code><span>" +
          (x.expired ? "Ended " + esc(fmtDate(new Date(x.exp).toISOString().slice(0, 10))) + " " + esc(new Date(x.exp).toTimeString().slice(0, 5)) : x.revoked ? "Closed early · would have run until " + esc(new Date(x.exp).toTimeString().slice(0, 5)) : "Expires " + esc(new Date(x.exp).toTimeString().slice(0, 5)) + " · " + esc(sgLeft(x.exp)) + " left") +
          (x.for ? " · for <b>" + esc(x.for) + "</b>" : "") + (x.by ? " · by " + esc(x.by) : "") + "</span>" +
          (local[x.n] && stc === "ok" ? '<button class="btn small" data-gp="' + esc(local[x.n]) + '" data-exp="' + esc(x.exp) + '">Copy link</button>' : "") +
          (stc === "ok" ? '<button class="btn small danger" data-rv="' + esc(x.n) + '">Revoke</button>' : "") + '<button class="btn small" data-del="' + esc(x.n) + '" data-live="' + (stc === "ok" ? 1 : 0) + '">Clear</button></li>';
      }
      ul.innerHTML = '<li class="gp-h"><b>Active</b><span>' + live.length + "</span></li>" + (live.map(row).join("") || '<li class="none"><span>No live guest passes.</span></li>') +
        (old.length ? '<li class="gp-h"><b>Expired and revoked</b><span>' + old.length + ' · records are kept ' + (j.keepDays || 30) + ' days</span><button class="btn small" id="gpPurge">Clear expired</button></li>' + old.map(row).join("") : "");
      sgWireList();
    }, function (e) {
      if (e.code === "no_kv") { $("#gpMsg").textContent = "Passes can be granted. To revoke them instantly, add the GUEST_KV storage to the relay (sign-in setup, section 6)."; ul.innerHTML = sgIssued().map(sgItem).join(""); sgWireList(); }
      else $("#gpMsg").textContent = e instanceof TypeError ? "Could not reach the sign-in relay." : e.message;
    });
  }
  function sgWireList() {
    $$("[data-del]").forEach(function (b) {
      b.onclick = function () {
        var n = b.getAttribute("data-del"), live = b.getAttribute("data-live") === "1";
        (live ? hpConfirm("Clear guest pass " + n + "?", "It is revoked at once and removed from the list. Whoever holds the link loses access.", "Clear pass", "Keep it", "danger") : Promise.resolve(true)).then(function (y) {
          if (!y) return; b.disabled = true;
          sgOwnerApi("/guest/delete?n=" + encodeURIComponent(n), "POST").then(function () { status("Guest pass cleared"); sgLoad(); }, function (e) { b.disabled = false; $("#gpMsg").textContent = e.message; });
        });
      };
    });
    var pg = $("#gpPurge");
    if (pg) pg.onclick = function () {
      hpConfirm("Clear every expired pass?", "Their records disappear from this list. Live passes are not touched.", "Clear expired", "Cancel", "danger").then(function (y) {
        if (!y) return; pg.disabled = true;
        sgOwnerApi("/guest/purge", "POST").then(function (j) { status(plural(j.deleted || 0, "expired pass") + " deleted"); sgLoad(); }, function (e) { pg.disabled = false; $("#gpMsg").textContent = e.message; });
      });
    };
    $$("[data-gp]").forEach(function (b) { b.onclick = function () { var m = hpModal({ kicker: "Hound ID · Guest pass", title: "You have been issued a temporary guest pass", html: "", actions: [] }); sgShow(m, b.getAttribute("data-gp"), +b.getAttribute("data-exp") || Date.now()); }; });
    $$("[data-rv]").forEach(function (b) {
      b.onclick = function () {
        var n = b.getAttribute("data-rv");
        hpConfirm("Revoke guest pass " + n + "?", "Whoever holds this link loses access at once. This cannot be undone.", "Revoke pass", "Keep it", "danger").then(function (yes) {
          if (!yes) return;
          b.disabled = true;
          sgOwnerApi("/guest/revoke?n=" + encodeURIComponent(n), "POST").then(function () { status("Guest pass revoked"); blip("go"); sgLoad(); }, function (e) { b.disabled = false; $("#gpMsg").textContent = e.message; });
        });
      };
    });
  }
  function sgPanelWire() {
    sgLoad();
    var g = $("#gpGrant"); if (!g) return;
    g.addEventListener("click", function () {
      g.disabled = true;
      var m = hpModal({ kicker: "Hound ID · Guest pass", title: "You have been issued a temporary guest pass", html: '<div class="hm-wait"><span class="spin"></span><b>Issuing a guest pass…</b></div>', actions: [] });
      fetch(siRelay() + "/guest/grant", { method: "POST", headers: { Authorization: "Bearer " + SI.token }, cache: "no-store" }).then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || "HTTP " + r.status); return j; }); }).then(function (j) {
        var list = sgIssued(); list.unshift({ pass: j.pass, exp: j.exp });
        try { sessionStorage.setItem(SG_ISSUED, JSON.stringify(list.slice(0, 10))); } catch (e) { /* this page only */ }
        sgShow(m, j.pass, j.exp); sgLoad(); blip("go");
      }, function (e) {
        m.body('<div class="hm-err"><b>No pass issued</b><small>' + esc(e instanceof TypeError ? "Could not reach the sign-in relay. Check that it runs the current code (sign-in setup, section 6)." : e.message) + "</small></div>");
        m.actions([{ label: "Close", value: null }]);
      }).then(function () { setTimeout(function () { g.disabled = false; }, 1500); });
    });
    var all = $("#gpAll");
    if (all) all.addEventListener("click", function () {
      hpConfirm("Clear every guest pass?", "Every live pass is revoked at once, and every pass is removed from the list. Requests are not touched.", "Clear all", "Cancel", "danger").then(function (y) {
        if (!y) return; all.disabled = true;
        sgOwnerApi("/guest/purge?all=1", "POST").then(function (j) { try { sessionStorage.removeItem(SG_ISSUED); } catch (e) { /* this page only */ } status(plural(j.deleted || 0, "guest pass") + " cleared"); sgLoad(); }, function (e) { $("#gpMsg").textContent = e.message; }).then(function () { all.disabled = false; });
      });
    });
    sgAsks();
  }
  /* Requests from visitors: approve (a pass is made for that name and opens in their browser by itself) or decline */
  function sgAsks() {
    var ul = $("#gpAsks"); if (!ul) return;
    sgOwnerApi("/guest/asks").then(function (j) {
      var a = j.asks || [], open = a.filter(function (x) { return x.state === "pending"; }), done = a.filter(function (x) { return x.state !== "pending"; });
      function t(x) { return esc(new Date(x.at).toTimeString().slice(0, 5)) + " · " + esc(msgAgo(x.at)); }
      ul.innerHTML = '<li class="gp-h"><b>Waiting</b><span>' + open.length + "</span></li>" +
        (open.map(function (x) { return '<li class="ok"><span class="gp-st">New</span><span class="gp-who"><b>' + esc(x.name) + "</b><small>Asked " + t(x) + '</small></span><button class="btn small primary" data-ok="' + esc(x.id) + '">Approve</button><button class="btn small" data-no="' + esc(x.id) + '">Decline</button></li>'; }).join("") || '<li class="none"><span>No requests waiting.</span></li>') +
        (done.length ? '<li class="gp-h"><b>Answered</b><span>' + done.length + " · kept 2 days</span></li>" + done.map(function (x) { return '<li class="' + (x.state === "approved" ? "ex" : "rv") + '"><span class="gp-st">' + (x.state === "approved" ? "Approved" : "Declined") + '</span><span class="gp-who"><b>' + esc(x.name) + "</b><small>" + t(x) + (x.by ? " · by " + esc(x.by) : "") + (x.n ? " · pass " + esc(x.n) : "") + "</small></span></li>"; }).join("") : "");
      $$("[data-ok],[data-no]", ul).forEach(function (b) {
        b.onclick = function () {
          var ok = b.hasAttribute("data-ok"), id = b.getAttribute(ok ? "data-ok" : "data-no");
          $$("button", b.parentNode).forEach(function (x) { x.disabled = true; });
          sgOwnerApi("/guest/" + (ok ? "approve" : "decline") + "?id=" + encodeURIComponent(id), "POST").then(function () {
            $("#gpMsg").textContent = ok ? "Approved. The pass opens in their browser by itself (it checks every 20 seconds)." : "Declined. They are told on their side.";
            status(ok ? "Guest pass approved" : "Request declined"); blip("go"); sgLoad(); sgAsks();
          }, function (e) { $("#gpMsg").textContent = e.message; $$("button", b.parentNode).forEach(function (x) { x.disabled = false; }); });
        };
      });
    }, function (e) { ul.innerHTML = '<li class="none"><span>' + esc(e.code === "no_kv" ? "Requests need the KV storage on the relay (sign-in setup, section 6)." : e instanceof TypeError ? "Could not reach the sign-in relay." : /Unknown request|not valid/.test(e.message) ? "The relay needs its update for requests (sign-in setup, section 6)." : e.message) + "</span></li>"; });
  }
  /* #/guest/PASS: check the pass with the relay, keep it in this tab, then open the profile */
  function viewGuest(pass) {
    var v = $("#view");
    v.innerHTML = shell("Hound ID", "Guest pass", loading("Checking your guest pass"));
    if (!pass || !siOn()) { $("#vb").innerHTML = '<div class="empty">No guest pass in this link</div>'; return; }
    sgApi("/guest/check", false, pass).then(function (j) {
      SG = { pass: pass, exp: j.exp }; sgSave(); siBadge(); siFresh = Date.now(); status("Guest pass accepted"); blip("go");
      location.replace("#/profile");
    }, function (e) {
      if (currentView !== "guest") return;
      $("#vb").innerHTML = '<div class="ad gp-bad"><div class="ad-box"><small>Security</small><strong>Access denied</strong><em>' + esc(e.status === 401 ? "This guest pass is not valid or has expired." : e.message) + "</em><p>Ask the person who sent it for a new one, or contact Administration.</p>" +
        '<div class="ad-act"><a class="btn small" href="#/briefing">About Joint Operations</a><a class="btn small" href="#/guides/hp-gde-015">Using the website</a></div></div></div>';
    });
  }
  function siOpen(a, path) {
    var d = $("#siDoc"); if (!d) return;
    d.hidden = false; d.className = "dossier si-reader k-project"; d.innerHTML = loading("Opening " + path);
    siRead(a.repo, path).then(function (md) {
      d.style.setProperty("--g", (KC_LV[a.card] || KC_LV.LV3)[1]); d.style.setProperty("--gd", "#4d5a60");
      d.innerHTML = '<div class="ds-tab"><b>' + esc(a.card) + "</b>" + esc(a.title) + '</div><div class="ds-folder"><div class="ds-page">' +
        '<header class="ds-head"><span><img src="assets/brand/hound-protocol-mark-light.svg" alt="" width="20" height="20">Hound Protocol</span><span class="ds-class">Restricted · ' + esc(a.card) + "</span></header>" +
        '<h1 class="ds-title">' + esc(siTitle(path)) + '</h1><div class="ds-meta"><span>' + esc(a.repo) + " · " + esc(path) + '</span><a href="https://github.com/' + esc(a.repo) + "/blob/HEAD/" + esc(path) + '" target="_blank" rel="noopener noreferrer">GitHub</a></div>' +
        '<div class="sh-body ds-body">' + markdown(md.replace(/^# .*\n/, ""), path) + '</div><footer class="ds-foot"><span>Restricted to ' + esc(a.card) + " and up. Do not copy it to public places.</span></footer></div></div>";
      d.classList.remove("in"); void d.offsetWidth; d.classList.add("in");
      if (d.scrollIntoView) d.scrollIntoView({ behavior: opts.motion ? "smooth" : "auto", block: "start" });
    }, function () { d.innerHTML = '<div class="empty">Could not open this document</div>'; });
  }
  /* For visitors: every card lined up, with one line on how clearance works */
  var SI_LV_INFO = {
    LV0: "Banned: refused at sign-in, on every linked account.", LV1: "Everyone at first: About, Roadmap, Team, Docs and Options.", LV2: "Signed in with GitHub: your profile and keycard.", LV3: "Contractors: Staff documents, claiming contracts.",
    LV4: "Quality: reviews and testing.", LV5: "Development: Leads documents, site and contract data.", LV6: "Administration: moderation, Administration documents.", LV7: "The owner: everything."
  };
  function siLevelsIntro() {
    var lv = ["LV0", "LV1", "LV2", "LV3", "LV4", "LV5", "LV6", "LV7"];
    return '<section class="si-levels"><div class="label">Clearance levels</div>' +
      '<ol class="si-how"><li><b>Sign in with GitHub</b> and you hold a member card, <b>LV2</b>.</li><li><b>Higher cards are earned:</b> a completed contract brings LV3; LV4 to LV6 come with a department. Each staff card is signed, so it cannot be faked.</li>' +
      '<li><b>GitHub guards the doors:</b> restricted documents live in private repositories that open at their level. A <b>guest pass</b> opens LV3 for 24 hours; banned accounts are <b>LV0</b>.</li></ol>' +
      '<div class="si-lvrow">' + lv.map(function (l, k) {
        var n = +l.slice(2), spec = { id: n > 2 ? "HND-000" + n : ["REVOKED", "VISITOR", "MEMBER"][n], login: "agent", name: "Agent", github_id: 0, card: l, department: (KC_LV[l] || [""])[0], since: "", status: n === 0 ? "revoked" : "active" };
        return '<figure style="--k:' + k + '">' + keycard(spec, { specimen: true }) + "<figcaption><b>" + esc(l) + " · " + esc((KC_LV[l] || [""])[0]) + "</b>" + esc(SI_LV_INFO[l]) + "</figcaption></figure>";
      }).join("") + "</div>" +
      '<p class="sub">Full details: <a href="#/guides/hp-gde-009">Grades, Records and Hound IDs</a> · <a href="#/docs/adr-0011">ADR 0011</a></p></section>';
  }
  function drawSignedOut() {
    var on = siOn();
    $("#vb").innerHTML =
      '<div class="kc-profile">' + keycard(KC_SPECIMEN, { big: true, specimen: true }) +
      '<div class="si-intro"><h3>Sign in with your Hound ID</h3>' +
        "<p>Sign in with GitHub to see your keycard and the documents your clearance opens. Staff get their signed staff card; everyone else gets a member card.</p>" +
        (on ? '<p class="si-lv1"><b>LV1</b> You are on a temporary visitor pass with restricted clearance.</p><div class="toolbar"><button class="btn primary" id="siGo">Sign in with GitHub</button><button class="btn" id="siAsk">Request a guest pass</button></div><p class="sub" id="siMsg">A small GitHub window opens. We never see your password, and nothing is stored on a server. A sign-in lasts at most 24 hours.</p>'
            : '<p class="note">Sign-in is not switched on yet.</p>') +
        '<p class="sub">How it works and what is kept: <a href="#/docs/signin">sign-in</a> · <a href="#/docs/privacy">privacy</a></p></div></div>' + siLevelsIntro();
    var go = $("#siGo");
    if (go) go.addEventListener("click", function () {
      if (go.disabled) return; go.disabled = true; setTimeout(function () { go.disabled = false; }, 4000);
      siStart();
    });
    var ask = $("#siAsk");
    if (ask) ask.addEventListener("click", function () { if (ask.disabled) return; ask.disabled = true; setTimeout(function () { ask.disabled = false; }, 4000); askStart(); });
  }
