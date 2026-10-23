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
      /* Hero with a live session diagram: one host, fifteen clients, state flowing out and inputs flowing back */
      var nodes = "", links = "";
      for (var n = 0; n < 15; n++) {
        var a = -Math.PI / 2 + n * Math.PI * 2 / 15, r = n % 2 ? 128 : 150, x = 180 + Math.cos(a) * r, y = 180 + Math.sin(a) * r;
        links += '<line class="ab-link" x1="180" y1="180" x2="' + x.toFixed(1) + '" y2="' + y.toFixed(1) + '" style="--k:' + n + '"/>' +
          '<circle class="ab-pkt" r="2.4" style="--k:' + n + "; --x:" + (x - 180).toFixed(1) + "px; --y:" + (y - 180).toFixed(1) + 'px" cx="180" cy="180"/>';
        nodes += '<g class="ab-cl" style="--k:' + n + '" transform="translate(' + x.toFixed(1) + " " + y.toFixed(1) + ')"><circle r="9"/><circle class="d" r="3"/></g>';
      }
      var diagram = '<svg class="ab-net" viewBox="0 0 360 360" role="img" aria-label="One host and fifteen clients in one session">' +
        '<circle class="ab-ring" cx="180" cy="180" r="150"/><circle class="ab-ring" cx="180" cy="180" r="128"/>' + links + nodes +
        '<g class="ab-host" transform="translate(180 180)"><circle class="p" r="34"/><circle r="26"/><path d="M0 -12l12 12-12 12-12-12z"/><text y="48">HOST</text></g></svg>';
      var stats = [[16, "players in one session"], [1, "host, the authority"], [0, "Konami servers touched"], [100, "% free and open source"]];
      $("#vb").innerHTML = '<div class="bf ab">' +
        '<section class="bf-sec ab-hero"><div class="ab-copy"><span class="ab-kick">MGSV: Joint Operations · by Hound Protocol</span><h3 class="bf-head">' + hl(b.headline || "") + "</h3>" +
          (b.summary || []).map(function (t) { return '<p class="bf-lead">' + hl(t) + "</p>"; }).join("") +
          '<div class="toolbar"><a class="btn primary" href="#/contribute">Join the Hound</a><a class="btn" href="#/roadmap">Roadmap</a><a class="btn" href="#/guides/hp-gde-001">Player Guide</a></div></div>' +
          '<div class="ab-vis">' + diagram + "</div></section>" +
        '<section class="bf-sec ab-stats">' + stats.map(function (st, k) { return '<div style="--k:' + k + '"><b data-to="' + st[0] + '">0</b><span>' + esc(st[1]) + "</span></div>"; }).join("") + "</section>" +
        '<section class="bf-sec"><div class="label">How a session works</div><ol class="ab-steps">' + (b.how || []).map(function (h, k) {
          return '<li style="--k:' + k + '"><span class="ab-n">0' + (k + 1) + '</span><span class="st-n">' + (ICONS[h[0]] || k + 1) + "</span><h4>" + esc(h[1]) + "</h4><p>" + hl(h[2]) + "</p></li>";
        }).join("") + "</ol></section>" +
        '<section class="bf-sec ab-more"><div class="label">Read more in the Handbook</div><div class="ab-links">' +
          [["hp-gde-001", "HP-GDE-001", "Player Guide", "Install, host and join, and stay safe."], ["hp-gde-002", "HP-GDE-002", "Linux and Proton", "Play on Linux and Steam Deck."], ["hp-gde-017", "HP-GDE-017", "Can I Contribute?", "Find where you fit in five questions."], ["hp-gde-015", "HP-GDE-015", "Using the Website", "Every section, search and sign-in."]].map(function (g, k) {
            return '<a href="#/guides/' + g[0] + '" style="--k:' + k + '"><small>' + g[1] + "</small><b>" + esc(g[2]) + "</b><span>" + esc(g[3]) + "</span></a>";
          }).join("") + "</div></section>" +
        ((b.faq || []).length ? '<section class="bf-sec"><div class="label">Frequently asked</div><div class="faq ab-faq">' + b.faq.map(function (f, k) {
          return '<details style="--k:' + k + '"><summary>' + esc(f[0]) + "</summary><p>" + hl(f[1]) + "</p></details>";
        }).join("") + "</div></section>" : "") +
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


