  /* ---------------- Documentation ----------------
     The Docs section is the dossier cabinet (17b-cabinet.js). loadDoc reads a document from the bundled copy,
     the deployed site or GitHub. */
  function viewDocs(id) { return viewCabinet(id); }
  /* Documentation has two zones: the Library (plans, decisions, research, the Dev Log…) and the Handbook (guides, policies, procedures) */
  function docZones(active) {
    var all = (data.docs && data.docs.docs) || [], hb = ((data.guides && data.guides.guides) || []).length || all.filter(function (d) { return d.group === "Handbook"; }).length;
    var lib = all.filter(function (d) { return d.group !== "Handbook"; }).length;
    function z(id, href, name, sub) {
      return '<a class="zone z-' + id + (active === id ? " on" : "") + '" href="' + href + '"' + (active === id ? ' aria-current="page"' : "") + '><span class="z-ico" aria-hidden="true"></span><b>' + name + "</b><small>" + sub + "</small></a>";
    }
    return '<nav class="zones" aria-label="Documentation zones">' +
      z("lib", "#/docs", "Library", (lib ? lib + " documents · " : "") + "plans, decisions, research, the dev log, technical and legal") +
      z("hb", "#/guides", "Handbook", (hb ? hb + " documents · " : "") + "guides, policies and procedures, printable on A4") + "</nav>";
  }
  function addZones(active) { var vh = $(".vh"); if (vh && !$(".zones")) vh.insertAdjacentHTML("afterend", docZones(active)); }
  function loadDoc(doc) {
    if (docCache[doc.path]) return Promise.resolve(docCache[doc.path]);
    if (EMBED && EMBED.content && EMBED.content[doc.path] != null) return Promise.resolve(docCache[doc.path] = EMBED.content[doc.path]);
    var raw = "https://raw.githubusercontent.com/" + cfg.repo + "/" + cfg.branch + "/" + doc.path;
    return fetchText("content/" + doc.path).catch(function () { return fetchText(raw); }).then(function (t) { docCache[doc.path] = t; return t; });
  }
