  /* Contribute */
  var MODULES = { launcher: "Launcher / Injector", hooks: "Game Hooks", session: "Session / Host", net: "Networking", modapi: "Mod API", lobby: "Lobby App", web: "Web", docs: "Docs", testing: "Testing", legal: "Legal" };
  // Contractor ranks, Mother Base style, by completed contracts (docs/departments.md)
  var RANKS = [["—", 0, "Claim {{easy:Easy}} contracts"], ["A", 1, "Listed on the contributor wall, contractor role on Discord"], ["A+", 3, "Claim {{medium:Medium}} contracts"], ["A++", 6, "Review {{easy:Easy}} contracts with Quality"], ["S", 10, "Claim {{hard:Hard}} contracts, review {{medium:Medium}} ones"], ["S+", 20, "Review {{hard:Hard}} contracts, invitation into a department"], ["S++", 35, "Vote on priorities, seat candidate"]];
  // Contract difficulty (docs/departments.md): color, who can claim it, and what makes a contract this hard
  var DIFF = {
    easy: ["Easy", "Anyone", "Clear steps and a small scope. No game knowledge needed: docs, test runs, small tools. Usually a day or two."],
    medium: ["Medium", "Rank A+", "Some research or design. Touches a few files or systems, or needs the game and a test rig. Usually a few days."],
    hard: ["Hard", "Rank S", "Unknown ground: reverse engineering, networking, core systems. Needs deep skills and careful testing. A week or more."]
  };
  var DIFF_ORDER = ["easy", "medium", "hard"];
  var CORE_NOTE = "Core: on the 0.1 critical path. Development Department only.";
  // {{easy:Text}} color-codes a word by difficulty; {{key:Text}} uses the amber accent
  function tint(s) { return esc(s).replace(/\{\{(easy|medium|hard|key):([^}]+)\}\}/g, function (_, k, w) { return '<b class="tint ' + k + '">' + w + "</b>"; }); }
  function diffPill(c) {
    var d = DIFF[c.difficulty];
    return (d ? '<span class="pill diff ' + esc(c.difficulty) + '" title="' + esc(d[0] + ": " + d[2] + " Who can claim it: " + d[1] + ".") + '">' + esc(d[0]) + "</span>" : "") +
      (c.core ? '<span class="pill diff core" title="' + esc(CORE_NOTE) + '">Core</span>' : "");
  }
  var conState = { module: "all", status: "all", diff: "all", q: "" };
  function contractList() {
    if (data.issues && data.issues.length) return data.issues;
    var p = data.contracts && data.contracts.contracts;
    return (p || []).map(function (c) { return Object.assign({ status: "planned", by: [], live: false }, c); });
  }
  function rankFor(p) { var r = RANKS[0]; RANKS.forEach(function (x) { if (p >= x[1]) r = x; }); return r; }
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
    var board = shown.map(function (c, n) {
      var label = { planned: "Planned", open: c.blocked ? "Blocked" : "Open", claimed: "Claimed", review: "In review", done: "Done" }[c.status];
      var action = "";
      if (c.live) action = '<a class="btn small' + (c.status === "open" && !c.blocked ? " primary" : "") + '" href="' + esc(c.url) + '" target="_blank" rel="noopener noreferrer">' + (c.status === "open" && !c.blocked ? "Claim on GitHub" : "View on GitHub") + "</a>";
      else action = '<a class="btn small" href="' + esc(newIssueUrl("[" + c.id + "] " + c.title, "Module: " + (MODULES[c.module] || c.module) + "\nDifficulty: " + ((DIFF[c.difficulty] || [c.difficulty])[0]) + (c.core ? " (Core: Development Department only)" : "") + (c.effort ? "\nEffort: " + c.effort : "") + "\nSkills: " + (c.skills || "") + (c.depends && c.depends.length ? "\nDepends on: " + c.depends.join(", ") : "") + "\n\n## Goal\n" + (c.goal || "") + (c.deliverable ? "\n\n## Deliverable\n" + c.deliverable : "") + "\n\n## Definition of done\n" + ((c.acceptance && c.acceptance.length) ? c.acceptance.map(function (a) { return "- [ ] " + a; }).join("\n") : "- ") + "\n", "contract,module:" + c.module + ",difficulty:" + c.difficulty + (c.core ? ",core" : ""))) + '" target="_blank" rel="noopener noreferrer">Open as issue</a>';
      return '<article class="card d-' + esc(c.difficulty || "none") + '" style="--i:' + n + '"><div class="id">' + esc(c.id) + '</div><h3>' + esc(c.title) + "</h3><div>" +
        (c.module ? '<span class="pill">' + esc(MODULES[c.module] || c.module) + "</span>" : "") +
        diffPill(c) +
        (c.effort ? '<span class="pill">' + esc(c.effort) + "</span>" : "") +
        (c.skills ? '<span class="pill">' + esc(c.skills) + "</span>" : "") + "</div>" +
        '<div class="status ' + (c.blocked && c.status === "open" ? "claimed" : c.status) + '">' + label + (c.by && c.by.length ? " · " + esc(c.by.join(", ")) : "") + "</div>" +
        (c.depends && c.depends.length ? '<div class="meta' + (c.blocked ? " blocked" : "") + '">Depends on ' + esc(c.depends.join(", ")) + "</div>" : "") +
        (c.goal ? '<p class="goal">' + esc(c.goal) + "</p>" : "") +
        ((c.acceptance && c.acceptance.length) || c.deliverable ? '<details class="spec"><summary>Acceptance criteria</summary>' +
          (c.deliverable ? '<div class="meta">Deliverable: ' + esc(c.deliverable) + "</div>" : "") +
          (c.acceptance && c.acceptance.length ? "<ul>" + c.acceptance.map(function (a) { return "<li>" + esc(a) + "</li>"; }).join("") + "</ul>" : "") + "</details>" : "") +
        '<div class="actions">' + action + "</div></article>";
    }).join("");
    // Module progress
    var mods = Object.keys(MODULES).map(function (k) {
      var l = list.filter(function (c) { return c.module === k; }), d = l.filter(function (c) { return c.status === "done"; }).length;
      return { k: k, n: l.length, d: d };
    }).filter(function (m) { return m.n; });
    // Leaderboard from completed live contracts
    var pts = {};
    list.forEach(function (c) { if (c.status === "done") (c.by || []).forEach(function (u) { pts[u] = pts[u] || { n: 0 }; pts[u].n++; }); });
    var ops = Object.keys(pts).sort(function (a, b) { return pts[b].n - pts[a].n || a.localeCompare(b); });
    var opt = function (val, cur, txt) { return '<option value="' + val + '"' + (cur === val ? " selected" : "") + ">" + txt + "</option>"; };
    $("#vb").innerHTML =
      '<div class="tabs" role="tablist">' + [["board", "Contract board"], ["how", "How it works"], ["ranks", "Contractor ranks"]].map(function (t) {
        return '<button role="tab" data-tab="' + t[0] + '" aria-selected="' + (conTab === t[0]) + '">' + t[1] + "</button>";
      }).join("") + "</div>" +
      '<div id="ctab"></div>';
    var tabHtml = {
      board:
        (live ? "" : '<p class="note">This is the plan. Version 0.1 is being built by the project lead, and contracts open to the Contractor Department after 0.1. Testers are welcome now: join the Discord.</p>') +
        '<div class="stats">' + (live
          ? '<div class="stat"><b>' + counts.open + '</b><span>Open</span></div><div class="stat"><b>' + counts.claimed + '</b><span>Claimed</span></div><div class="stat"><b>' + counts.review + '</b><span>In review</span></div><div class="stat"><b>' + counts.done + "</b><span>Done</span></div>"
          : '<div class="stat"><b>' + counts.planned + '</b><span>Planned</span></div><div class="stat"><b>' + mods.length + '</b><span>Modules</span></div><div class="stat"><b>' + counts.done + '</b><span>Done</span></div>') + "</div>" +
        '<div class="diffs">' + DIFF_ORDER.map(function (k) {
          var d = DIFF[k], n2 = list.filter(function (c) { return c.difficulty === k; }).length;
          return '<button class="diffcard ' + k + (conState.diff === k ? " sel" : "") + '" data-diff="' + k + '" aria-pressed="' + (conState.diff === k) + '"><span class="dc-h"><b>' + d[0] + "</b><i>" + plural(n2, "contract") + "</i></span>" +
            '<span class="dc-who">Who can claim it: ' + d[1] + '</span><span class="dc-what">' + d[2] + "</span></button>";
        }).join("") + "</div>" +
        '<p class="sub diffnote"><span class="pill diff core">Core</span> ' + esc(CORE_NOTE) + " Click a difficulty to filter.</p>" +
        '<div class="toolbar"><input class="field grow" id="cq" type="search" placeholder="Search contracts" value="' + esc(conState.q) + '" aria-label="Search contracts">' +
        '<select class="field" id="cm" aria-label="Module">' + opt("all", conState.module, "All modules") + Object.keys(MODULES).map(function (k) { return opt(k, conState.module, MODULES[k]); }).join("") + "</select>" +
        '<select class="field" id="cs" aria-label="Status">' + opt("all", conState.status, "All statuses") + (live ? opt("open", conState.status, "Open") + opt("claimed", conState.status, "Claimed") + opt("review", conState.status, "In review") + opt("done", conState.status, "Done") : opt("planned", conState.status, "Planned")) + "</select>" +
        '<select class="field" id="cz" aria-label="Difficulty">' + opt("all", conState.diff, "All difficulties") + DIFF_ORDER.map(function (k) { return opt(k, conState.diff, DIFF[k][0]); }).join("") + "</select></div>" +
        (board ? '<div class="cards' + (cardsAnim ? " anim" : "") + '">' + board + "</div>" : '<div class="empty">No contracts match<small>Change the filters.</small></div>') +
        '<p class="source">Source: ' + (live ? "GitHub issues labeled contract, live" : data.issues === null ? "data/contracts.json · GitHub could not be reached" : "data/contracts.json") + "</p>",
      how:
        '<div class="cols"><div class="panel"><div class="label">Taking a contract</div><ol class="steps">' +
        "<li>Pick an open contract your rank allows. Start with an <b class=\"tint easy\">Easy</b> one.</li><li>Comment on the GitHub issue to claim it. A maintainer assigns you.</li><li>Do the work on a branch in your fork. Sign off every commit.</li><li>Open a pull request that says Closes #number.</li><li><b class=\"tint key\">Quality</b> checks it against the acceptance criteria and merges it. You get a <b class=\"tint key\">signed record</b> and move up in rank.</li></ol></div>" +
        '<div class="panel"><div class="label">Rules</div><ol class="steps">' +
        "<li>Pull requests only. Nobody pushes to main.</li><li>No game files and no code copied from other mods.</li><li>AI tools are welcome. You review and own what you submit.</li><li>Nothing that touches Konami's servers or anti-cheat.</li><li>Leaving is fine. Post a short handoff note first.</li></ol></div></div>" +
        '<div class="toolbar" style="margin-top:14px"><a class="btn primary" href="#/guides/hp-gde-003">Quick start</a><a class="btn" href="#/guides/hp-pol-002">AI Use Policy</a><a class="btn" href="' + repoUrl("/fork") + '" target="_blank" rel="noopener noreferrer">Fork on GitHub</a><a class="btn" href="' + repoUrl("/issues?q=is%3Aopen+label%3Acontract") + '" target="_blank" rel="noopener noreferrer">Contracts on GitHub</a></div>' +
        '<div class="label">Module progress</div><div class="cols">' + mods.map(function (m) {
          return '<div class="panel"><div class="kv"><span>' + esc(MODULES[m.k]) + "</span><b>" + m.d + " / " + m.n + '</b></div><div class="meter"><i style="width:' + Math.round(m.d / m.n * 100) + '%"></i></div></div>';
        }).join("") + "</div>",
      ranks:
        '<p class="sub">Contractors are ranked like Mother Base staff, by the number of completed contracts. Each one also earns a <a href="#/verify">signed contributor record</a>.</p>' +
        '<div class="ranks">' + RANKS.slice(1).map(function (r, k) { return '<div class="rank" style="--i:' + k + '"><b class="r-grade">' + esc(r[0]) + '</b><span class="r-n">' + r[1] + " contract" + (r[1] === 1 ? "" : "s") + '</span><span class="r-u">' + tint(r[2]) + "</span></div>"; }).join("") + "</div>" +
        '<div class="label">Contract difficulty</div>' +
        '<div class="tw"><table><tr><th>Difficulty</th><th>Who can claim it</th><th>What makes it this hard</th></tr>' + DIFF_ORDER.map(function (k) { return '<tr><td><span class="pill diff ' + k + '">' + DIFF[k][0] + "</span></td><td>" + DIFF[k][1] + "</td><td>" + DIFF[k][2] + "</td></tr>"; }).join("") +
        '<tr><td><span class="pill diff core">Core</span></td><td>Development Department</td><td>Any difficulty, on the 0.1 critical path.</td></tr></table></div>' +
        '<div class="label">Contractors</div>' +
        (ops.length ? '<div class="tw"><table><tr><th>Contractor</th><th>Contracts</th><th>Rank</th></tr>' + ops.map(function (u) {
          return '<tr><td><a href="https://github.com/' + encodeURIComponent(u) + '" target="_blank" rel="noopener noreferrer">' + esc(u) + '</a></td><td class="num">' + pts[u].n + "</td><td>" + esc(rankFor(pts[u].n)[0]) + "</td></tr>";
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
      $$("[data-diff]").forEach(function (b) { b.addEventListener("click", function () { conState.diff = conState.diff === b.dataset.diff ? "all" : b.dataset.diff; drawContribute(); }); });
    }
  }
  var conTab = "board", cardsAnim = true;
