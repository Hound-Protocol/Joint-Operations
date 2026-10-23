  /* Dev log */
  var logFilter = "all", logQ = "";
  function plainExcerpt(md, n) {
    var t = String(md || "").replace(/```[\s\S]*?```/g, " ").replace(/^#+\s.*$/gm, " ").replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/[*_`>#|-]+/g, " ").replace(/\s+/g, " ").trim();
    return t.length > n ? t.slice(0, n - 1).replace(/\s+\S*$/, "") + "…" : t;
  }
  function devlogEntries() {
    var out = [];
    ((data.devlog && data.devlog.entries) || []).forEach(function (e) { out.push(Object.assign({ kind: "note" }, e)); });
    /* Release merges are already listed as releases, so their commits are left out */
    var rel = (data.releases || []).map(function (r) { return r.tag_name; });
    (data.commits || []).forEach(function (c) { var m = /^Release (v[\d.]+)/.exec(c.title || ""); if (m && rel.indexOf(m[1]) > -1) return; out.push(Object.assign({ kind: "commit" }, c)); });
    (data.releases || []).forEach(function (r) {
      out.push({ kind: "release", tag: isPlayable(r) ? "Release" : "Foundation", date: r.published_at, title: (r.name || r.tag_name), url: r.html_url, body: plainExcerpt(r.body, 260), ver: r.tag_name });
    });
    return out.sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });
  }
  function viewDevlog() {
    var v = $("#view");
    v.innerHTML = shell("Documentation", "Dev Log", loading("Loading the dev log")); addZones("log");
    Promise.all([loadLocal("devlog"), loadCommits(), loadReleases(), loadRoadmap()]).then(function () { if (currentView === "devlog") drawDevlog(); refreshInfo(); });
  }
  function markQ(text) {
    var t = esc(text);
    if (!logQ) return t;
    var q = esc(logQ).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return t.replace(new RegExp("(" + q + ")", "ig"), "<mark>$1</mark>");
  }
  function drawDevlog() {
    var all = devlogEntries(), q = logQ.toLowerCase();
    var list = all.filter(function (e) {
      if (logFilter !== "all" && e.kind !== logFilter) return false;
      return !q || [e.title, e.body, e.tag, e.by, e.ver].join(" ").toLowerCase().indexOf(q) > -1;
    });
    var groups = [], by = {};
    list.forEach(function (e) { var d = fmtDate(e.date); if (!by[d]) { by[d] = []; groups.push(d); } by[d].push(e); });
    var count = function (k) { return all.filter(function (e) { return e.kind === k; }).length; };
    var rel = (data.releases || [])[0], ph = currentPhase(), last = all[0];
    var ctx = '<div class="log-ctx">' +
      '<div><span>Current build</span><b>' + esc(cfg.version) + "</b></div>" +
      '<div><span>Latest release</span><b>' + (rel ? esc(rel.tag_name) + " · " + fmtDate(rel.published_at) : "–") + "</b></div>" +
      '<div><span>Roadmap</span><b>' + (ph ? "Phase " + ph.n + " · " + ph.done + " of " + ph.total + " done" : "–") + "</b></div>" +
      '<div><span>Last update</span><b>' + (last ? fmtDate(last.date) : "–") + "</b></div></div>";
    $("#vb").innerHTML = ctx +
      '<div class="toolbar log-tools"><input class="field grow" id="lq" type="search" placeholder="Search notes, releases and commits" value="' + esc(logQ) + '" aria-label="Search the dev log"></div>' +
      '<div class="tabs" role="tablist">' + [["all", "All", all.length], ["note", "Notes", count("note")], ["release", "Releases", count("release")], ["commit", "Commits", count("commit")]].map(function (t) {
        return '<button role="tab" data-lf="' + t[0] + '" aria-selected="' + (logFilter === t[0]) + '">' + t[1] + '<span class="count">' + t[2] + "</span></button>";
      }).join("") + "</div>" +
      (q ? '<p class="sub">' + plural(list.length, "result") + " for “" + esc(logQ) + "”</p>" : "") +
      (groups.length ? groups.map(function (g) {
        return '<section class="day"><div class="day-d">' + esc(g) + "</div>" + by[g].map(function (e) {
          var title = e.url ? '<a href="' + esc(e.url) + '" target="_blank" rel="noopener noreferrer">' + markQ(e.title) + "</a>" : markQ(e.title);
          var kindTxt = { note: "Team note", release: e.tag === "Release" ? "Playable release" : "Foundation release", commit: "Change on " + cfg.branch }[e.kind] || "";
          return '<article class="entry k-' + e.kind + '"><span class="pill ' + (e.kind === "release" ? "ok" : e.kind === "note" ? "hot" : "") + '">' + esc(e.tag || e.kind) + "</span><div><h3>" + title + "</h3>" +
            (e.body ? "<p>" + markQ(e.body) + "</p>" : "") +
            '<div class="meta">' + esc(kindTxt) + (e.by ? " · " + markQ(e.by) : "") + "</div></div></article>";
        }).join("") + "</section>";
      }).join("") : '<div class="empty">No entries<small>' + (q ? "Nothing matches that search." : logFilter === "commit" && data.commits === null ? "GitHub could not be reached." : "Nothing logged here yet.") + "</small></div>") +
      '<p class="source">Sources: data/devlog.json' + (data.commits ? " · commits on " + esc(cfg.branch) : "") + (data.releases && data.releases.length ? " · releases" : "") + (data.commits === null ? " · GitHub unreachable" : "") + "</p>";
    $$("[data-lf]").forEach(function (b) { b.addEventListener("click", function () { logFilter = b.dataset.lf; drawDevlog(); }); });
    var t = 0;
    $("#lq").addEventListener("input", function (e) {
      clearTimeout(t); var val = e.target.value;
      t = setTimeout(function () { logQ = val.trim(); var pos = $("#lq").selectionStart; drawDevlog(); var n = $("#lq"); n.focus(); try { n.setSelectionRange(pos, pos); } catch (x) { /* older browsers */ } }, 160);
    });
  }
