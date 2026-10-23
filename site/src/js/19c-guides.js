  /* Guides: the handbook (guides, policies, procedures) as A4 documents */
  /* The type stripe: a band 20% in from the right edge, in the type colour, with the type written along it */
  function typeStripe(type, n) { var w = "<b>" + esc(type) + "</b>", out = ""; for (var k = 0; k < n; k++) out += w; return '<span class="stripe" aria-hidden="true">' + out + "</span>"; }
  var GUIDE_AUD = ["All", "Players", "Contributors", "Quality", "Administration"];
  var guideAud = "All";
  function viewGuides(id) {
    var v = $("#view");
    v.innerHTML = shell("Documentation", "Handbook", loading("Loading the handbook")); addZones("hb");
    Promise.all([loadLocal("guides"), loadLocal("docs")]).then(function (res) {
      if (currentView !== "guides") return;
      var list = (res[0] && res[0].guides) || [];
      if (id) return drawGuide(list, id);
      drawGuideList(list);
    });
  }
  /* Handbook filter: every word must appear (whole or in part) in the code, title, summary, type, audience, owner or text.
     A few everyday words also find their handbook terms, so "ban" finds suspensions and "linux" finds Proton. */
  var guideQ = "", guideMode = "name", guideIdx = null, guideIdxP = null;
  var GUIDE_RELATED = {
    login: ["sign-in", "sign in", "github", "keycard"], signin: ["sign-in", "github"], account: ["security", "two-factor", "github"],
    password: ["security", "two-factor", "passkey"], "2fa": ["two-factor"], hack: ["security", "incident"], leak: ["incident", "secret"],
    ban: ["suspension", "infraction", "moderation"], kick: ["moderation", "suspension"], punish: ["infraction", "suspension"], warn: ["infraction"],
    rule: ["policy", "conduct"], behaviour: ["conduct", "moderation"], behavior: ["conduct", "moderation"], toxic: ["conduct", "moderation"],
    linux: ["proton", "bazzite"], deck: ["proton"], bazzite: ["proton"], install: ["installing", "player guide"], play: ["player"],
    bug: ["report", "triage", "testing"], crash: ["report", "triage"], problem: ["report"], issue: ["report", "issue"],
    test: ["quality", "testing"], qa: ["quality"], pr: ["pull request", "review"], pull: ["pull request"], merge: ["review", "pull request"],
    code: ["contributor", "pull request"], contract: ["contract", "claim"], job: ["contract"], task: ["contract"],
    money: ["funding", "donation"], donate: ["funding", "donation"], pay: ["funding"],
    rank: ["grade"], level: ["grade", "keycard"], clearance: ["keycard"], boss: ["chain of command"], leader: ["chain of command", "lead"],
    join: ["onboarding", "contributor", "discord"], leave: ["offboarding"], quit: ["offboarding"], new: ["quick start", "basics"],
    chat: ["discord"], server: ["discord"], logo: ["brand"], art: ["brand", "media"], license: ["licensing"], copyright: ["licensing", "clean-room"],
    ai: ["ai", "agent"], bot: ["agent"], backup: ["backup", "restore"], version: ["release"], update: ["release"], website: ["website"], site: ["website"]
  };
  function guideWords() {
    return guideQ.trim().toLowerCase().split(/\s+/).filter(Boolean).map(function (w) {
      var stem = w.replace(/(ing|ed|es|s)$/, ""); if (stem.length < 3) stem = w;
      return [w, stem].concat(GUIDE_RELATED[w] || GUIDE_RELATED[stem] || []);
    });
  }
  function guideHay(g) { return [g.code, g.title, g.summary, g.type, g.audience, g.owner, guideIdx && guideMode === "text" ? guideIdx[g.id] || "" : ""].join(" ").toLowerCase(); }
  function guideMatch(g, words) {
    var h = guideHay(g);
    return words.every(function (alts) { return alts.some(function (a) { return h.indexOf(a) > -1 || (a.length > 3 && h.replace(/-/g, " ").indexOf(a) > -1); }); });
  }
  function guideIndex(list) {
    if (guideIdx) return Promise.resolve(guideIdx);
    return guideIdxP || (guideIdxP = Promise.all(list.map(function (g) { return loadDoc({ path: g.path }).then(function (t) { return [g.id, t]; }, function () { return [g.id, ""]; }); })).then(function (all) {
      guideIdx = {}; all.forEach(function (p) { guideIdx[p[0]] = p[1].replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/[*`#|>_]+/g, " ").replace(/\s+/g, " "); }); return guideIdx;
    }));
  }
  function drawGuideList(list) {
    $("#vb").innerHTML =
      '<p class="sub">Everything you need to play, contribute, test and run Hound Protocol, written down. Every document is versioned, owned by a department and printable on A4.</p>' +
      '<div class="hb-tools"><label class="cab-q hb-q"><span aria-hidden="true">⌕</span><input id="hq" type="search" placeholder="' + (guideMode === "text" ? "Filter by what the documents say" : "Filter by name: a word, part of one, or a topic") + '" aria-label="Filter the Handbook" aria-controls="hbList" autocomplete="off" spellcheck="false"><kbd>Ctrl K</kbd><i class="cab-scan" aria-hidden="true"></i></label>' + smSwitch("hb", guideMode) +
      '<div class="tabs" role="tablist">' + GUIDE_AUD.map(function (a) { return '<button role="tab" data-aud="' + a + '" aria-selected="' + (guideAud === a) + '">' + a + "</button>"; }).join("") + "</div></div>" +
      '<div class="cab-count" id="hbCount" aria-live="polite"></div><div id="hbList"></div>' +
      '<p class="source">Source: docs/guides/ · index generated by tools/guides_index.py</p>';
    var q = $("#hq");
    q.value = guideQ;
    function needText() { if (guideQ.trim() && !guideIdx && guideMode === "text") { $(".hb-q").classList.add("busy"); var at = guideQ; guideIndex(list).then(function () { var b = $(".hb-q"); if (b) b.classList.remove("busy"); if (currentView === "guides" && guideQ === at && $("#hbList")) drawGuideSheets(list); }); } }
    smWire("hb", function (m) { guideMode = m; q.placeholder = m === "text" ? "Filter by what the documents say" : "Filter by name: a word, part of one, or a topic"; drawGuideSheets(list); needText(); q.focus(); });
    q.addEventListener("input", function () {
      guideQ = q.value; drawGuideSheets(list);
      if (guideQ.trim() && !guideIdx && guideMode === "text") { $(".hb-q").classList.add("busy"); var at = guideQ; guideIndex(list).then(function () { var b = $(".hb-q"); if (b) b.classList.remove("busy"); if (currentView === "guides" && guideQ === at && $("#hbList")) drawGuideSheets(list); }); }
    });
    q.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && q.value) { e.preventDefault(); e.stopPropagation(); q.value = ""; guideQ = ""; drawGuideSheets(list); }
      else if (e.key === "Enter") { var a = $("#hbList .mini"); if (a) { e.preventDefault(); a.click(); } }
    });
    $$("[data-aud]").forEach(function (b) { b.addEventListener("click", function () { guideAud = b.dataset.aud; $$("[data-aud]").forEach(function (x) { x.setAttribute("aria-selected", String(x === b)); }); drawGuideSheets(list); }); });
    drawGuideSheets(list);
    if (guideQ.trim() && !guideIdx && guideMode === "text") guideIndex(list).then(function () { if (currentView === "guides" && $("#hbList")) drawGuideSheets(list); });
  }
  function drawGuideSheets(list) {
    var words = guideWords(), filtering = !!words.length;
    var shown = list.filter(function (g) { return (guideAud === "All" || g.audience === guideAud) && (!filtering || guideMatch(g, words)); });
    var re = filtering ? new RegExp("(" + words.map(function (a) { return a[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }).join("|") + ")", "ig") : null;
    function hl(t) { return re ? esc(t).replace(re, "<mark>$1</mark>") : esc(t); }
    var byType = { Guide: [], Policy: [], Procedure: [] };
    shown.forEach(function (g) { (byType[g.type] = byType[g.type] || []).push(g); });
    var section = function (type, label, note) {
      var l = byType[type] || [];
      if (!l.length) return "";
      return '<div class="label">' + label + '</div><p class="sub">' + note + '</p><div class="sheets">' + l.map(function (g, n) {
        return '<a class="mini t-' + esc(g.type.toLowerCase()) + '" style="--i:' + n + '" href="#/guides/' + esc(g.id) + '"><span class="m-top"><b>' + hl(g.code) + "</b><i>v" + esc(g.version) + "</i></span>" +
          '<span class="m-title">' + hl(g.title) + '</span><span class="m-sum">' + hl(g.summary) + "</span>" +
          '<span class="m-foot">' + esc(g.owner) + " Dept</span>" + typeStripe(g.type, 3) + "</a>";
      }).join("") + "</div>";
    };
    $("#hbList").innerHTML =
      section("Guide", "Guides", "How-to help for each audience.") +
      section("Policy", "Policies", "Rules everyone follows.") +
      section("Procedure", "Standard operating procedures", "Step by step, the same way every time.") +
      (shown.length ? "" : filtering ? '<div class="cab-none"><b>No match</b>No handbook document matches “' + esc(guideQ.trim()) + '”' + (guideAud !== "All" ? " for " + esc(guideAud) : "") + '.<small>Try fewer words, part of a word, or the All tab.</small></div>' : '<div class="empty">No documents for this audience yet</div>');
    $("#hbCount").innerHTML = filtering ? '<span class="n">' + plural(shown.length, "document") + "</span> match" + (guideIdx || guideMode !== "text" ? "" : '<span class="cab-wait"> · reading the text…</span>') + '<span class="cab-keys">↵ open the first · Esc clear</span>' : "";
    $("#hbList").classList.toggle("filtering", filtering);
  }
  /* Ctrl+K or / jumps to the Handbook filter */
  document.addEventListener("keydown", function (e) {
    if (currentView !== "guides") return;
    var tag = (e.target && e.target.tagName) || "", q = $("#hq");
    if (!q) return;
    if (((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) || (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(tag))) { e.preventDefault(); q.focus(); q.select(); }
  });
  function drawGuide(list, id) {
    var g = list.filter(function (x) { return x.id === id; })[0];
    if (!g) { $("#vb").innerHTML = '<div class="empty">No document ' + esc(id) + '<small><a href="#/guides">Back to the handbook</a></small></div>'; return; }
    $("#vb").innerHTML = loading("Opening " + g.code);
    loadDoc({ path: g.path }).then(function (src) {
      if (currentView !== "guides") return;
      // The sheet header carries the title and metadata, so drop them from the body
      var body = src.replace(/^# .*\n/, "").replace(/^Code: .*\n/, "");
      var html = markdown(body, g.path).replace(/href="#\/docs\/(hp-(?:pol|sop|gde)-\d{3})"/g, 'href="#/guides/$1"');
      var url = (cfg.siteUrl || "https://hound-protocol.github.io/Joint-Operations/") + "#/guides/" + g.id;
      $("#vb").innerHTML =
        cabClr(true, null).replace('class="clr ok"', 'class="clr ok hb-clr"') +
        '<div class="toolbar sheet-bar"><a class="btn small" href="#/guides">Handbook</a><a class="btn small primary" id="gpdf" href="guides/pdf/' + esc(g.code) + '.pdf" download hidden>Download PDF</a><button class="btn small" id="gprint">Print</button>' +
        '<a class="btn small" href="' + esc(repoUrl("/blob/" + cfg.branch + "/" + g.path)) + '" target="_blank" rel="noopener noreferrer">View on GitHub</a></div>' +
        '<article class="sheet t-' + esc(g.type.toLowerCase()) + '" aria-label="' + esc(g.code + " " + g.title) + '">' +
          typeStripe(g.type, 6) +
          '<header class="sh-head"><div class="sh-org"><img src="assets/brand/hound-protocol-mark-light.svg" alt="" width="34" height="34"><span><b>Hound Protocol</b><i>MGSV: Joint Operations</i></span></div>' +
          '<div class="sh-code"><b>' + esc(g.code) + "</b><i>" + esc(g.type) + "</i></div></header>" +
          '<h1 class="sh-title">' + esc(g.title) + "</h1>" +
          '<dl class="sh-meta"><div><dt>Version</dt><dd>' + esc(g.version) + "</dd></div><div><dt>Effective</dt><dd>" + esc(g.effective) + "</dd></div>" +
          "<div><dt>Owner</dt><dd>" + esc(g.owner) + " Dept</dd></div><div><dt>For</dt><dd>" + esc(g.for) + "</dd></div><div><dt>Classification</dt><dd>Public</dd></div></dl>" +
          '<div class="sh-body">' + html + "</div>" +
          '<footer class="sh-foot"><span>' + esc(g.code) + " · v" + esc(g.version) + " · " + esc(g.effective) + '</span><span>Uncontrolled when printed. Current version: ' + esc(url) + "</span></footer>" +
        "</article>";
      $("#gprint").addEventListener("click", function () { printSheet(); });
      /* Opened from a Documentation search: mark the words and scroll to the first */
      if (cabHL) { var hit = cabHighlight($(".sh-body"), cabHL); cabHL = null; if (hit && hit.scrollIntoView) setTimeout(function () { hit.scrollIntoView({ behavior: opts.motion ? "smooth" : "auto", block: "center" }); }, opts.motion ? 260 : 0); }
      // The PDF exists on the deployed site (built by tools/guides_pdf.py); show the button only when it is there
      if (typeof fetch === "function") fetch("guides/pdf/" + encodeURIComponent(g.code) + ".pdf", { method: "HEAD" }).then(function (r) { var b = $("#gpdf"); if (b && r.ok) b.hidden = false; }, function () { /* offline or local copy */ });
      document.title = g.code + " " + g.title + " · " + cfg.project;
    }, function () {
      $("#vb").innerHTML = '<div class="empty">Could not load ' + esc(g.code) + '<small><a href="#/guides">Back to the handbook</a></small></div>';
    });
  }

  // Print with a fallback: some browsers (for example Flatpak browsers without a print portal) never open the dialog
  function printSheet() {
    var opened = false;
    function mark() { opened = true; }
    window.addEventListener("beforeprint", mark);
    try { window.focus(); window.print(); } catch (e) { /* handled below */ }
    setTimeout(function () {
      window.removeEventListener("beforeprint", mark);
      if (opened) return;
      var mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || "");
      status("No print dialog? Press " + (mac ? "Cmd+P" : "Ctrl+P") + ($("#gpdf") && !$("#gpdf").hidden ? ", or use Download PDF" : ""), true);
    }, 600);
  }
