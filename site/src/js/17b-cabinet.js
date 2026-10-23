  /* ---------------- Docs: dossier cabinet ----------------
     Every library group is a drawer, every document a case file. Opening a file lays it on the desk beside the cabinet:
     a typed page clipped into a kraft folder, coloured by its group. Guides look like printed A4 handbook sheets;
     documents look like case files. Search (Ctrl+K or /) matches titles at once and the full text from three letters. */
  var CAB_GROUPS = {
    Handbook: ["HB", "#c9a24a", "#7d5f15"], Decisions: ["ADR", "#e0453f", "#a3352b"], Research: ["RES", "#5aa7d6", "#1d6a8a"],
    Technical: ["TEC", "#f28c28", "#a8560f"], Community: ["COM", "#7fbf8a", "#3b7446"], Project: ["PRJ", "#c9d0d2", "#4d5a60"], Legal: ["LEG", "#b07cd6", "#6e4a96"]
  };
  var CAB_ORDER = ["Project", "Handbook", "Decisions", "Research", "Technical", "Community", "Legal"];
  var cabOpen = {}, cabQ = "", cabTimer, cabJump = false;
  function docsMode() { return store.get("jo-docs-mode", "cabinet") === "classic" ? "classic" : "cabinet"; }
  function setDocsMode(m) { store.set("jo-docs-mode", m); }
  function cabGroup(g) { return CAB_GROUPS[g] || ["DOC", "#c9d0d2", "#4d5a60"]; }
  /* File number and plain title: HP-POL-009, ADR-0012, or the group prefix and position */
  function cabCode(d, docs) {
    var m = /^(HP-[A-Z]{3}-\d{3})\s+(.*)$/.exec(d.title);
    if (m) return [m[1], m[2]];
    m = /^(\d{4})\s+(.*)$/.exec(d.title);
    if (m) return ["ADR-" + m[1], m[2]];
    var same = docs.filter(function (x) { return x.group === d.group; }), n = same.indexOf(d) + 1;
    return [cabGroup(d.group)[0] + "-" + (n < 10 ? "0" : "") + n, d.title];
  }
  function cabKind(code) { return /-POL-/.test(code) ? "Policy" : /-SOP-/.test(code) ? "Procedure" : /-GDE-/.test(code) ? "Guide" : /^ADR-/.test(code) ? "Decision record" : "Case file"; }

  function viewCabinet(id) {
    var v = $("#view");
    if (!$("#cab")) v.innerHTML = shell("Library", "Docs", loading("Opening the cabinet"));
    loadLocal("docs").then(function (man) {
      if (currentView !== "docs") return;
      var docs = (man && man.docs) || [];
      if (!docs.length) { $("#vb").innerHTML = '<div class="empty">No documents<small>data/docs.json could not be loaded.</small></div>'; return; }
      var doc = docs.filter(function (d) { return d.id === id; })[0] || docs[0];
      if (!(doc.group in cabOpen)) cabOpen[doc.group] = true;
      if (!$("#cab")) {
        $("#vb").innerHTML = '<div class="cab" id="cab"><div class="cab-side">' +
          '<div class="cab-tools"><label class="cab-q"><span aria-hidden="true">⌕</span><input id="cq" type="search" placeholder="Search all files" aria-label="Search all files" autocomplete="off"><kbd>Ctrl K</kbd></label>' +
          '<button class="btn small" id="toClassic" title="Switch to the classic list">Classic list</button></div>' +
          '<div id="cabHits" aria-live="polite"></div><div class="cab-drawers" id="cabDrawers"></div></div>' +
          '<article class="dossier" id="docBody" tabindex="-1"></article></div>';
        $("#toClassic").addEventListener("click", function () { setDocsMode("classic"); $("#view").innerHTML = ""; viewDocs(doc.id); });
        $("#cq").value = cabQ;
        $("#cq").addEventListener("input", function (e) { cabQ = e.target.value; drawDrawers(docs); clearTimeout(cabTimer); cabTimer = setTimeout(function () { cabSearch(docs); }, 200); });
      }
      drawDrawers(docs, doc.id);
      openDossier(doc, docs);
      if (cabQ) cabSearch(docs);
    });
  }
  function drawDrawers(docs, active) {
    active = active || (($(".fold.on") || {}).getAttribute ? $(".fold.on").getAttribute("data-id") : "");
    var q = cabQ.trim().toLowerCase(), by = {};
    docs.forEach(function (d) { (by[d.group] = by[d.group] || []).push(d); });
    var groups = CAB_ORDER.filter(function (g) { return by[g]; }).concat(Object.keys(by).filter(function (g) { return CAB_ORDER.indexOf(g) < 0; }));
    $("#cabDrawers").innerHTML = groups.map(function (g) {
      var gc = cabGroup(g), list = by[g].filter(function (d) { return !q || d.title.toLowerCase().indexOf(q) > -1; });
      if (q && !list.length) return "";
      var open = q ? true : !!cabOpen[g];
      return '<section class="drawer' + (open ? " open" : "") + '" style="--g:' + gc[1] + '">' +
        '<button class="dr-head" data-g="' + esc(g) + '" aria-expanded="' + open + '"><span class="dr-handle" aria-hidden="true"></span><b>' + esc(g) + "</b><small>" + plural(list.length, "file") + '</small><i aria-hidden="true">' + (open ? "▾" : "▸") + "</i></button>" +
        '<div class="dr-files">' + list.map(function (d, n) {
          var c = cabCode(d, docs);
          return '<a class="fold' + (d.id === active ? " on" : "") + '" data-id="' + esc(d.id) + '" href="#/docs/' + esc(d.id) + '" style="--k:' + n + "; --tx:" + ((n % 3) * 30) + 'px"><span class="f-tab">' + esc(c[0]) + "</span><span class=\"f-t\">" + esc(c[1]) + "</span></a>";
        }).join("") + "</div></section>";
    }).join("") || '<div class="empty">No file titles match<small>Full-text results show above when there are any.</small></div>';
    $$(".fold").forEach(function (f) { f.addEventListener("click", function () { cabJump = true; }); });
    $$(".dr-head").forEach(function (b) {
      b.addEventListener("click", function () { var g = b.getAttribute("data-g"); cabOpen[g] = !b.parentNode.classList.contains("open"); if (cabQ) return; drawDrawers(docs); blip(); });
    });
  }
  function openDossier(doc, docs) {
    var body = $("#docBody"), gc = cabGroup(doc.group), c = cabCode(doc, docs), kind = cabKind(c[0]);
    $$(".fold").forEach(function (f) { f.classList.toggle("on", f.getAttribute("data-id") === doc.id); });
    body.style.setProperty("--g", gc[1]); body.style.setProperty("--gd", gc[2]);
    body.innerHTML = loading("Pulling " + c[0]);
    loadDoc(doc).then(function (md) {
      if (currentView !== "docs") return;
      var html = markdown(md.replace(/^# .*\n/, "").replace(/^Code: .*\n/, ""), doc.path);
      var url = (cfg.siteUrl || "https://hound-protocol.github.io/Joint-Operations/") + "#/docs/" + doc.id;
      body.innerHTML =
        '<div class="ds-tab"><b>' + esc(c[0]) + "</b>" + esc(doc.group) + "</div>" +
        '<div class="ds-folder"><div class="ds-page">' +
          '<span class="ds-clip" aria-hidden="true"></span><span class="ds-holes" aria-hidden="true"></span>' +
          '<header class="ds-head"><span><img src="assets/brand/hound-protocol-mark-light.svg" alt="" width="20" height="20">Hound Protocol · ' + esc(kind) + '</span><span class="ds-no">File ' + esc(c[0]) + "</span></header>" +
          '<div class="ds-stamp" aria-hidden="true">' + (doc.group === "Legal" ? "Legal" : "Public") + "</div>" +
          '<h1 class="ds-title">' + esc(c[1]) + "</h1>" +
          '<div class="ds-meta"><span>' + esc(doc.group) + " · " + esc(doc.path) + "</span>" +
            '<a href="' + repoUrl("/blob/" + cfg.branch + "/" + doc.path) + '" target="_blank" rel="noopener noreferrer">GitHub</a>' +
            '<a href="' + repoUrl("/edit/" + cfg.branch + "/" + doc.path) + '" target="_blank" rel="noopener noreferrer">Suggest an edit</a>' +
            (/^HP-/.test(c[0]) ? '<a href="#/guides/' + esc(doc.id) + '">Printable sheet</a>' : "") +
            '<button type="button" class="ds-link" data-url="' + esc(url) + '">Copy link</button></div>' +
          '<div class="sh-body ds-body">' + html + "</div>" +
          '<footer class="ds-foot"><span>File ' + esc(c[0]) + " · " + esc(doc.path) + "</span><span>Read live from the repository</span></footer>" +
        "</div></div>";
      body.classList.remove("in"); void body.offsetWidth; body.classList.add("in");
      var cl = $(".ds-link", body);
      cl.addEventListener("click", function () {
        var u = cl.getAttribute("data-url");
        (navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(u) : Promise.reject()).then(function () { cl.textContent = "Copied"; status("Link copied"); }, function () { cl.textContent = u; });
      });
      led($("#ledInfo"), doc.title);
      if (cabJump && window.innerWidth <= 900 && body.scrollIntoView) body.scrollIntoView({ behavior: opts.motion ? "smooth" : "auto", block: "start" });
      cabJump = false;
    }, function () {
      if (currentView !== "docs") return;
      body.innerHTML = '<div class="empty">Could not pull this file<small><a href="' + repoUrl("/blob/" + cfg.branch + "/" + doc.path) + '" target="_blank" rel="noopener noreferrer">Open it on GitHub</a></small></div>';
    });
  }
  /* Full text: from three letters, every file is searched and the best matches listed above the drawers */
  function cabSearch(docs) {
    var out = $("#cabHits"), q = cabQ.trim();
    if (!out) return;
    if (q.length < 3) { out.innerHTML = ""; return; }
    Promise.all(docs.map(function (d) { return loadDoc(d).then(function (t) { return [d, t]; }, function () { return [d, ""]; }); })).then(function (all) {
      if (currentView !== "docs" || cabQ.trim() !== q) return;
      var ql = q.toLowerCase(), hits = [];
      all.forEach(function (p) {
        var text = p[1].replace(/[#*`|>\[\]()_-]+/g, " ").replace(/\s+/g, " "), low = text.toLowerCase(), i = low.indexOf(ql), n = 0, j = i;
        while (j > -1) { n++; j = low.indexOf(ql, j + ql.length); }
        if (n) { var a = Math.max(0, i - 50); hits.push({ d: p[0], n: n, snip: (a ? "…" : "") + text.slice(a, i + ql.length + 70) + "…" }); }
      });
      hits.sort(function (x, y) { return y.n - x.n; });
      var re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "ig");
      out.innerHTML = '<div class="cab-hits"><div class="label">Inside files · ' + plural(hits.length, "match", "matches") + "</div>" + (hits.length ? hits.slice(0, 8).map(function (h) {
        var c = cabCode(h.d, docs);
        return '<a href="#/docs/' + esc(h.d.id) + '" style="--g:' + cabGroup(h.d.group)[1] + '"><b>' + esc(c[0]) + "</b> " + esc(c[1]) + "<small>" + esc(h.snip).replace(re, function (m) { return "<mark>" + m + "</mark>"; }) + "</small></a>";
      }).join("") : '<p class="sub">Nothing inside the files mentions "' + esc(q) + '".</p>') + "</div>";
    });
  }
  /* Ctrl+K or / jumps to the search on the Docs page */
  document.addEventListener("keydown", function (e) {
    if (currentView !== "docs" || docsMode() !== "cabinet") return;
    var tag = (e.target && e.target.tagName) || "", q = $("#cq");
    if (!q) return;
    if (((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) || (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(tag))) { e.preventDefault(); q.focus(); q.select(); }
  });
