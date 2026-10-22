  /* Documentation */
  var docFilter = "", searchTimer, docBodyBackup = null;
  /* Full-text search across all documents; results replace the article until the query is cleared */
  function searchDocs(docs, q) {
    var body = $("#docBody"); if (!body) return;
    q = q.trim();
    if (q.length < 3) { if (docBodyBackup !== null) { body.innerHTML = docBodyBackup; docBodyBackup = null; } return; }
    if (docBodyBackup === null) docBodyBackup = body.innerHTML;
    Promise.all(docs.map(function (d) { return loadDoc(d).then(function (t) { return [d, t]; }, function () { return [d, ""]; }); })).then(function (all) {
      if (currentView !== "docs" || docFilter.trim() !== q) return;
      var ql = q.toLowerCase(), hits = [];
      all.forEach(function (pair) {
        var text = pair[1].replace(/[#*`|>\[\]()_-]+/g, " ").replace(/\s+/g, " "), i = text.toLowerCase().indexOf(ql), n = 0, j = i;
        while (j > -1) { n++; j = text.toLowerCase().indexOf(ql, j + ql.length); }
        if (i > -1 || pair[0].title.toLowerCase().indexOf(ql) > -1) {
          var a = Math.max(0, i - 60), snip = i > -1 ? (a ? "…" : "") + text.slice(a, i + ql.length + 90) + "…" : "";
          hits.push({ d: pair[0], n: n, snip: snip });
        }
      });
      hits.sort(function (x, y) { return y.n - x.n; });
      var re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "ig");
      body.innerHTML = '<div class="meta-line"><span>Search · ' + plural(hits.length, "document") + ' match "' + esc(q) + '"</span></div>' +
        (hits.length ? '<ol class="hits">' + hits.map(function (h) {
          return '<li><a href="#/docs/' + esc(h.d.id) + '">' + esc(h.d.title) + '</a><span class="pill">' + esc(h.d.group) + "</span>" + (h.n ? '<span class="cnt">' + plural(h.n, "match", "matches") + "</span>" : "") +
            (h.snip ? "<p>" + esc(h.snip).replace(re, function (m) { return "<mark>" + m + "</mark>"; }) + "</p>" : "") + "</li>";
        }).join("") + "</ol>" : '<div class="empty">No matches<small>Try a different word.</small></div>');
    });
  }
  function viewDocs(id) {
    var v = $("#view");
    if (!$("#docNav")) v.innerHTML = shell("Library", "Documentation", loading("Loading the library"));
    loadLocal("docs").then(function (man) {
      if (currentView !== "docs") return;
      var docs = (man && man.docs) || [];
      if (!docs.length) { $("#vb").innerHTML = '<div class="empty">No documents<small>data/docs.json could not be loaded.</small></div>'; return; }
      var doc = docs.filter(function (d) { return d.id === id; })[0] || docs[0];
      if (!$("#docNav")) {
        $("#vb").innerHTML = '<div class="docs"><nav class="doc-nav" id="docNav" aria-label="Documents"></nav><article class="doc" id="docBody"></article></div>';
      }
      drawDocNav(docs, doc.id);
      var body = $("#docBody");
      docBodyBackup = null;
      body.innerHTML = loading("Loading " + doc.title);
      loadDoc(doc).then(function (md) {
        if (currentView !== "docs") return;
        body.style.animation = "none"; void body.offsetWidth; body.style.animation = "";
        body.innerHTML = '<div class="meta-line"><span>' + esc(doc.group) + " · " + esc(doc.path) + '</span><a href="' + repoUrl("/blob/" + cfg.branch + "/" + doc.path) + '" target="_blank" rel="noopener noreferrer">View on GitHub</a><a href="' + repoUrl("/edit/" + cfg.branch + "/" + doc.path) + '" target="_blank" rel="noopener noreferrer">Suggest an edit</a></div>' + markdown(md, doc.path);
        led($("#ledInfo"), doc.title);
      }, function () {
        if (currentView !== "docs") return;
        body.innerHTML = '<div class="empty">Could not load this document<small>Open it on GitHub instead.</small></div><div class="toolbar" style="justify-content:center;margin-top:12px"><a class="btn" href="' + repoUrl("/blob/" + cfg.branch + "/" + doc.path) + '" target="_blank" rel="noopener noreferrer">Open on GitHub</a></div>';
      });
    });
  }
  function drawDocNav(docs, active) {
    var groups = [], by = {};
    docs.forEach(function (d) { if (!by[d.group]) { by[d.group] = []; groups.push(d.group); } by[d.group].push(d); });
    var q = docFilter.toLowerCase(), cur = docs.filter(function (d) { return d.id === active; })[0];
    var html = '<button class="btn doc-toggle" id="dtog" aria-expanded="false" aria-controls="docNav">' + esc(cur ? cur.title : "Documents") + '<span aria-hidden="true">▾</span></button>' + '<input class="field" id="dq" type="search" placeholder="Search documents" value="' + esc(docFilter) + '" aria-label="Search documents">';
    groups.forEach(function (g) {
      var items = by[g].filter(function (d) { return !q || q.length >= 3 || d.title.toLowerCase().indexOf(q) > -1; });
      if (!items.length) return;
      html += '<div class="grp">' + esc(g) + "</div>" + items.map(function (d) {
        return '<a href="#/docs/' + esc(d.id) + '"' + (d.id === active ? ' aria-current="true"' : "") + ">" + esc(d.title) + "</a>";
      }).join("");
    });
    var nav = $("#docNav"); nav.innerHTML = html;
    $("#dtog").addEventListener("click", function () { var open = nav.classList.toggle("open"); this.setAttribute("aria-expanded", String(open)); });
    $("#dq").addEventListener("input", function (e) {
      docFilter = e.target.value; var p = e.target.selectionStart; drawDocNav(docs, active);
      var n = $("#dq"); n.focus(); try { n.setSelectionRange(p, p); } catch (x) { /* ignore */ }
      clearTimeout(searchTimer); searchTimer = setTimeout(function () { searchDocs(docs, docFilter); }, 180);
    });
  }
  function loadDoc(doc) {
    if (docCache[doc.path]) return Promise.resolve(docCache[doc.path]);
    if (EMBED && EMBED.content && EMBED.content[doc.path] != null) return Promise.resolve(docCache[doc.path] = EMBED.content[doc.path]);
    var raw = "https://raw.githubusercontent.com/" + cfg.repo + "/" + cfg.branch + "/" + doc.path;
    return fetchText("content/" + doc.path).catch(function () { return fetchText(raw); }).then(function (t) { docCache[doc.path] = t; return t; });
  }
