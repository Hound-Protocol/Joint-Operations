  /* ---------------- Docs: dossier cabinet ----------------
     Every library group is a drawer of folders. Opening a folder lays the document on the desk beside the cabinet:
     a typed page clipped into a kraft folder, with paper and colour that show its class (policy, procedure, guide,
     decision record, research, technical, community, project, legal).
     Search (Ctrl+K or /): every word must match; titles and file numbers count most, then headings, then the text.
     Arrow keys move through the results, Enter opens one, and the opened page highlights and scrolls to the match. */
  var CAB_GROUPS = {
    Handbook: ["HB", "#c9a24a", "#7d5f15"], Decisions: ["ADR", "#e0453f", "#a3352b"], Research: ["RES", "#5aa7d6", "#1d6a8a"],
    Technical: ["TEC", "#f28c28", "#a8560f"], Community: ["COM", "#7fbf8a", "#3b7446"], Project: ["PRJ", "#c9d0d2", "#4d5a60"], Legal: ["LEG", "#b07cd6", "#6e4a96"]
  };
  var CAB_CLASS = { Decisions: ["decision", "Decision record"], Research: ["research", "Research"], Technical: ["technical", "Technical"],
    Community: ["community", "Community"], Project: ["project", "Project"], Legal: ["legal", "Legal"] };
  var CAB_ORDER = ["Project", "Handbook", "Decisions", "Research", "Technical", "Community", "Legal"];
  var cabOpen = {}, cabQ = "", cabTimer, cabJump = false, cabHL = null, cabIdx = null, cabSel = 0, cabRes = [];
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
  /* The document's class: the handbook type from its code, otherwise its library group */
  function cabClass(d, code) {
    if (/-POL-/.test(code)) return ["policy", "Policy"];
    if (/-SOP-/.test(code)) return ["procedure", "Procedure"];
    if (/-GDE-/.test(code)) return ["guide", "Guide"];
    return CAB_CLASS[d.group] || ["project", d.group];
  }

  function viewCabinet(id) {
    var v = $("#view");
    if (!$("#cab")) { v.innerHTML = shell("Documentation", "Library", loading("Opening the cabinet")); addZones("lib"); }
    Promise.all([loadLocal("docs"), loadLocal("guides")]).then(function (res) {
      if (currentView !== "docs") return;
      var man = res[0], all = (man && man.docs) || [], docs = all;
      var zn = $(".zones"); if (zn) zn.outerHTML = docZones("lib");
      if (!docs.length) { $("#vb").innerHTML = '<div class="empty">No documents<small>data/docs.json could not be loaded.</small></div>'; return; }
      var doc = docs.filter(function (d) { return d.id === id; })[0];
      /* Handbook documents live in the Handbook zone */
      if (doc && doc.group === "Handbook") { location.replace("#/guides/" + doc.id); return; }
      doc = doc || docs.filter(function (d) { return d.group !== "Handbook"; })[0];
      if (!(doc.group in cabOpen)) cabOpen[doc.group] = true;
      if (!$("#cab")) {
        $("#vb").innerHTML = '<div class="cab" id="cab"><div class="cab-side">' +
          '<label class="cab-q"><span aria-hidden="true">⌕</span><input id="cq" type="search" placeholder="Search titles, numbers and text" aria-label="Search all documents" aria-controls="cabHits" autocomplete="off" spellcheck="false"><kbd>Ctrl K</kbd></label>' +
          '<div id="cabHits" aria-live="polite"></div><div class="cab-drawers" id="cabDrawers"></div></div>' +
          '<article class="dossier" id="docBody" tabindex="-1"></article></div>';
        var q = $("#cq");
        q.value = cabQ;
        q.addEventListener("input", function () { cabQ = q.value; cabSel = 0; $("#cab").classList.toggle("searching", !!cabQ.trim()); drawDrawers(docs); clearTimeout(cabTimer); cabTimer = setTimeout(function () { cabSearch(docs); }, 120); });
        q.addEventListener("keydown", function (e) {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") { if (!cabRes.length) return; e.preventDefault(); cabSel = (cabSel + (e.key === "ArrowDown" ? 1 : -1) + cabRes.length) % cabRes.length; cabMark(); }
          else if (e.key === "Enter") { var h = cabRes[cabSel]; if (h) { e.preventDefault(); cabGo(h); } }
          else if (e.key === "Escape" && q.value) { e.preventDefault(); e.stopPropagation(); q.value = ""; cabQ = ""; $("#cab").classList.remove("searching"); drawDrawers(docs); cabSearch(docs); }
        });
      }
      drawDrawers(docs, doc.id);
      openDossier(doc, docs);
      if (cabQ) cabSearch(docs);
    });
  }
  /* Query words, lightly stemmed so "appeals" finds "appeal" and "signing" finds "sign" */
  function cabWords() { return cabQ.trim().toLowerCase().split(/\s+/).filter(Boolean).map(function (w) { var s = w.replace(/(ing|ed|es|s)$/, ""); return s.length >= 3 ? s : w; }); }
  function cabRe(words) { return new RegExp("(" + words.map(function (w) { return w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }).join("|") + ")[a-z]*", "ig"); }
  /* A word matches a file number by prefix or by number: "pol 9" finds HP-POL-009, "12" finds ADR-0012 */
  function cabCodeHit(w, code) {
    return code.toLowerCase().split("-").some(function (s) { return s.indexOf(w) === 0 || (/^\d+$/.test(w) && /^\d+$/.test(s) && +s === +w); });
  }
  function cabTitleHit(words, d, code) {
    var t = (code[0] + " " + code[1] + " " + d.group).toLowerCase();
    return words.every(function (w) { return t.indexOf(w) > -1 || cabCodeHit(w, code[0]); });
  }
  function drawDrawers(docs, active) {
    var on = $(".fold.on");
    active = active || (on ? on.getAttribute("data-id") : "");
    var words = cabWords(), by = {};
    docs.forEach(function (d) { (by[d.group] = by[d.group] || []).push(d); });
    delete by.Handbook;
    var groups = CAB_ORDER.filter(function (g) { return by[g]; }).concat(Object.keys(by).filter(function (g) { return CAB_ORDER.indexOf(g) < 0; }));
    $("#cabDrawers").innerHTML = groups.map(function (g) {
      var gc = cabGroup(g), list = by[g].filter(function (d) { return !words.length || cabTitleHit(words, d, cabCode(d, docs)); });
      if (words.length && !list.length) return "";
      var open = words.length ? true : !!cabOpen[g];
      return '<section class="drawer' + (open ? " open" : "") + '" style="--g:' + gc[1] + '">' +
        '<button class="dr-head" data-g="' + esc(g) + '" aria-expanded="' + open + '"><span class="dr-handle" aria-hidden="true"></span><b>' + esc(g) + "</b><small>" + plural(list.length, "file") + '</small><i aria-hidden="true"></i></button>' +
        '<div class="dr-files">' + list.map(function (d, n) {
          var c = cabCode(d, docs);
          return '<a class="fold' + (d.id === active ? " on" : "") + '" data-id="' + esc(d.id) + '" href="#/docs/' + esc(d.id) + '" style="--k:' + n + "; --tx:" + ((n % 3) * 30) + 'px"><span class="f-tab">' + esc(c[0]) + '</span><span class="f-t">' + esc(c[1]) + "</span></a>";
        }).join("") + "</div></section>";
    }).join("");
    $$(".fold").forEach(function (f) { f.addEventListener("click", function () { cabJump = true; cabHL = null; }); });
    /* Open and close in place, so only that drawer's folders slide in */
    $$(".dr-head").forEach(function (b) {
      b.addEventListener("click", function () {
        if (cabWords().length) return;
        var s = b.parentNode, open = !s.classList.contains("open");
        s.classList.toggle("open", open); b.setAttribute("aria-expanded", String(open)); cabOpen[b.getAttribute("data-g")] = open; blip();
      });
    });
  }
  function openDossier(doc, docs) {
    var body = $("#docBody"), gc = cabGroup(doc.group), c = cabCode(doc, docs), k = cabClass(doc, c[0]);
    $$(".fold").forEach(function (f) { f.classList.toggle("on", f.getAttribute("data-id") === doc.id); });
    body.style.setProperty("--g", gc[1]); body.style.setProperty("--gd", gc[2]);
    body.className = "dossier k-" + k[0];
    body.innerHTML = loading("Opening " + c[0]);
    loadDoc(doc).then(function (md) {
      if (currentView !== "docs") return;
      var html = markdown(md.replace(/^# .*\n/, "").replace(/^Code: .*\n/, ""), doc.path);
      var url = (cfg.siteUrl || "https://hound-protocol.github.io/Joint-Operations/") + "#/docs/" + doc.id;
      body.innerHTML =
        '<div class="ds-tab"><b>' + esc(c[0]) + "</b>" + esc(doc.group) + "</div>" +
        '<div class="ds-folder"><div class="ds-page">' +
          '<span class="ds-clip" aria-hidden="true"></span><span class="ds-holes" aria-hidden="true"></span>' +
          '<header class="ds-head"><span><img src="assets/brand/hound-protocol-mark-light.svg" alt="" width="20" height="20">Hound Protocol</span><span class="ds-class">Class: ' + esc(k[1]) + "</span></header>" +
          '<h1 class="ds-title">' + esc(c[1]) + "</h1>" +
          '<div class="ds-meta"><span>' + esc(c[0]) + " · " + esc(doc.path) + "</span>" +
            '<a href="' + repoUrl("/blob/" + cfg.branch + "/" + doc.path) + '" target="_blank" rel="noopener noreferrer">GitHub</a>' +
            '<a href="' + repoUrl("/edit/" + cfg.branch + "/" + doc.path) + '" target="_blank" rel="noopener noreferrer">Suggest an edit</a>' +
            (/^HP-/.test(c[0]) ? '<a href="#/guides/' + esc(doc.id) + '">Printable sheet</a>' : "") +
            '<button type="button" class="ds-link" data-url="' + esc(url) + '">Copy link</button></div>' +
          '<div class="sh-body ds-body">' + html + "</div>" +
          '<footer class="ds-foot"><span>' + esc(c[0]) + " · " + esc(k[1]) + " · " + esc(doc.path) + "</span><span>Read live from the repository</span></footer>" +
        "</div></div>";
      body.classList.remove("in"); void body.offsetWidth; body.classList.add("in");
      var cl = $(".ds-link", body);
      cl.addEventListener("click", function () {
        var u = cl.getAttribute("data-url");
        (navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(u) : Promise.reject()).then(function () { cl.textContent = "Copied"; status("Link copied"); }, function () { cl.textContent = u; });
      });
      led($("#ledInfo"), doc.title);
      var first = cabHL ? cabHighlight($(".ds-body", body), cabHL) : null;
      cabHL = null;
      if (first && first.scrollIntoView) setTimeout(function () { first.scrollIntoView({ behavior: opts.motion ? "smooth" : "auto", block: "center" }); }, opts.motion ? 260 : 0);
      else if (cabJump && window.innerWidth <= 900 && body.scrollIntoView) body.scrollIntoView({ behavior: opts.motion ? "smooth" : "auto", block: "start" });
      cabJump = false;
    }, function () {
      if (currentView !== "docs") return;
      body.innerHTML = '<div class="empty">Could not open this document<small><a href="' + repoUrl("/blob/" + cfg.branch + "/" + doc.path) + '" target="_blank" rel="noopener noreferrer">Open it on GitHub</a></small></div>';
    });
  }
  /* Marks every search word in the opened page and returns the first mark */
  function cabHighlight(root, words) {
    if (!root || !words.length) return null;
    var re = new RegExp("(" + words.map(function (w) { return w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }).join("|") + "[a-z]*)", "ig"), first = null, nodes = [];
    var walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false), n;
    while ((n = walk.nextNode())) if (n.nodeValue.trim() && !/^(SCRIPT|STYLE|MARK)$/.test(n.parentNode.nodeName)) nodes.push(n);
    nodes.forEach(function (t) {
      re.lastIndex = 0;
      if (!re.test(t.nodeValue)) return;
      var frag = document.createDocumentFragment(), parts = t.nodeValue.split(re);
      parts.forEach(function (p, i) {
        if (!p) return;
        if (i % 2) { var m = document.createElement("mark"); m.className = "hl"; m.textContent = p; frag.appendChild(m); if (!first) first = m; }
        else frag.appendChild(document.createTextNode(p));
      });
      t.parentNode.replaceChild(frag, t);
    });
    return first;
  }
  /* The search index: plain text, headings and their positions, built once on the first search */
  function cabIndex(docs) {
    if (cabIdx) return Promise.resolve(cabIdx);
    return Promise.all(docs.map(function (d) { return loadDoc(d).then(function (t) { return [d, t]; }, function () { return [d, ""]; }); })).then(function (all) {
      cabIdx = all.map(function (p) {
        var lines = p[1].split("\n"), heads = [], text = "", pos = [];
        lines.forEach(function (l) {
          var h = /^#{2,4}\s+(.*)$/.exec(l);
          var clean = l.replace(/^#+\s+/, "").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/[*`|>_]+/g, " ").replace(/\s+/g, " ").trim();
          if (h) heads.push({ at: text.length, t: clean });
          if (clean) { pos.push(text.length); text += clean + " "; }
        });
        return { d: p[0], text: text, low: text.toLowerCase(), heads: heads, hlow: heads.map(function (h) { return h.t.toLowerCase(); }).join(" ") };
      });
      return cabIdx;
    });
  }
  function cabSearch(docs) {
    var out = $("#cabHits"), words = cabWords();
    if (!out) return;
    if (!words.length || cabQ.trim().length < 2) { out.innerHTML = ""; cabRes = []; return; }
    if (!cabIdx) out.innerHTML = '<p class="sub"><span class="spin"></span>Reading every document…</p>';
    var q = cabQ;
    cabIndex(docs).then(function (idx) {
      if (currentView !== "docs" || cabQ !== q) return;
      var res = [];
      idx.forEach(function (e) {
        var c = cabCode(e.d, docs), title = (c[0] + " " + c[1]).toLowerCase(), score = 0, ok = true, firstAt = -1;
        words.forEach(function (w) {
          var inTitle = title.indexOf(w) > -1, inCode = cabCodeHit(w, c[0]), inHead = e.hlow.indexOf(w) > -1, at = e.low.indexOf(w), n = 0, j = at;
          while (j > -1 && n < 20) { n++; j = e.low.indexOf(w, j + w.length); }
          if (!inTitle && !inCode && at < 0) { ok = false; return; }
          score += (inCode ? 30 : 0) + (inTitle ? 20 : 0) + (inHead ? 6 : 0) + Math.min(n, 10);
          if (at > -1 && (firstAt < 0 || at < firstAt)) firstAt = at;
        });
        if (!ok) return;
        if (title.indexOf(cabQ.trim().toLowerCase()) > -1) score += 25;
        var head = "", snip = "";
        if (firstAt > -1) {
          e.heads.forEach(function (h) { if (h.at <= firstAt) head = h.t; });
          var a = Math.max(0, firstAt - 45);
          snip = (a ? "…" : "") + e.text.slice(a, firstAt + 95).trim() + "…";
        }
        res.push({ d: e.d, c: c, score: score, head: head, snip: snip });
      });
      res.sort(function (x, y) { return y.score - x.score; });
      cabRes = res.slice(0, 10); if (cabSel >= cabRes.length) cabSel = 0;
      var re = cabRe(words);
      function hl(s) { return esc(s).replace(re, function (m) { return "<mark>" + m + "</mark>"; }); }
      out.innerHTML = '<div class="cab-hits"><div class="label">' + plural(res.length, "result") + (res.length > cabRes.length ? " · top " + cabRes.length : "") + '<span class="cab-keys">↑↓ select · ↵ open · Esc clear</span></div>' +
        (cabRes.length ? cabRes.map(function (h, i) {
          return '<a href="' + (h.d.group === "Handbook" ? "#/guides/" : "#/docs/") + esc(h.d.id) + '" data-i="' + i + '" class="' + (i === cabSel ? "on" : "") + '" style="--g:' + cabGroup(h.d.group)[1] + '"><b>' + hl(h.c[0]) + "</b> " + hl(h.c[1]) +
            (h.head ? '<i>§ ' + hl(h.head) + "</i>" : "") + (h.snip ? "<small>" + hl(h.snip) + "</small>" : "") + "</a>";
        }).join("") : '<p class="sub">Nothing matches every word of "' + esc(cabQ.trim()) + '".</p>') + "</div>";
      $$("#cabHits a").forEach(function (a) { a.addEventListener("click", function (ev) { ev.preventDefault(); cabGo(cabRes[+a.getAttribute("data-i")]); }); });
    });
  }
  function cabMark() { $$("#cabHits a").forEach(function (a) { var on = +a.getAttribute("data-i") === cabSel; a.classList.toggle("on", on); if (on && a.scrollIntoView) a.scrollIntoView({ block: "nearest" }); }); }
  function cabGo(h) {
    if (!h) return;
    cabHL = cabWords(); cabJump = true;
    var to = (h.d.group === "Handbook" ? "#/guides/" : "#/docs/") + h.d.id;
    if (location.hash === to) { route(); return; }
    location.hash = to;
  }
  /* Ctrl+K or / jumps to the search on the Docs page */
  document.addEventListener("keydown", function (e) {
    if (currentView !== "docs") return;
    var tag = (e.target && e.target.tagName) || "", q = $("#cq");
    if (!q) return;
    if (((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) || (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(tag))) { e.preventDefault(); q.focus(); q.select(); }
  });
