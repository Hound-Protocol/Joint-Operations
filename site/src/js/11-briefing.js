  /* Briefing */
  function hl(t) { return esc(t).replace(/\{\{([^}]+)\}\}/g, '<mark class="key">$1</mark>'); }
  var ICONS = {
    host: '<svg class="ico-i" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2l8 8-8 8-8-8z"/><path d="M10 7l3 3-3 3-3-3z" class="f"/></svg>',
    client: '<svg class="ico-i" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="6" r="3"/><path d="M4 18c0-4 2.7-6 6-6s6 2 6 6"/></svg>',
    link: '<svg class="ico-i" viewBox="0 0 20 20" aria-hidden="true"><path d="M2 7h13l-3-3M18 13H5l3 3"/></svg>'
  };
  function viewBriefing() {
    var v = $("#view");
    v.innerHTML = shell("Overview", "About Joint Operations", loading("Loading"));
    loadLocal("briefing").then(function () {
      if (currentView !== "briefing") return;
      var b = data.briefing || {};
      $("#vb").innerHTML = '<div class="bf">' +
        '<section class="bf-sec bf-hero"><h3 class="bf-head">' + hl(b.headline || "") + "</h3>" +
        (b.summary || []).map(function (t) { return '<p class="bf-lead">' + hl(t) + "</p>"; }).join("") +
        '<div class="toolbar"><a class="btn primary" href="#/contribute">Join the Hound</a><a class="btn" href="#/roadmap">Roadmap</a><a class="btn" href="#/guides">Guides</a></div></section>' +
        '<section class="bf-sec"><div class="label">How a session works</div>' +
        '<ol class="bf-steps">' + (b.how || []).map(function (h, k) {
          return '<li style="--k:' + k + '"><span class="st-n">' + (ICONS[h[0]] || k + 1) + '</span><div><h4>' + esc(h[1]) + "</h4><p>" + hl(h[2]) + "</p></div></li>";
        }).join("") + "</ol></section>" +
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
