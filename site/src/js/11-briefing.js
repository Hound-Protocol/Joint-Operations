  /* Briefing */
  function hl(t) { return esc(t).replace(/\{\{([^}]+)\}\}/g, '<mark class="key">$1</mark>'); }
  var ICONS = {
    host: '<svg class="ico-i" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2l8 8-8 8-8-8z"/><path d="M10 7l3 3-3 3-3-3z" class="f"/></svg>',
    client: '<svg class="ico-i" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="6" r="3"/><path d="M4 18c0-4 2.7-6 6-6s6 2 6 6"/></svg>',
    link: '<svg class="ico-i" viewBox="0 0 20 20" aria-hidden="true"><path d="M2 7h13l-3-3M18 13H5l3 3"/></svg>'
  };
  /* Architecture diagram: host PC, connection, client PCs, and what flows each way */
  function howDiagram() {
    var narrow = window.matchMedia && matchMedia("(max-width: 700px)").matches;
    function box(x, y, w, h, title, sub, rows, cls, k) {
      var o = '<g class="dn ' + cls + '" style="--k:' + k + '"><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '"/>' +
        '<path class="tick" d="M' + x + ' ' + (y + 10) + 'V' + y + 'H' + (x + 10) + '"/>' +
        '<text class="t" x="' + (x + 16) + '" y="' + (y + 26) + '">' + title + '</text><text class="s" x="' + (x + 16) + '" y="' + (y + 42) + '">' + sub + "</text>";
      rows.forEach(function (r, i) { o += '<rect class="row" x="' + (x + 16) + '" y="' + (y + 56 + i * 26) + '" width="' + (w - 32) + '" height="20"/><text class="r" x="' + (x + 26) + '" y="' + (y + 70 + i * 26) + '">' + r + "</text>"; });
      return o + "</g>";
    }
    if (narrow) {
      var v = '<svg class="how narrow" viewBox="0 0 340 600" role="img" aria-label="How a session works: the host PC runs the mission, AI and world; client PCs send movement and actions; the host sends world state back.">';
      v += box(10, 10, 320, 180, "HOST PC", "Runs the session", ["Mission state", "AI and enemies", "World and time", "Decides outcomes"], "hostbox", 0);
      v += '<g class="dn lane" style="--k:1"><text class="lt" x="170" y="222" text-anchor="middle">STEAM RELAY · DIRECT IP</text>' +
        '<line class="rail" x1="120" y1="236" x2="120" y2="362"/><line class="pkt up" x1="120" y1="362" x2="120" y2="236"/><path class="arrow" d="M114 244l6-8 6 8"/><text class="lb" x="110" y="304" text-anchor="end">movement</text><text class="lb" x="110" y="318" text-anchor="end">actions</text>' +
        '<line class="rail" x1="220" y1="236" x2="220" y2="362"/><line class="pkt down" x1="220" y1="236" x2="220" y2="362"/><path class="arrow" d="M214 354l6 8 6-8"/><text class="lb" x="230" y="296">world state</text><text class="lb" x="230" y="310">AI</text><text class="lb" x="230" y="324">events</text></g>';
      [0, 1].forEach(function (i) { v += '<g class="dn ghost" style="--k:' + (3 + i) + '"><rect x="' + (26 - i * 8) + '" y="' + (382 + i * 8) + '" width="304" height="160"/></g>'; });
      v += box(10, 398, 304, 160, "CLIENT PC", "Up to 15 clients", ["Own movement", "Own camera", "Local view of world"], "clientbox", 2);
      return v + '<text class="foot" x="170" y="592" text-anchor="middle">ONE HOST DECIDES · ALL SEE THE SAME WORLD</text></svg>';
    }
    var svg = '<svg class="how" viewBox="0 30 760 270" role="img" aria-label="How a session works: the host PC runs the mission, AI and world; client PCs send movement and actions; the host sends world state back through Steam relay or a direct connection.">';
    svg += box(10, 40, 230, 200, "HOST PC", "Runs the session", ["Mission state", "AI and enemies", "World and time", "Decides outcomes"], "hostbox", 0);
    [0, 1, 2].forEach(function (i) { svg += '<g class="dn ghost" style="--k:' + (3 + i) + '"><rect x="' + (536 - i * 8) + '" y="' + (40 + i * 8) + '" width="214" height="200"/></g>'; });
    svg += box(520, 56, 214, 200, "CLIENT PC", "Up to 15 clients", ["Own movement", "Own camera", "Local view of world"], "clientbox", 2);
    svg += '<g class="dn lane" style="--k:1">' +
      '<text class="lt" x="380" y="70" text-anchor="middle">STEAM RELAY · DIRECT IP</text>' +
      '<line class="rail" x1="250" y1="120" x2="510" y2="120"/><line class="pkt up" x1="510" y1="120" x2="250" y2="120"/>' +
      '<path class="arrow" d="M258 114l-8 6 8 6"/><text class="lb" x="380" y="108" text-anchor="middle">movement · actions</text>' +
      '<line class="rail" x1="250" y1="180" x2="510" y2="180"/><line class="pkt down" x1="250" y1="180" x2="510" y2="180"/>' +
      '<path class="arrow" d="M502 174l8 6-8 6"/><text class="lb" x="380" y="204" text-anchor="middle">world state · AI · events</text></g>';
    svg += '<text class="foot" x="380" y="292" text-anchor="middle">UP TO 16 PLAYERS · ONE HOST DECIDES · EVERYONE SEES THE SAME WORLD</text></svg>';
    return svg;
  }
  function viewBriefing() {
    var v = $("#view");
    v.innerHTML = shell("Overview", "About Joint Operations", loading("Loading"));
    loadLocal("briefing").then(function () {
      if (currentView !== "briefing") return;
      var b = data.briefing || {}, host = b.host || { places: [] };
      $("#vb").innerHTML = '<div class="bf">' +
        '<section class="bf-sec bf-hero"><h3 class="bf-head">' + hl(b.headline || "") + "</h3>" +
        (b.summary || []).map(function (t) { return '<p class="bf-lead">' + hl(t) + "</p>"; }).join("") +
        '<div class="toolbar"><a class="btn primary" href="#/contribute">Join the Hound</a><a class="btn" href="#/roadmap">Roadmap</a><a class="btn" href="#/guides">Guides</a></div></section>' +
        '<section class="bf-sec"><div class="label">How a session works</div>' + howDiagram() +
        '<div class="bf-how">' + (b.how || []).map(function (h, k) {
          return '<div class="bf-pt" style="--k:' + k + '"><h4>' + (ICONS[h[0]] || "") + esc(h[1]) + "</h4><p>" + hl(h[2]) + "</p></div>";
        }).join("") + "</div></section>" +
        '<section class="bf-sec bf-hostline"><p>' + ICONS.host + hl(host.text || "") + '</p><ul class="chips">' + (host.places || []).map(function (pl, k) { return '<li style="--k:' + k + '">' + esc(pl) + "</li>"; }).join("") + "</ul></section>" +
        (b.alert ? '<section class="bf-sec"><div class="label">' + esc(b.alert.title) + '</div><p class="bf-lead">' + hl(b.alert.text) + '</p><div class="alerts">' + (b.alert.states || []).map(function (s, k) {
          return '<div class="al ' + esc(s[0]) + '" style="--k:' + k + '"><b>' + esc(s[1]) + "</b><p>" + hl(s[2]) + "</p></div>";
        }).join("") + '</div><p class="source">' + hl(b.alert.foot || "") + ' · <a href="#/docs/adr-0012">ADR 0012</a></p></section>' : "") +
        "</div>";
      revealSections();
      refreshInfo();
    });
  }
  function revealSections() {
    var secs = $$(".bf-sec");
    function show(el) { if (el.classList.contains("in")) return; el.classList.add("in"); $$("[data-to]", el).forEach(countUp); }
    if (!("IntersectionObserver" in window)) { secs.forEach(show); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } }); }, { root: $("#center"), threshold: 0.12 });
    secs.forEach(function (el, k) { setTimeout(function () { io.observe(el); }, k * 90); });
  }
  function countUp(el) {
    var to = +el.dataset.to, t0 = null;
    if (!opts.motion || to === 0) { el.textContent = to; return; }
    function step(ts) { if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / 900); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
  }

  /* Roadmap */
  function viewRoadmap() {
    var v = $("#view");
    v.innerHTML = shell("Plan", "Roadmap", loading("Loading roadmap"));
    loadRoadmap().then(function () {
      if (currentView !== "roadmap") return;
      var r = data.roadmap || [], ph = currentPhase(), idx = r.indexOf(ph);
      if (!r.length) { $("#vb").innerHTML = '<div class="empty">Roadmap unavailable<small>ROADMAP.md could not be loaded.</small></div>'; return; }
      var prog = Math.round(((idx < 0 ? 0 : idx) + (ph && ph.total ? ph.done / ph.total : 0)) / r.length * 100);
      var all = r.reduce(function (a, p) { return [a[0] + p.done, a[1] + p.total]; }, [0, 0]);
      $("#vb").innerHTML = '<div class="bf">' +
        '<section class="bf-sec"><div class="bf-road" style="--p:' + prog + '%"><i class="fill"></i>' + r.map(function (p) {
          var state = p === ph ? "now" : (p.total && p.done === p.total ? "done" : "next");
          return '<a class="ph ' + state + '" href="#rm-' + p.n + '"><div class="n">Phase ' + p.n + (state === "now" ? " · Now" : state === "done" ? " · Done" : "") + '</div><div class="tt">' + esc(p.title) + '</div><div class="c">' + p.done + " / " + p.total + " tasks</div></a>";
        }).join("") + "</div>" +
        '<p class="source">' + all[0] + " of " + all[1] + ' tasks done · read live from <a href="' + repoUrl("/blob/" + cfg.branch + "/ROADMAP.md") + '" target="_blank" rel="noopener noreferrer">ROADMAP.md</a> · each phase starts when the one before it is done</p></section>' +
        '<section class="bf-sec rm-list">' + r.map(function (p) {
          var state = p === ph ? "now" : (p.total && p.done === p.total ? "done" : "next");
          return '<div class="rm-ph ' + state + '" id="rm-' + p.n + '"><div class="rm-h"><span class="n">Phase ' + p.n + '</span><h3>' + esc(p.title) + '</h3><span class="pill ' + (state === "now" ? "warn" : state === "done" ? "ok" : "") + '">' + (state === "now" ? "In progress" : state === "done" ? "Complete" : "Planned") + "</span></div>" +
            '<div class="meter"><i style="width:' + (p.total ? Math.round(p.done / p.total * 100) : 0) + '%"></i></div><ul class="rm-items">' + p.items.map(function (it) {
              return '<li class="' + (it.done ? "done" : "") + '">' + inline(it.text, "ROADMAP.md") + "</li>";
            }).join("") + "</ul></div>";
        }).join("") + "</section></div>";
      $$(".bf-road a.ph").forEach(function (a) { a.addEventListener("click", function (e) { e.preventDefault(); var t = $(a.getAttribute("href")); if (t) t.scrollIntoView({ behavior: opts.motion ? "smooth" : "auto", block: "start" }); }); });
      revealSections();
      refreshInfo();
    });
  }
