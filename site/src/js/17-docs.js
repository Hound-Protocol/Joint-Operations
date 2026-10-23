  /* ---------------- Documentation ----------------
     The Docs section is the dossier cabinet (17b-cabinet.js). loadDoc reads a document from the bundled copy,
     the deployed site or GitHub. */
  function viewDocs(id) { return viewCabinet(id); }
  function loadDoc(doc) {
    if (docCache[doc.path]) return Promise.resolve(docCache[doc.path]);
    if (EMBED && EMBED.content && EMBED.content[doc.path] != null) return Promise.resolve(docCache[doc.path] = EMBED.content[doc.path]);
    var raw = "https://raw.githubusercontent.com/" + cfg.repo + "/" + cfg.branch + "/" + doc.path;
    return fetchText("content/" + doc.path).catch(function () { return fetchText(raw); }).then(function (t) { docCache[doc.path] = t; return t; });
  }
