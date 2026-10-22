  /* ---------------- Views ---------------- */
  var currentView = "";
  function shell(kicker, title, body) {
    var tabs = '<nav class="secbar" aria-label="Sections">' + ITEMS.map(function (it) {
      return '<a href="#/' + it.id + '"' + (it.id === currentView ? ' aria-current="page"' : "") + ">" + esc(it.tab) + "</a>";
    }).join("") + "</nav>";
    return tabs + '<div class="vh"><div><span class="kicker">' + esc(kicker) + '</span><h2>' + esc(title) + '</h2></div><a class="btn" href="#/">Menu</a></div><div id="vb">' + body + "</div>";
  }
  function milestone(key) { var m = cfg.milestones && cfg.milestones[key]; return m ? '<p class="note">' + esc(m) + "</p>" : ""; }
  function loading(t) { return '<p class="sub"><span class="spin"></span>' + esc(t) + "</p>"; }
  var ICON_CHAT = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/><path d="M8 10h.01M12 10h.01M16 10h.01" stroke-width="2.4" stroke-linecap="round"/></svg>';
  var ICON_WIN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5l8-1v8H3zM13 4l8-1v9h-8zM3 13h8v7l-8-1zM13 13h8v8l-8-1z"/></svg>';
  var ICON_LNX = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="13"/><path d="M8 21h8M12 17v4M7 9l3 2-3 2M12 13h4"/></svg>';
