  /* Contribute */
  var MODULES = { launcher: "Launcher / Injector", hooks: "Game Hooks", session: "Session / Host", net: "Networking", modapi: "Mod API", lobby: "Lobby App", web: "Web", docs: "Docs", testing: "Testing", legal: "Legal" };
  // Contractor ranks, Mother Base style, by completed contracts (docs/departments.md)
  // Contractor grades follow Mother Base staff grades (E to S++). As in MGSV, a contractor holds a grade in every field
  // (like a unit), earned from contract points in that field; the thresholds climb steeply. See docs/departments.md.
  var GRADES = [
    ["E", 1, "Contractor role on Discord, listed on the contributor wall"],
    ["D", 4, ""], ["C", 8, ""],
    ["B", 14, "Hold two contracts at once"],
    ["A", 22, "Review {{easy:Easy}} contracts in this field, as advice to Quality"],
    ["A+", 32, "Review {{medium:Medium}} contracts in this field"],
    ["A++", 50, "Mentor new contractors in this field"],
    ["S", 80, "Review {{hard:Hard}} contracts in this field"],
    ["S+", 125, "Can be invited into a department"],
    ["S++", 200, "Candidate for a lead position"]
  ];
  var CP = { easy: 2, medium: 5, hard: 10 }; // contract points per completed contract
  // Contract difficulty (docs/departments.md): information only, never a gate. Name, short label, and what makes it this hard
  var DIFF = {
    easy: ["Easy", "Good first contract", "Clear steps and a small scope. No game knowledge needed: docs, test runs, small tools."],
    medium: ["Medium", "Some experience", "Some research or design. Touches a few files or systems, or needs the game and a test rig."],
    hard: ["Hard", "Deep skills", "Unknown ground: reverse engineering, networking, core systems. Needs deep skills and careful testing."]
  };
  var DIFF_ORDER = ["easy", "medium", "hard"];
  // Board columns: field, description, modules, icon
  var FIELDS = [
    ["code", "Code", "Networking, session, launcher and the mod API", ["net", "session", "launcher", "modapi"], "devlog"],
    ["re", "Architecture Research", "How the game is built inside, and where we hook in", ["hooks"], "sessions"],
    ["qa", "Testing", "Test rigs, harnesses and bad-network profiles", ["testing"], "contribute"],
    ["design", "Design and web", "Screens, the lobby and the website", ["lobby", "web"], "mods"],
    ["docs", "Docs and legal", "Writing, research summaries and the legal position", ["docs", "legal"], "guides"]
  ];
  var CORE_NOTE = "Core: on the 0.1 critical path. Development Department only.";
  // {{easy:Text}} color-codes a word by difficulty; {{key:Text}} uses the amber accent
  function tint(s) { return esc(s).replace(/\{\{(easy|medium|hard|key):([^}]+)\}\}/g, function (_, k, w) { return '<b class="tint ' + k + '">' + w + "</b>"; }); }
  function diffPill(c) {
    var d = DIFF[c.difficulty];
    return (d ? '<span class="pill diff ' + esc(c.difficulty) + '" title="' + esc(d[0] + ": " + d[2]) + '">' + esc(d[0]) + "</span>" : "") +
      (c.core ? '<span class="pill diff core" title="' + esc(CORE_NOTE) + '">Core</span>' : "");
  }
  var conState = { module: "all", status: "all", diff: "all", q: "" };
  function contractList() {
    if (data.issues && data.issues.length) return data.issues;
    var p = data.contracts && data.contracts.contracts;
    return (p || []).map(function (c) { return Object.assign({ status: "planned", by: [], live: false }, c); });
  }
  function gradeFor(p) { var r = null; GRADES.forEach(function (x) { if (p >= x[1]) r = x; }); return r; }
  function gradeIdx(g) { return g ? GRADES.indexOf(g) : -1; }
  function fieldOf(module) { var f = FIELDS.filter(function (x) { return x[3].indexOf(module) > -1; })[0]; return f ? f[0] : "code"; }
  // items: [{ login, name, difficulty, module }] -> sorted [{ login, name, n, f: {field: points}, best: grade }]
  function tallyGrades(items) {
    var by = {};
    items.forEach(function (it) {
      var u = by[it.login] = by[it.login] || { login: it.login, name: it.name, n: 0, f: {} }, k = fieldOf(it.module);
      u.n++; if (it.name) u.name = it.name;
      u.f[k] = (u.f[k] || 0) + (CP[it.difficulty] || CP.easy);
    });
    return Object.keys(by).map(function (k) {
      var u = by[k], best = null;
      Object.keys(u.f).forEach(function (f) { var g = gradeFor(u.f[f]); if (gradeIdx(g) > gradeIdx(best)) best = g; });
      u.best = best; return u;
    }).sort(function (a, b) { return gradeIdx(b.best) - gradeIdx(a.best) || b.n - a.n || a.login.localeCompare(b.login); });
  }
  function viewContribute() {
    var v = $("#view");
    v.innerHTML = shell("Contract network", "Contribute", loading("Loading the contract board"));
    cardsAnim = true;
    Promise.all([loadContracts(), loadLocal("contracts")]).then(function () { if (currentView === "contribute") drawContribute(); refreshInfo(); });
  }
  function drawContribute() {
    var list = contractList(), live = !!(data.issues && data.issues.length);
    var counts = { open: 0, planned: 0, claimed: 0, review: 0, done: 0 };
    list.forEach(function (c) { counts[c.status] = (counts[c.status] || 0) + 1; });
    var shown = list.filter(function (c) {
      if (conState.module !== "all" && c.module !== conState.module) return false;
      if (conState.status !== "all" && c.status !== conState.status) return false;
      if (conState.diff !== "all" && c.difficulty !== conState.diff) return false;
      if (conState.q && (c.id + " " + c.title + " " + (c.skills || "") + " " + (c.goal || "")).toLowerCase().indexOf(conState.q.toLowerCase()) < 0) return false;
      return true;
    });
    // Board: one column per field, cards sorted open first (easy to hard), finished work last
    var STATUS = { planned: ["○", "Planned"], open: ["●", "Open"], blocked: ["✕", "Blocked"], claimed: ["◐", "Claimed"], review: ["◑", "In review"], done: ["✓", "Done"] };
    var rank = { open: 0, planned: 1, claimed: 2, review: 3, blocked: 4, done: 5 };
    function card(c, n) {
      var st = c.blocked && c.status === "open" ? "blocked" : c.status, S = STATUS[st] || ["", st];
      var action = "";
      if (c.live) action = (st !== "done" ? '<a class="btn small primary" href="' + esc(c.url) + '#new_comment_field" target="_blank" rel="noopener noreferrer" title="Comment /claim on the issue. Several people can claim the same contract.">' + ((c.by || []).length ? "Join claim" : "Claim") + "</a>" : "") +
        '<a class="btn small" href="' + esc(c.url) + '" target="_blank" rel="noopener noreferrer">View on GitHub</a>';
      else action = '<a class="btn small issuebtn" href="' + esc(newIssueUrl("[" + c.id + "] " + c.title, "Module: " + (MODULES[c.module] || c.module) + "\nDifficulty: " + ((DIFF[c.difficulty] || [c.difficulty])[0]) + (c.core ? " (Core: Development Department only)" : "") + "\nSkills: " + (c.skills || "") + (c.depends && c.depends.length ? "\nDepends on: " + c.depends.join(", ") : "") + "\n\n## Goal\n" + (c.goal || "") + (c.deliverable ? "\n\n## Deliverable\n" + c.deliverable : "") + "\n\n## Definition of done\n" + ((c.acceptance && c.acceptance.length) ? c.acceptance.map(function (a) { return "- [ ] " + a; }).join("\n") : "- ") + "\n", "contract,module:" + c.module + ",difficulty:" + c.difficulty + (c.core ? ",core" : ""))) + '" target="_blank" rel="noopener noreferrer">Open as issue <span aria-hidden="true">↗</span></a>';
      var done = st === "done";
      return '<article class="kc st-' + esc(st) + " d-" + esc(c.difficulty || "none") + '" style="--i:' + n + '">' +
        '<div class="kc-top"><span class="kc-id">' + esc(c.id) + '</span><span class="kc-st">' + S[0] + " " + S[1] + (c.by && c.by.length > 1 && !done ? " · " + c.by.length : "") + "</span></div>" +
        "<h3>" + esc(c.title) + "</h3>" +
        ((c.by || []).length && !done ? '<div class="kc-claims" aria-label="Claimed by">' + c.by.map(function (u) { return '<a class="tok" href="https://github.com/' + encodeURIComponent(u) + '" target="_blank" rel="noopener noreferrer"><i>◆</i>' + esc(u) + "</a>"; }).join("") + "</div>" : "") +
        '<div class="kc-tags">' + diffPill(c) + (c.module ? '<span class="pill mod">' + esc(MODULES[c.module] || c.module) + "</span>" : "") + "</div>" +
        (done
          ? '<div class="kc-stamp">Completed' + (c.by && c.by.length ? " by " + esc(c.by.join(", ")) : "") + "</div>" + (c.live ? '<div class="actions">' + action + "</div>" : "")
          : (c.depends && c.depends.length ? '<div class="meta' + (c.blocked ? " blocked" : "") + '">' + (c.blocked ? "Waiting for " : "After ") + esc(c.depends.join(", ")) + "</div>" : "") +
            (c.goal ? '<p class="goal">' + esc(c.goal) + "</p>" : "") +
            ((c.acceptance && c.acceptance.length) || c.deliverable ? '<details class="spec"><summary><span>Acceptance criteria</span><i aria-hidden="true">' + (c.acceptance ? c.acceptance.length : 0) + "</i></summary>" +
              (c.deliverable ? '<div class="meta">Deliverable: ' + esc(c.deliverable) + "</div>" : "") +
              (c.acceptance && c.acceptance.length ? "<ul>" + c.acceptance.map(function (a) { return "<li>" + esc(a) + "</li>"; }).join("") + "</ul>" : "") + "</details>" : "") +
            (c.skills ? '<div class="meta">Skills: ' + esc(c.skills) + "</div>" : "") +
            '<div class="actions">' + action + "</div>") +
        "</article>";
    }
    var board = FIELDS.map(function (f) {
      var all = list.filter(function (c) { return f[3].indexOf(c.module) > -1; });
      var cs = shown.filter(function (c) { return f[3].indexOf(c.module) > -1; }).sort(function (a, b) {
        var sa = a.blocked && a.status === "open" ? "blocked" : a.status, sb = b.blocked && b.status === "open" ? "blocked" : b.status;
        return (rank[sa] - rank[sb]) || (DIFF_ORDER.indexOf(a.difficulty) - DIFF_ORDER.indexOf(b.difficulty));
      });
      if (!all.length) return "";
      var dn = all.filter(function (c) { return c.status === "done"; }).length;
      return '<section class="kcol f-' + f[0] + '"><header class="kcol-h"><div class="kcol-t">' + menuIcon(f[4]) + "<b>" + esc(f[1]) + "</b><i>" + cs.length + "</i></div>" +
        "<p>" + esc(f[2]) + '</p><div class="kcol-m"><span style="width:' + Math.round(dn / all.length * 100) + '%"></span></div><small>' + dn + " of " + all.length + " done</small></header>" +
        '<div class="kcol-b">' + (cs.length ? cs.map(card).join("") : '<div class="kcol-e">Nothing matches the filters</div>') + "</div></section>";
    }).join("");
    // Module progress
    var mods = Object.keys(MODULES).map(function (k) {
      var l = list.filter(function (c) { return c.module === k; }), d = l.filter(function (c) { return c.status === "done"; }).length;
      return { k: k, n: l.length, d: d };
    }).filter(function (m) { return m.n; });
    // Leaderboard from completed live contracts
    var items = [];
    list.forEach(function (c) { if (c.status === "done") (c.by || []).forEach(function (u) { items.push({ login: u, difficulty: c.difficulty, module: c.module }); }); });
    var ops = tallyGrades(items);
    var opt = function (val, cur, txt) { return '<option value="' + val + '"' + (cur === val ? " selected" : "") + ">" + txt + "</option>"; };
    $("#vb").innerHTML =
      '<div class="conbar"><div class="tabs" role="tablist">' + [["board", "Contract board"], ["ranks", "Contractor ranks"]].map(function (t) {
        return '<button role="tab" data-tab="' + t[0] + '" aria-selected="' + (conTab === t[0]) + '">' + t[1] + "</button>";
      }).join("") + "</div>" +
      '<div class="howbox"><button class="btn howbtn' + (conTab === "how" ? " on" : "") + '" data-tab="how" aria-pressed="' + (conTab === "how") + '">How it works</button><small>Discover how the contribution system works</small></div>' +
      '<div class="conupd">' + conUpdated(live) + "</div></div>" +
      '<div id="ctab"></div>';
    var tabHtml = {
      board:
        (live ? "" : '<p class="note">This is the plan. Version 0.1 is being built by the project lead, and contracts open to the Contractor Department after 0.1. Testers are welcome now: join the Discord.</p>') +
        '<div class="crow-sep"><span>Overview</span></div>' +
        '<div class="stats">' + (live
          ? '<div class="stat"><b>' + counts.open + '</b><span>Open</span></div><div class="stat"><b>' + counts.claimed + '</b><span>Claimed</span></div><div class="stat"><b>' + counts.review + '</b><span>In review</span></div><div class="stat"><b>' + counts.done + "</b><span>Done</span></div>"
          : '<div class="stat"><b>' + counts.planned + '</b><span>Planned</span></div><div class="stat"><b>' + mods.length + '</b><span>Modules</span></div><div class="stat"><b>' + counts.done + '</b><span>Done</span></div>') + "</div>" +
        '<div class="crow-sep"><span>Difficulty</span></div>' +
        '<p class="diffhint">Select your difficulty to apply filters' + (conState.diff !== "all" ? ' · <button class="linkbtn" id="dclr">Show all difficulties</button>' : "") + "</p>" +
        '<div class="diffs' + (conState.diff !== "all" ? " picking" : "") + '">' + DIFF_ORDER.map(function (k) {
          var d = DIFF[k], n2 = list.filter(function (c) { return c.difficulty === k; }).length;
          return '<button class="diffcard ' + k + (conState.diff === k ? " sel" : "") + '" data-diff="' + k + '" aria-pressed="' + (conState.diff === k) + '"><span class="dc-on" aria-hidden="true">✓ Filter on</span><span class="dc-h"><b>' + d[0] + "</b><i>" + plural(n2, "contract") + "</i></span>" +
            '<span class="dc-who">' + d[1] + '</span><span class="dc-what">' + d[2] + "</span></button>";
        }).join("") + "</div>" +
        '<p class="sub diffnote">Difficulty tells you what to expect. It is not a gate: anyone can take any contract. <span class="pill diff core">Core</span> ' + esc(CORE_NOTE) + "</p>" +
        '<div class="crow-sep"><span>Contract board</span></div>' +
        '<div class="toolbar"><input class="field grow" id="cq" type="search" placeholder="Search contracts" value="' + esc(conState.q) + '" aria-label="Search contracts">' +
        '<select class="field" id="cm" aria-label="Module">' + opt("all", conState.module, "All modules") + Object.keys(MODULES).map(function (k) { return opt(k, conState.module, MODULES[k]); }).join("") + "</select>" +
        '<select class="field" id="cs" aria-label="Status">' + opt("all", conState.status, "All statuses") + (live ? opt("open", conState.status, "Open") + opt("claimed", conState.status, "Claimed") + opt("review", conState.status, "In review") + opt("done", conState.status, "Done") : opt("planned", conState.status, "Planned")) + "</select>" +
        '<select class="field" id="cz" aria-label="Difficulty">' + opt("all", conState.diff, "All difficulties") + DIFF_ORDER.map(function (k) { return opt(k, conState.diff, DIFF[k][0]); }).join("") + "</select></div>" +
        (shown.length ? '<div class="kanban' + (cardsAnim ? " anim" : "") + '">' + board + "</div>" : '<div class="empty">No contracts match<small>Change the filters.</small></div>') +
        (live ? '<p class="sub claimnote">To claim, comment <code>/claim</code> on the contract\'s GitHub issue. Several people can claim the same contract, and every claimant shows here with their token. <code>/unclaim</code> leaves it. The board refreshes every 2 minutes.</p>' : "") +
        '<p class="source">Source: ' + (live ? "GitHub issues labeled contract, live" : data.issues === null ? "data/contracts.json · GitHub could not be reached" : "data/contracts.json") + "</p>",
      how:
        '<div class="cols"><div class="panel"><div class="label">Taking a contract</div><ol class="steps">' +
        "<li>Pick any open contract. An <b class=\"tint easy\">Easy</b> one is a good start.</li><li>Comment on the GitHub issue to claim it. A maintainer assigns you.</li><li>Do the work on a branch in your fork. Sign off every commit.</li><li>Open a pull request that says Closes #number.</li><li><b class=\"tint key\">Quality</b> checks it against the acceptance criteria and merges it. You get a <b class=\"tint key\">signed record</b> and move up in rank.</li></ol></div>" +
        '<div class="panel"><div class="label">Rules</div><ol class="steps">' +
        "<li>Pull requests only. Nobody pushes to main.</li><li>No game files and no code copied from other mods.</li><li>AI tools are welcome for code and docs. No generative AI art, music or voices.</li><li>Nothing that touches Konami's servers or anti-cheat.</li><li>Leaving is fine. Post a short handoff note first.</li></ol></div></div>" +
        '<div class="toolbar" style="margin-top:14px"><a class="btn primary" href="#/guides/hp-gde-003">Quick start</a><a class="btn" href="#/guides/hp-pol-002">AI Use Policy</a><a class="btn" href="' + repoUrl("/fork") + '" target="_blank" rel="noopener noreferrer">Fork on GitHub</a><a class="btn" href="' + repoUrl("/issues?q=is%3Aopen+label%3Acontract") + '" target="_blank" rel="noopener noreferrer">Contracts on GitHub</a></div>' +
        '<div class="label">Module progress</div><div class="cols">' + mods.map(function (m) {
          return '<div class="panel"><div class="kv"><span>' + esc(MODULES[m.k]) + "</span><b>" + m.d + " / " + m.n + '</b></div><div class="meter"><i style="width:' + Math.round(m.d / m.n * 100) + '%"></i></div></div>';
        }).join("") + "</div>",
      ranks:
        '<p class="sub">Contractors are graded like Mother Base staff, from <b>E</b> to <b>S++</b>. As in the game, you hold a grade in <b>each field</b>, the way staff hold a grade in each unit. Every completed contract earns points in its field: <b class="tint easy">Easy</b> ' + CP.easy + ', <b class="tint medium">Medium</b> ' + CP.medium + ', <b class="tint hard">Hard</b> ' + CP.hard + '. Each grade needs more points than the last, so the top grades take real work. Your best grade is your rank on Discord.</p>' +
        '<div class="ranks">' + GRADES.map(function (r, k) { return '<div class="rank' + (r[2] ? "" : " quiet") + '" style="--i:' + k + '"><b class="r-grade">' + esc(r[0]) + '</b><span class="r-n">' + r[1] + " point" + (r[1] === 1 ? "" : "s") + '</span><span class="r-u">' + (r[2] ? tint(r[2]) : "Experience in the field") + "</span></div>"; }).join("") + "</div>" +
        '<ul class="notes"><li><b>Commendations</b> work like medals: Administration can award one for exceptional work. It adds ' + CP.medium + ' points to every field and is listed publicly with the reason.</li>' +
        '<li>Grades never go down. Leaving and coming back is normal.</li>' +
        '<li>Grades give no authority over other people. Reviews are advice: Quality and Development still decide. See <a href="#/team">the chain of command</a>.</li></ul>' +
        '<div class="label">Contract difficulty</div>' +
        '<div class="tw"><table><tr><th>Difficulty</th><th>What makes it this hard</th></tr>' + DIFF_ORDER.map(function (k) { return '<tr><td><span class="pill diff ' + k + '">' + DIFF[k][0] + "</span></td><td>" + DIFF[k][2] + "</td></tr>"; }).join("") +
        '<tr><td><span class="pill diff core">Core</span></td><td>On the 0.1 critical path, at any difficulty. Reserved for the Development Department until 0.1.</td></tr></table></div>' +
        '<div class="label">Contractors</div>' +
        (ops.length ? '<div class="tw"><table><tr><th>Contractor</th><th>Contracts</th><th>Rank</th>' + FIELDS.map(function (f) { return "<th>" + esc(f[1]) + "</th>"; }).join("") + "</tr>" + ops.map(function (u) {
          return '<tr><td><a href="https://github.com/' + encodeURIComponent(u.login) + '" target="_blank" rel="noopener noreferrer">' + esc(u.login) + '</a></td><td class="num">' + u.n + "</td><td><b>" + esc(u.best ? u.best[0] : "–") + "</b></td>" +
            FIELDS.map(function (f) { var g = gradeFor(u.f[f[0]] || 0); return '<td class="num">' + (g ? esc(g[0]) : "–") + "</td>"; }).join("") + "</tr>";
        }).join("") + "</table></div>" : '<div class="empty">No completed contracts yet<small>Contractors appear here when contracts are closed on GitHub.</small></div>')
    };
    $("#ctab").innerHTML = tabHtml[conTab];
    cardsAnim = false;
    $$('[data-tab]').forEach(function (b) { b.addEventListener("click", function () { conTab = b.dataset.tab; drawContribute(); }); });
    if (conTab === "board") {
      $("#cq").addEventListener("input", function (e) { conState.q = e.target.value; var p = e.target.selectionStart; drawContribute(); var n = $("#cq"); n.focus(); try { n.setSelectionRange(p, p); } catch (x) { /* ignore */ } });
      $("#cm").addEventListener("change", function (e) { conState.module = e.target.value; drawContribute(); });
      $("#cs").addEventListener("change", function (e) { conState.status = e.target.value; drawContribute(); });
      $("#cz").addEventListener("change", function (e) { conState.diff = e.target.value; drawContribute(); });
      $$("[data-diff]").forEach(function (b) { b.addEventListener("click", function () { conState.diff = conState.diff === b.dataset.diff ? "all" : b.dataset.diff; cardsAnim = true; drawContribute(); status(conState.diff === "all" ? "Showing all difficulties" : DIFF[conState.diff][0] + " contracts only"); }); });
      if ($("#dclr")) $("#dclr").addEventListener("click", function () { conState.diff = "all"; cardsAnim = true; drawContribute(); });
    }
  }
  var conTab = "board", cardsAnim = true;
  function conUpdated(live) {
    var t = live ? data.issuesAt : (data.contracts && data.contracts.updated);
    if (!t) return "";
    var d = new Date(t), ago = live ? Math.max(0, Math.round((Date.now() - d) / 60000)) : -1;
    return '<span class="upd-k">Last update</span><b>' + (live ? (ago < 1 ? "just now" : ago + " min ago") : esc(fmtDate(t))) + "</b><small>" + (live ? "Live from GitHub, every 2 minutes" : "Planned contracts") + "</small>";
  }

  // Keep claims live while the Contribute page is open and visible
  setInterval(function () {
    if (currentView !== "contribute" || document.hidden || !data.issues || !data.issues.length) return;
    session.clear("jo-gh:/repos/" + cfg.repo + "/issues?labels=contract");
    data.issues = undefined;
    loadContracts().then(function () { if (currentView === "contribute" && conTab === "board") { cardsAnim = false; drawContribute(); } });
  }, 120000);
