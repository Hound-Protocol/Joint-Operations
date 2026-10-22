  /* ---------------- Menu ---------------- */
  var ITEMS = [
    { id: "briefing", title: "Briefing", desc: "What Joint Operations is and where it stands", tab: "Briefing" },
    { id: "roadmap", title: "Roadmap", desc: "Phases, progress and what comes next", tab: "Roadmap", tabOnly: true },
    { id: "download", title: "Download", desc: "Available for Windows and Linux using Proton", tab: "Download" },
    { id: "sessions", title: "Session Overview", desc: "Browse sessions, details, status and ping", tab: "Sessions" },
    { id: "contribute", title: "Contribute", desc: "Become a part of the Protocol", tab: "Contribute" },
    { id: "team", title: "Team", desc: "The people behind Hound Protocol", tab: "Team", tabOnly: true },
    { id: "mods", title: "Mods", desc: "Compatible mods and mods with known issues", tab: "Mods" },
    { id: "devlog", title: "Dev Log", desc: "Recent changes, decisions and releases", tab: "Dev Log" },
    { id: "guides", title: "Guides", desc: "Handbook for players, contributors, quality and admins", tab: "Guides" },
    { id: "docs", title: "Documentation", desc: "Library of project documentation", tab: "Docs" },
    { id: "options", title: "Options", desc: "Interface and data settings", tab: "Options" }
  ];
  var MENU = ITEMS.filter(function (it) { return !it.tabOnly; });
  var cur = 0;
  function itemInfo(id) {
    switch (id) {
      case "briefing":
        var ph = currentPhase();
        return ph ? "Current: Phase " + ph.n + " · " + ph.title + " · " + ph.done + " of " + ph.total + " done" : "Project overview";
      case "roadmap":
        return "Roadmap";
      case "team":
        return "Team";
      case "devlog":
        var n2 = devlogEntries().length;
        return n2 ? plural(n2, "entry", "entries") : "Dev log";
      case "download":
        if (data.releases === undefined) return "Checking releases";
        if (playableReleases().length) return "Latest " + (playableReleases()[0].tag_name || "") + " · " + fmtDate(playableReleases()[0].published_at);
        return buildLabel() + " · " + cfg.stage + " · No playable release yet";
      case "sessions":
        var n = data.servers ? (data.servers.servers || []).length : 0;
        return n ? plural(n, "session") + " listed" : "No sessions online";
      case "contribute":
        var list = contractList(), open = list.filter(function (c) { return c.status === "open" || c.status === "planned"; }).length;
        return list.length ? plural(open, "open contract") + " · " + plural(list.length, "total contract") : "Contract board";
      case "mods":
        var md = data.mods || { compatible: [], issues: [] };
        return (md.compatible || []).length + " compatible · " + (md.issues || []).length + " with known issues";
      case "docs":
        return data.docs ? plural((data.docs.docs || []).length, "document") : "Documentation library";
      case "options":
        return "Saved on this device";
    }
    return "";
  }
  function renderMenu() {
    $("#menu").innerHTML = MENU.map(function (it, n) {
      return '<a href="#/' + it.id + '" data-n="' + n + '" style="--i:' + n + '" aria-description="' + esc(it.desc) + '"><i class="hl"></i><span class="t">' + esc(it.title) + '</span><span class="win" aria-hidden="true"><span class="d"></span></span></a>';
    }).join("");
    $$("#menu a").forEach(function (a) {
      var n = +a.dataset.n;
      a.addEventListener("mouseenter", function () { select(n, false); });
      a.addEventListener("focus", function () { select(n, false); });
    });
    // Discord icon hook: set links.discordIcon in config.json to Discord's official logo file.
    var dIcon = cfg.links.discordIcon ? '<img class="ico" src="' + esc(cfg.links.discordIcon) + '" alt="">' : ICON_CHAT;
    var links = [["Discord", cfg.links.discord, dIcon], ["GitHub", cfg.links.github, ""]];
    $("#links").innerHTML = links.map(function (l) {
      return l[1] ? '<a class="btn" href="' + esc(l[1]) + '" target="_blank" rel="noopener noreferrer">' + l[2] + l[0] + "</a>"
        : '<span class="btn off" aria-disabled="true" title="Invite link coming soon">' + l[2] + l[0] + "</span>";
    }).join("");
  }
  function typeInto(el, text) {
    el.textContent = "";
    for (var k = 0; k < text.length; k++) {
      var c = document.createElement("span"); c.className = "ch"; c.textContent = text[k] === " " ? "\u00a0" : text[k];
      c.style.animationDelay = (k * 9) + "ms"; el.appendChild(c);
    }
    var cur = document.createElement("i"); cur.className = "cur"; el.appendChild(cur);
  }
  function select(n, focus) {
    var prev = cur;
    cur = (n + MENU.length) % MENU.length;
    $$("#menu a").forEach(function (a, j) {
      var on = j === cur, d = a.querySelector(".d");
      if (compact()) { if (!d.childNodes.length) d.textContent = MENU[j].desc; }
      else {
        if (on && (!a.classList.contains("on") || prev !== cur || !d.childNodes.length)) typeInto(d, MENU[j].desc);
        if (!on && d) d.textContent = "";
      }
      a.classList.toggle("on", on);
    });
    if (prev !== cur && focus) blip("move");
    if (focus) { var a = $$("#menu a")[cur]; if (a) a.focus({ preventScroll: false }); }
    led($("#ledInfo"), itemInfo(MENU[cur].id));
  }
  function refreshInfo() { if (!currentView) led($("#ledInfo"), itemInfo(MENU[cur].id)); }
