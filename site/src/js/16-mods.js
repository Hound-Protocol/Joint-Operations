  /* Mods */
  var modState = { tab: "compatible", q: "" };
  function viewMods() {
    var v = $("#view");
    v.innerHTML = shell("Community", "Mods", loading("Loading mods"));
    loadLocal("mods").then(function () { if (currentView === "mods") drawMods(); refreshInfo(); });
  }
  function drawMods() {
    var md = data.mods || { compatible: [], issues: [] }, list = (md[modState.tab] || []).filter(function (m) {
      return !modState.q || (m.name + " " + m.author + " " + (m.notes || "")).toLowerCase().indexOf(modState.q.toLowerCase()) > -1;
    });
    $("#vb").innerHTML =
      '<div class="tabs" role="tablist"><button role="tab" data-mt="compatible" aria-selected="' + (modState.tab === "compatible") + '">Compatible<span class="count">' + (md.compatible || []).length + "</span></button>" +
      '<button role="tab" data-mt="issues" aria-selected="' + (modState.tab === "issues") + '">Known issues<span class="count">' + (md.issues || []).length + "</span></button></div>" +
      ((md.compatible || []).length + (md.issues || []).length ? "" : milestone("mods")) +
      '<p class="sub">' + (modState.tab === "compatible" ? "Re-engineered and tested to work with Joint Operations." : "These work, with known issues. Read the notes before you install.") + "</p>" +
      '<div class="toolbar"><input class="field grow" id="mq" type="search" placeholder="Search mods" value="' + esc(modState.q) + '" aria-label="Search mods">' +
      '<a class="btn primary" href="' + esc(repoUrl("/issues/new?template=mod-submission.md")) + '" target="_blank" rel="noopener noreferrer">Upload a mod</a></div>' +
      '<div class="tw"><table><tr><th>Mod</th><th>Version</th><th>Author</th><th>Tested on</th><th>Notes</th><th></th></tr>' +
      (list.length ? list.map(function (m) {
        return "<tr><td>" + esc(m.name) + "</td><td>" + esc(m.version || "—") + "</td><td>" + esc(m.author || "—") + "</td><td>" + esc(m.tested || "—") + "</td><td>" + esc(m.notes || "—") + '</td><td class="num">' +
          (m.url && /^https?:/i.test(m.url) ? '<a class="btn small" href="' + esc(m.url) + '" target="_blank" rel="noopener noreferrer">Get</a>' : "") + "</td></tr>";
      }).join("") : "") + "</table></div>" +
      (list.length ? "" : '<div class="empty">No mods listed<small>' + (modState.q ? "No mods match the search." : "Curated mods appear here after review. Upload yours for review.") + "</small></div>") +
      '<p class="source">Source: data/mods.json</p>';
    $$("[data-mt]").forEach(function (b) { b.addEventListener("click", function () { modState.tab = b.dataset.mt; drawMods(); }); });
    $("#mq").addEventListener("input", function (e) { modState.q = e.target.value; var p = e.target.selectionStart; drawMods(); var n = $("#mq"); n.focus(); try { n.setSelectionRange(p, p); } catch (x) { /* ignore */ } });
  }
