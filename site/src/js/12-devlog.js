  /* Dev log */
  var logFilter = "all";
  function devlogEntries() {
    var out = [];
    ((data.devlog && data.devlog.entries) || []).forEach(function (e) { out.push(Object.assign({ kind: "note" }, e)); });
    (data.commits || []).forEach(function (c) { out.push(Object.assign({ kind: "commit" }, c)); });
    (data.releases || []).forEach(function (r) { out.push({ kind: "release", tag: isPlayable(r) ? "Release" : "Foundation", date: r.published_at, title: (r.name || r.tag_name), url: r.html_url }); });
    return out.sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });
  }
  function viewDevlog() {
    var v = $("#view");
    v.innerHTML = shell("Intel", "Dev Log", loading("Loading the dev log"));
    Promise.all([loadLocal("devlog"), loadCommits(), loadReleases()]).then(function () { if (currentView === "devlog") drawDevlog(); refreshInfo(); });
  }
  function drawDevlog() {
    var all = devlogEntries(), list = all.filter(function (e) { return logFilter === "all" || e.kind === logFilter; }), groups = [], by = {};
    list.forEach(function (e) { var d = fmtDate(e.date); if (!by[d]) { by[d] = []; groups.push(d); } by[d].push(e); });
    var count = function (k) { return all.filter(function (e) { return e.kind === k; }).length; };
    $("#vb").innerHTML = '<div class="tabs" role="tablist">' + [["all", "All", all.length], ["note", "Notes", count("note")], ["commit", "Commits", count("commit")], ["release", "Releases", count("release")]].map(function (t) {
      return '<button role="tab" data-lf="' + t[0] + '" aria-selected="' + (logFilter === t[0]) + '">' + t[1] + '<span class="count">' + t[2] + "</span></button>";
    }).join("") + "</div>" +
      (groups.length ? groups.map(function (g) {
        return '<section class="day"><div class="day-d">' + esc(g) + "</div>" + by[g].map(function (e) {
          var title = e.url ? '<a href="' + esc(e.url) + '" target="_blank" rel="noopener noreferrer">' + esc(e.title) + "</a>" : esc(e.title);
          return '<article class="entry"><span class="pill ' + (e.kind === "release" ? "ok" : e.kind === "note" ? "hot" : "") + '">' + esc(e.tag || e.kind) + "</span><div><h3>" + title + "</h3>" +
            (e.body ? "<p>" + esc(e.body) + "</p>" : "") + (e.by ? '<div class="meta">' + esc(e.by) + "</div>" : "") + "</div></article>";
        }).join("") + "</section>";
      }).join("") : '<div class="empty">No entries<small>' + (logFilter === "commit" && data.commits === null ? "GitHub could not be reached." : "Nothing logged here yet.") + "</small></div>") +
      '<p class="source">Sources: data/devlog.json' + (data.commits ? " · commits on " + esc(cfg.branch) : "") + (data.releases && data.releases.length ? " · releases" : "") + (data.commits === null ? " · GitHub unreachable" : "") + "</p>";
    $$("[data-lf]").forEach(function (b) { b.addEventListener("click", function () { logFilter = b.dataset.lf; drawDevlog(); }); });
  }
