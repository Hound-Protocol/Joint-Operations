  /* ---------------- Clearance gate, guest pass requests and messages ----------------
     Everyone who is not signed in holds a temporary LV1 pass. LV1 opens About, Roadmap, Team, Documentation and Options
     (and Profile, to sign in, and Verify, so anyone can check a certificate). Every other section shows a No access window
     over a blurred page, with two ways up: sign in with GitHub (LV2 at once) or ask the owner for a guest pass (LV3, 24 h).
     A visitor sees the welcome window on each visit until this browser has once signed in with GitHub. This is a gate in the
     interface: the public documents themselves stay public on GitHub. */
  var LV1_OPEN = { briefing: 1, roadmap: 1, team: 1, docs: 1, guides: 1, options: 1, profile: 1, verify: 1, guest: 1, g: 1 };
  function lsv(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, String(v)); } catch (e) { /* storage blocked: this visit only */ } return null; }
  function ssv(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, String(v)); } catch (e) { /* this page only */ } return null; }
  function gateNeeded(view) { return siOn() && !EMBED && siLevel() < 2 && !LV1_OPEN[view]; }
  function gateApply(view) {
    var v = $("#view"), vb = $("#vb"), old = $("#gate");
    if (old) old.remove();
    var need = !!(v && vb && gateNeeded(view));
    if (v) v.classList.toggle("gated", need);
    if (vb) { if (need) { vb.setAttribute("inert", ""); vb.setAttribute("aria-hidden", "true"); } else { vb.removeAttribute("inert"); vb.removeAttribute("aria-hidden"); } }
    if (!need) return;
    var a = askGet();
    v.insertAdjacentHTML("beforeend", '<div class="gate" id="gate" role="alertdialog" aria-labelledby="gateT"><div class="gate-win">' +
      '<div class="gate-top"><span class="gate-lv">LV1</span><small>Restricted clearance</small></div>' +
      '<strong id="gateT">No access</strong><p>This section opens at <b>LV2</b>. You are on a temporary LV1 pass.</p>' +
      (a ? '<p class="gate-wait"><span class="spin"></span>Your guest pass request as <b>' + esc(a.name) + "</b> is waiting for the owner. It opens here by itself once approved.</p>" : "") +
      '<div class="gate-act"><button type="button" class="btn primary" data-gate="in">Sign in with GitHub</button><button type="button" class="btn" data-gate="ask">Request a guest pass</button></div>' +
      '<p class="gate-note">Open to LV1: <a href="#/briefing">About</a> · <a href="#/roadmap">Roadmap</a> · <a href="#/team">Team</a> · <a href="#/docs">Documentation</a> · <a href="#/options">Options</a></p></div></div>');
    var g = $("#gate"); g.style.top = vb.offsetTop + "px";
    gateWire(g);
  }
  /* Both buttons rest for a moment after a click, so they cannot be hammered */
  function gateWire(root) {
    $$("[data-gate]", root).forEach(function (b) {
      b.addEventListener("click", function () {
        if (b.disabled) return;
        b.disabled = true; setTimeout(function () { b.disabled = false; }, 4000);
        if (b.getAttribute("data-gate") === "in") siStart({ stay: true }); else askStart();
      });
    });
  }
  /* The welcome window: on each visit, until this browser has signed in with GitHub once */
  function gateWelcome() {
    if (!siOn() || EMBED || siLevel() >= 2 || lsv("hp.verified") || ssv("hp.welcomed") || $("#hpModal")) return;
    ssv("hp.welcomed", "1");
    msgAdd("lv1", "Temporary LV1 pass", "You are on restricted clearance. Sign in with GitHub for LV2, or ask the owner for a guest pass.", "lv1");
    var a = askGet();
    var m = hpModal({ kicker: "Hound ID · Clearance", title: "You are on restricted clearance",
      html: '<div class="gw"><div class="gw-lv"><b>LV1</b><span>Visitor<small>Temporary pass</small></span></div>' +
        "<p>Your access is limited. <b>About, Roadmap, Team, Documentation and Options</b> are open to you; Download, Sessions, Contribute and Mods need a higher clearance.</p>" +
        '<ul class="gw-ways"><li><b>Sign in with GitHub</b><span>LV2 at once: your profile, your keycard and the whole site.</span></li>' +
        "<li><b>Request a guest pass</b><span>For people the owner knows: LV3 for 24 hours, once the owner approves it.</span></li></ul>" +
        (a ? '<p class="hm-note">Your guest pass request as <b>' + esc(a.name) + "</b> is still waiting for the owner.</p>" : "") + "</div>",
      actions: [{ label: "Continue with LV1", value: null }, { label: "Request a guest pass", run: function () { m.close(null); setTimeout(askStart, 240); } }, { label: "Sign in with GitHub", primary: true, run: function () { m.close(null); setTimeout(function () { siStart({ stay: true }); }, 240); } }] });
    m.el.classList.add("hm-blur", "hm-gate");
  }

  /* ---- Guest pass requests (LV1): a name, at most one request a minute; the pass opens here by itself when approved ---- */
  var ASK_KEY = "hp.ask", ASK_LAST = "hp.ask.last";
  function askGet() { try { return JSON.parse(lsv(ASK_KEY) || "null"); } catch (e) { return null; } }
  function askWait() { return Math.max(0, 60 - Math.floor((Date.now() - (+(lsv(ASK_LAST) || 0))) / 1000)); }
  function askStart() {
    if (!siOn()) return;
    if (sgIn()) { status("You already hold a guest pass"); return; }
    var cur = askGet(), timer = 0;
    var m = hpModal({ kicker: "Hound ID · Guest pass", title: "Request a guest pass",
      html: "<p>Guest passes are for people the owner knows. The owner sees your name and approves or declines; an approved pass opens LV3 here for 24 hours, by itself.</p>" +
        (cur ? '<p class="hm-note">You already asked as <b>' + esc(cur.name) + "</b>. A new request replaces it.</p>" : "") +
        '<label class="ga-f"><span>Your name</span><input id="gaName" type="text" maxlength="40" autocomplete="name" spellcheck="false" placeholder="How the owner knows you"></label>' +
        '<p class="ga-msg" id="gaMsg" aria-live="polite"></p>',
      cancel: function () { clearInterval(timer); },
      actions: [{ label: "Cancel", value: null }, { label: "Send request", primary: true, run: send }] });
    var inp = $("#gaName"); if (inp) { inp.focus(); inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); send(); } }); }
    function btn() { return $("#hpModal .hm-act .primary"); }
    function tick() {
      var b = btn(), w = askWait(); if (!b) { clearInterval(timer); return; }
      b.disabled = w > 0; b.textContent = w > 0 ? "Send request (" + w + " s)" : "Send request";
      if (!w) clearInterval(timer);
    }
    if (askWait()) { tick(); timer = setInterval(tick, 1000); }
    function say(t) { var el = $("#gaMsg"); if (el) el.textContent = t; }
    function send() {
      var name = String((inp && inp.value) || "").replace(/\s+/g, " ").trim();
      if (name.length < 2) { say("Write your name, so the owner knows who is asking."); if (inp) inp.focus(); return; }
      if (askWait()) { say("You can ask again in " + askWait() + " s."); return; }
      lsv(ASK_LAST, Date.now()); var b = btn(); if (b) b.disabled = true; say("Sending…");
      fetch(siRelay() + "/guest/ask", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name }), cache: "no-store" }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok || !j.id) { var e = new Error(j.code === "invalid" ? "Guest pass requests are not switched on yet. Try again later." : j.error || "HTTP " + r.status); throw e; } return j; });
      }).then(function (j) {
        lsv(ASK_KEY, JSON.stringify({ id: j.id, key: j.key, name: name, at: Date.now() }));
        msgAdd("ask-" + j.id, "Guest pass requested", "Your request as " + name + " is waiting for the owner. Your pass opens here by itself once approved.", "info");
        m.body('<div class="hm-ok"><b>Request sent</b><small>The owner sees your name, <b>' + esc(name) + "</b>. Keep this page open or come back later: once approved, your guest pass opens here by itself.</small></div>");
        m.actions([{ label: "OK", primary: true, value: true }]);
        gateApply(currentView); blip("go");
      }, function (e) {
        say(e instanceof TypeError ? "Could not reach the sign-in relay. Try again in a minute." : e.message);
        timer = setInterval(tick, 1000); tick();
      });
    }
    return m.result;
  }
  function askCheck() {
    var a = askGet(); if (!a || !siOn() || typeof fetch !== "function") return;
    fetch(siRelay() + "/guest/ask/status?id=" + encodeURIComponent(a.id) + "&key=" + encodeURIComponent(a.key), { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (j) {
      if (j.state === "approved" && j.pass) {
        lsv(ASK_KEY, null); SG = { pass: j.pass, exp: j.exp }; sgSave(); siFresh = Date.now();
        msgAdd("ask-" + a.id + "-ok", "Guest pass approved", "The owner approved your request. You hold LV3 (Staff) clearance in this tab until " + new Date(j.exp).toTimeString().slice(0, 5) + ".", "ok");
        siBadge(); status("Guest pass approved"); blip("go");
        var m = hpModal({ kicker: "Hound ID · Guest pass", title: "You have been issued a temporary guest pass", html: "<p>The owner approved your request. This guest pass has <b>LV3</b> clearance for 24 hours, in this tab. It cannot be extended, and the owner can revoke it at any time.</p>", actions: [{ label: "Stay here", value: null }, { label: "Open my profile", primary: true, value: true }] });
        m.result.then(function (go) { if (go) location.hash = "#/profile"; else route(); });
      } else if (j.state === "declined") {
        lsv(ASK_KEY, null); msgAdd("ask-" + a.id + "-no", "Guest pass declined", "The owner declined your request as " + a.name + ". You can still sign in with GitHub for LV2.", "bad");
        gateApply(currentView);
      } else if (j.state === "gone") { lsv(ASK_KEY, null); gateApply(currentView); }
    }, function () { /* offline, or the relay is not updated yet: try again later */ });
  }
  setInterval(function () { if (!document.hidden && askGet()) askCheck(); }, 20 * 1000);

  /* ---- Messages: a small list in the top bar, kept in this browser (clearance changes, guest passes, requests) ---- */
  var MSG_KEY = "hp.msgs";
  function msgAll() { try { return JSON.parse(lsv(MSG_KEY) || "[]") || []; } catch (e) { return []; } }
  function msgAdd(id, title, body, tone) {
    var all = msgAll(); if (all.some(function (x) { return x.id === id; })) return;
    all.unshift({ id: id, t: title, b: body, k: tone || "info", at: Date.now(), r: 0 });
    lsv(MSG_KEY, JSON.stringify(all.slice(0, 30))); msgDraw();
  }
  function msgAgo(t) { var s = Math.round((Date.now() - t) / 1000); return s < 60 ? "just now" : s < 3600 ? Math.floor(s / 60) + " min ago" : s < 86400 ? Math.floor(s / 3600) + " h ago" : fmtDate(new Date(t).toISOString().slice(0, 10)); }
  function msgDraw() {
    var b = $("#tbMsg"); if (!b) return;
    var all = msgAll(), n = all.filter(function (x) { return !x.r; }).length;
    b.querySelector(".tb-n").textContent = n > 9 ? "9+" : n || "";
    b.classList.toggle("unread", n > 0);
    b.setAttribute("aria-label", "Messages" + (n ? ", " + n + " unread" : ""));
    var menu = $("#msgMenu");
    if (menu && !menu.hidden) menu.innerHTML = '<div class="mm-head"><b>Messages</b>' + (all.length ? '<button type="button" id="mmClear">Clear all</button>' : "") + "</div>" +
      (all.length ? "<ul>" + all.map(function (x) { return '<li class="mm-' + esc(x.k) + (x.r ? "" : " new") + '"><i aria-hidden="true"></i><div><b>' + esc(x.t) + "</b><p>" + esc(x.b) + "</p><small>" + esc(msgAgo(x.at)) + "</small></div></li>"; }).join("") + "</ul>" : '<p class="mm-none">No messages yet.</p>');
    var c = $("#mmClear"); if (c) c.onclick = function (e) { e.stopPropagation(); lsv(MSG_KEY, "[]"); msgDraw(); };
  }
  function msgToggle(open) {
    var menu = $("#msgMenu"), b = $("#tbMsg"); if (!menu || !b) return;
    if (open == null) open = menu.hidden;
    menu.hidden = !open; b.setAttribute("aria-expanded", String(open));
    if (open) { msgDraw(); var all = msgAll(); all.forEach(function (x) { x.r = 1; }); lsv(MSG_KEY, JSON.stringify(all)); setTimeout(function () { var bb = $("#tbMsg"); if (bb) { bb.querySelector(".tb-n").textContent = ""; bb.classList.remove("unread"); } }, 600); blip(); }
  }
  /* The top bar: messages, then the gear (Profile details), then the access credential */
  function tbMount() {
    if ($("#tbId")) return true;
    var keys = $("#keys"); if (!keys) return false;
    keys.insertAdjacentHTML("beforebegin", '<div class="tb-id" id="tbId">' +
      '<div class="tb-wrap"><button type="button" class="tb-btn" id="tbMsg" aria-haspopup="true" aria-expanded="false" title="Messages"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 6.5h17v11h-17z"/><path d="M3.5 7l8.5 6.5L20.5 7"/></svg><span class="tb-n"></span></button><div class="msg-menu" id="msgMenu" hidden></div></div>' +
      '<a class="tb-btn" id="tbGear" href="#/profile" title="Profile details" aria-label="Profile details"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.6M12 18.6v2.6M2.8 12h2.6M18.6 12h2.6M5.5 5.5l1.9 1.9M16.6 16.6l1.9 1.9M5.5 18.5l1.9-1.9M16.6 7.4l1.9-1.9"/><circle cx="12" cy="12" r="6.6"/></svg></a>' +
      '<div class="si-badge" id="siBadge" role="status"></div></div>');
    $("#tbMsg").addEventListener("click", function (e) { e.stopPropagation(); msgToggle(); });
    document.addEventListener("click", function (e) { var m = $("#msgMenu"); if (m && !m.hidden && !m.contains(e.target)) msgToggle(false); });
    document.addEventListener("keydown", function (e) { var m = $("#msgMenu"); if (e.key === "Escape" && m && !m.hidden) { e.stopPropagation(); msgToggle(false); $("#tbMsg").focus(); } }, true);
    msgDraw();
    return true;
  }
  /* A message when a clearance is reached for the first time in this browser */
  function msgLevel() {
    var c = siCard(); if (!c) return;
    var who = c.guest ? "guest" : c.github_id, lvl = +String(c.card).slice(2), lv = KC_LV[c.card] || KC_LV.LV2;
    msgAdd("lv-" + who + "-" + lvl, "Clearance granted · " + c.card + " " + lv[0], c.guest ? "Guest pass: LV3 (Staff) clearance in this tab, for 24 hours." : "Your Hound ID now holds " + c.card + " (" + lv[0] + ") clearance. See what it opens on your Profile.", "ok");
  }
  /* LV7: a message for each new guest pass request (checked when the site opens, then every five minutes) */
  function asksWatch() {
    if (!siOwner() || document.hidden) return;
    sgOwnerApi("/guest/asks").then(function (j) {
      (j.asks || []).filter(function (x) { return x.state === "pending"; }).forEach(function (x) { msgAdd("req-" + x.id, "Guest pass request", x.name + " asks for a guest pass. Approve or decline it on your Profile.", "req"); });
    }, function () { /* relay not updated yet */ });
  }
  setInterval(asksWatch, 5 * 60 * 1000);
  function gateBoot() {
    askCheck(); setTimeout(asksWatch, 3000);
    setTimeout(gateWelcome, 1200);
  }
