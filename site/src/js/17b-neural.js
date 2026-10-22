  /* ---------------- Docs: neural web ----------------
     A force-directed map of the documentation. Hubs are the library groups, neurons are documents,
     synapses are links between documents. Clicking a neuron opens it as an A4 window beside the web;
     windows stack, minimize to a dock (up to 5 documents) and restore. Closing everything rebuilds the web. */
  var NW_COLORS = { Project: "#c9a24a", Technical: "#6fb7c9", Decisions: "#d77a6e", Research: "#8fbf7f", Community: "#a99be0", Legal: "#b7c2c6", Handbook: "#e6dcc0" };
  var NW_BUILD_MS = 3000, NW_MAX_DOCS = 5;
  var NW = null;
  function docsMode() { return store.get("jo-docs-mode", "neural") === "classic" ? "classic" : "neural"; }
  function setDocsMode(m) { store.set("jo-docs-mode", m); }
  function nwColor(g) { return NW_COLORS[g] || "#c9d0d2"; }
  function rgba(hex, a) { var n = parseInt(hex.slice(1), 16); return "rgba(" + (n >> 16) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")"; }

  function viewNeural(id) {
    if (NW && $("#nw")) { if (id) nwOpen(id); return; }
    var v = $("#view");
    v.innerHTML = shell("Library", "Docs", loading("Building the neural web"));
    loadLocal("docs").then(function (man) {
      if (currentView !== "docs") return;
      var docs = (man && man.docs) || [];
      $("#vb").innerHTML =
        '<div class="nw" id="nw">' +
          '<div class="nw-graph" id="nwGraph"><canvas id="nwCanvas" role="img" aria-label="Neural web of the documentation. Use the list below or Classic view to browse by keyboard."></canvas>' +
            '<div class="nw-hud"><input class="field" id="nwq" type="search" placeholder="Search the web" aria-label="Search documents">' +
              '<button class="btn small" id="nwClassic">Classic view</button></div>' +
            '<div class="nw-legend" id="nwLegend"></div>' +
            '<div class="nw-hint" id="nwHint">Point at a neuron to see it. Click to open.</div>' +
            '<div class="nw-tip" id="nwTip" aria-hidden="true"></div>' +
            '<ul class="sr-only" id="nwList"></ul></div>' +
          '<div class="nw-stage" id="nwStage" aria-live="polite"></div>' +
          '<div class="nw-dock" id="nwDock" aria-label="Minimized documents"></div>' +
        "</div>";
      $("#nwClassic").addEventListener("click", function () { setDocsMode("classic"); NW = null; viewDocs(id); });
      nwInit(docs);
      if (id) setTimeout(function () { if (NW) nwOpen(id); }, opts.motion ? NW_BUILD_MS * 0.6 : 0);
    });
  }

  function nwInit(docs) {
    var groups = [];
    docs.forEach(function (d) { if (groups.indexOf(d.group) < 0) groups.push(d.group); });
    var nodes = [{ id: "core", kind: "core", label: cfg.project || "Joint Operations", r: 24, group: null }];
    groups.forEach(function (g) { nodes.push({ id: "hub:" + g, kind: "hub", label: g, r: 15, group: g }); });
    groups.forEach(function (g) {
      docs.forEach(function (d) { if (d.group === g) nodes.push({ id: d.id, kind: "doc", label: d.title, r: 8, group: g, doc: d }); });
    });
    var byId = {}, edges = [];
    nodes.forEach(function (n, i) { n.i = i; n.x = 0; n.y = 0; n.vx = 0; n.vy = 0; n.s = 0; n.on = false; byId[n.id] = n; });
    groups.forEach(function (g) { edges.push({ a: byId.core, b: byId["hub:" + g], kind: "trunk" }); });
    nodes.forEach(function (n) { if (n.kind === "doc") { n.parent = byId["hub:" + n.group]; n.parent.kids = (n.parent.kids || 0) + 1; edges.push({ a: n.parent, b: n, kind: "branch" }); } });
    NW = { ready: false, nodes: nodes, edges: edges, byId: byId, groups: groups, docs: docs, open: [], min: [], html: {}, text: {},
      hover: null, iso: null, q: "", pulses: [], t0: performance.now(), raf: 0, drag: null, w: 0, h: 0 };
    // Legend and keyboard list
    $("#nwLegend").innerHTML = groups.map(function (g) {
      return '<button class="nw-chip" data-g="' + esc(g) + '" style="--c:' + nwColor(g) + '"><i></i>' + esc(g) + "</button>";
    }).join("");
    $$("#nwLegend .nw-chip").forEach(function (b) {
      b.addEventListener("click", function () { NW.iso = NW.iso === b.dataset.g ? null : b.dataset.g; $$("#nwLegend .nw-chip").forEach(function (x) { x.classList.toggle("on", x.dataset.g === NW.iso); }); });
    });
    $("#nwList").innerHTML = docs.map(function (d) { return '<li><button data-open="' + esc(d.id) + '">' + esc(d.group + ": " + d.title) + "</button></li>"; }).join("");
    $$("#nwList [data-open]").forEach(function (b) { b.addEventListener("click", function () { nwOpen(b.dataset.open); }); });
    $("#nwq").addEventListener("input", function (e) { NW.q = e.target.value.trim().toLowerCase(); });
    $("#nwq").addEventListener("keydown", function (e) {
      if (e.key !== "Enter" || !NW.q) return;
      var hit = NW.nodes.filter(function (n) { return n.kind === "doc" && n.label.toLowerCase().indexOf(NW.q) > -1; })[0];
      if (hit) nwOpen(hit.id);
    });
    nwCanvas();
    nwBuild();
    // Synapses: links between documents, discovered from their text
    docs.forEach(function (d) {
      loadDoc(d).then(function (md) {
        if (!NW || NW.docs !== docs) return;
        NW.text[d.id] = md;
        var re = /\]\(([^)\s#]+)(?:#[^)]*)?\)/g, m;
        while ((m = re.exec(md))) {
          if (/^(https?:|mailto:)/.test(m[1])) continue;
          var p = resolvePath(d.path, m[1]), t = docs.filter(function (x) { return x.path === p; })[0];
          if (!t || t.id === d.id) continue;
          var a = NW.byId[d.id], b = NW.byId[t.id];
          if (!NW.edges.some(function (e) { return (e.a === a && e.b === b) || (e.a === b && e.b === a); })) NW.edges.push({ a: a, b: b, kind: "syn", born: performance.now() });
        }
      }, function () { /* a missing document just has no synapses */ });
    });
  }

  function nwCanvas() {
    var c = $("#nwCanvas"), g = $("#nwGraph");
    NW.ctx = c.getContext("2d");
    function size() {
      if (!NW) return;
      var r = g.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
      NW.w = r.width; NW.h = r.height; NW.dpr = dpr; NW.k = Math.max(0.5, Math.min(1.35, Math.min(r.width, r.height) / 720));
      c.width = Math.round(r.width * dpr); c.height = Math.round(r.height * dpr);
      c.style.width = r.width + "px"; c.style.height = r.height + "px";
    }
    size();
    if (window.ResizeObserver) { NW.ro = new ResizeObserver(size); NW.ro.observe(g); } else window.addEventListener("resize", size);
    function at(e) { var r = c.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    function pick(p) {
      var best = null, bd = 1e9;
      NW.nodes.forEach(function (n) {
        if (!n.on) return;
        var d = Math.hypot(n.x - p.x, n.y - p.y);
        if (d < n.r * (NW.k || 1) * Math.max(1, n.s) + 6 && d < bd) { best = n; bd = d; }
      });
      return best;
    }
    c.addEventListener("pointermove", function (e) {
      var p = at(e);
      if (NW.drag) {
        var n = NW.drag.n; if (Math.hypot(p.x - NW.drag.x, p.y - NW.drag.y) > 4) NW.drag.moved = true;
        n.x = p.x; n.y = p.y; n.vx = n.vy = 0; return;
      }
      var h = pick(p);
      if (h !== NW.hover) { NW.hover = h; if (h && h.kind === "doc") blip("move"); }
      c.style.cursor = h ? "pointer" : "default";
      nwTip(h);
    });
    c.addEventListener("pointerleave", function () { if (!NW.drag) { NW.hover = null; nwTip(null); } });
    c.addEventListener("pointerdown", function (e) {
      var n = pick(at(e)); if (!n) return;
      NW.drag = { n: n, x: at(e).x, y: at(e).y, moved: false }; c.setPointerCapture(e.pointerId);
    });
    c.addEventListener("pointerup", function () {
      var d = NW.drag; NW.drag = null;
      if (!d || d.moved) return;
      if (d.n.kind === "doc") nwOpen(d.n.id);
      else if (d.n.kind === "hub") { NW.iso = NW.iso === d.n.group ? null : d.n.group; $$("#nwLegend .nw-chip").forEach(function (x) { x.classList.toggle("on", x.dataset.g === NW.iso); }); }
      else nwOpen((NW.docs.filter(function (x) { return x.path === "README.md"; })[0] || NW.docs[0]).id);
    });
  }

  function nwTip(n) {
    var tip = $("#nwTip");
    if (!tip) return;
    if (n === NW.tipN) return;
    NW.tipN = n;
    if (!n || n.kind === "core") { tip.classList.remove("on"); return; }
    var fresh = !tip.classList.contains("on");
    tip.style.setProperty("--c", nwColor(n.group));
    tip.innerHTML = n.kind === "hub"
      ? "<b>" + esc(n.label) + "</b><span>" + plural(NW.nodes.filter(function (x) { return x.group === n.group && x.kind === "doc"; }).length, "document") + " · click to focus</span>"
      : "<b>" + esc(n.label) + "</b><span>" + esc(n.group) + " · click to open</span>";
    if (fresh) { NW.tx = null; nwTipMove(true); }
    tip.classList.add("on");
  }
  // The tip glides after its neuron instead of jumping
  function nwTipMove(snap) {
    var tip = $("#nwTip"), n = NW.tipN;
    if (!tip || !n || n.kind === "core") return;
    var w = tip.offsetWidth || 220, r = n.r * (NW.k || 1) * n.s;
    var right = n.x + r + 18 + w < NW.w - 8;
    var x = right ? n.x + r + 18 : n.x - r - 18 - w, y = Math.max(8, Math.min(NW.h - 60, n.y - 24));
    if (snap || NW.tx == null || !opts.motion) { NW.tx = x; NW.ty = y; }
    else { NW.tx += (x - NW.tx) * 0.18; NW.ty += (y - NW.ty) * 0.18; }
    tip.style.transform = "translate(" + NW.tx.toFixed(1) + "px," + NW.ty.toFixed(1) + "px)";
    NW.tipBox = { x: NW.tx, y: NW.ty, w: w, h: tip.offsetHeight || 44 };
  }

  function nwBuild() {
    var n = NW.nodes.length, cx = NW.w / 2, cy = NW.h / 2;
    NW.t0 = performance.now(); NW.ready = false; NW.pulses = [];
    NW.nodes.forEach(function (nd, i) {
      nd.on = false; nd.s = 0; nd.vx = nd.vy = 0;
      if (nd.kind === "core") { nd.x = cx; nd.y = cy; }
      else if (nd.kind === "hub") { var a = (NW.groups.indexOf(nd.group) / NW.groups.length) * Math.PI * 2 - Math.PI / 2; nd.ax = a; nd.x = cx + Math.cos(a) * 30; nd.y = cy + Math.sin(a) * 30; }
      nd.spawn = opts.motion ? (i / Math.max(1, n - 1)) * (NW_BUILD_MS - 450) : 0;
    });
    if (!opts.motion) { NW.nodes.forEach(function (nd) { nwSpawn(nd); nd.s = 1; }); for (var k = 0; k < 400; k++) nwStep(); NW.ready = true; }
    cancelAnimationFrame(NW.raf);
    NW.raf = requestAnimationFrame(nwFrame);
  }
  function nwSpawn(nd) {
    nd.on = true; nd.born = performance.now();
    if (nd.kind === "doc") { var p = nd.parent; nd.x = p.x + (Math.random() - 0.5) * 30; nd.y = p.y + (Math.random() - 0.5) * 30; }
  }

  function nwStep() {
    var N = NW.nodes, K = NW.k || 1, cx = NW.w / 2, cy = NW.h / 2, R = Math.min(NW.w, NW.h) * 0.36, i, j;
    for (i = 0; i < N.length; i++) {
      var a = N[i]; if (!a.on) continue;
      for (j = i + 1; j < N.length; j++) {
        var b = N[j]; if (!b.on) continue;
        var dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy + 0.01, d = Math.sqrt(d2);
        var gap = ((a.kind === "doc" && b.kind === "doc") ? 14 : 24) * K, min = (a.r + b.r) * K + gap;
        var f = 0;
        if (d < min) f = (min - d) * 0.25;                       // collision: keep space
        else if (d < 260 * K) f = 520 * K * K / d2;               // soft repulsion
        if (f) { var ux = dx / d, uy = dy / d; a.vx -= ux * f; a.vy -= uy * f; b.vx += ux * f; b.vy += uy * f; }
      }
    }
    NW.edges.forEach(function (e) {
      var a = e.a, b = e.b; if (!a.on || !b.on) return;
      var dx = b.x - a.x, dy = b.y - a.y, d = Math.sqrt(dx * dx + dy * dy) + 0.01;
      var L = e.kind === "trunk" ? R : e.kind === "branch" ? (58 + Math.sqrt(a.kids || 1) * 15) * K : 150 * K;
      var k = e.kind === "syn" ? 0.0016 : 0.03, f = (d - L) * k, ux = dx / d, uy = dy / d;
      if (a.kind !== "core") { a.vx += ux * f; a.vy += uy * f; }
      b.vx -= ux * f; b.vy -= uy * f;
    });
    N.forEach(function (n) {
      if (!n.on) return;
      if (n.kind === "core") { n.x += (cx - n.x) * 0.2; n.y += (cy - n.y) * 0.2; n.vx = n.vy = 0; return; }
      if (n.kind === "hub") { n.vx += (cx + Math.cos(n.ax) * R - n.x) * 0.012; n.vy += (cy + Math.sin(n.ax) * R - n.y) * 0.012; }
      n.vx += (cx - n.x) * 0.0009; n.vy += (cy - n.y) * 0.0009;
      if (NW.drag && NW.drag.n === n) return;
      n.vx *= 0.8; n.vy *= 0.8;
      var sp = Math.hypot(n.vx, n.vy); if (sp > 14) { n.vx *= 14 / sp; n.vy *= 14 / sp; }
      n.x += n.vx; n.y += n.vy;
      var rr = n.r * K + 4; n.x = Math.max(rr, Math.min(NW.w - rr, n.x)); n.y = Math.max(rr, Math.min(NW.h - rr, n.y));
    });
  }

  function nwFrame(now) {
    if (!NW || currentView !== "docs" || !$("#nwCanvas")) { if (NW && NW.ro) NW.ro.disconnect(); NW = null; return; }
    var el = now - NW.t0;
    NW.nodes.forEach(function (n) { if (!n.on && el >= n.spawn) nwSpawn(n); });
    if (!NW.ready && el >= NW_BUILD_MS) { NW.ready = true; $("#nwHint") && $("#nwHint").classList.add("done"); }
    nwStep();
    // Neuron scale: grow in on spawn, bump forward by 10% on hover
    NW.nodes.forEach(function (n) {
      if (!n.on) return;
      var target = n === NW.hover ? 1.1 : 1;
      if (!opts.motion) { n.s = target; return; }
      var age = (now - n.born) / 420;
      n.s = age < 1 ? (function (t) { var c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); })(age) * target : n.s + (target - n.s) * 0.1;
    });
    if (opts.motion && NW.ready && Math.random() < 0.18) {
      var live = NW.edges.filter(function (e) { return e.a.on && e.b.on; });
      if (live.length) NW.pulses.push({ e: live[Math.floor(Math.random() * live.length)], t: 0, rev: Math.random() < 0.5 });
    }
    nwDraw(now);
    nwTipMove(false);
    NW.raf = requestAnimationFrame(nwFrame);
  }

  function nwRelated(n) {
    if (!n) return null;
    var set = {}; set[n.id] = 1;
    NW.edges.forEach(function (e) { if (e.a === n) set[e.b.id] = 1; if (e.b === n) set[e.a.id] = 1; });
    return set;
  }
  function nwDraw(now) {
    var c = NW.ctx, dpr = NW.dpr, rel = nwRelated(NW.hover), q = NW.q, iso = NW.iso, ease = opts.motion ? 0.12 : 1;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, NW.w, NW.h);
    function lit(n) {
      if (rel) return !!rel[n.id];
      if (iso) return n.group === iso || n.kind === "core";
      if (q) return n.kind !== "doc" || n.label.toLowerCase().indexOf(q) > -1 || n.group.toLowerCase().indexOf(q) > -1;
      return true;
    }
    // Everything fades towards its state instead of switching: n.a is how lit a neuron is, NW.focus how strong the hover is
    NW.focus = (NW.focus || 0) + ((rel ? 1 : 0) - (NW.focus || 0)) * ease;
    NW.nodes.forEach(function (n) { var t = lit(n) ? 1 : 0; n.a = n.a == null ? t : n.a + (t - n.a) * ease; });
    function curve(e) {
      var a = e.a, b = e.b, mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, dx = b.x - a.x, dy = b.y - a.y, k = e.kind === "syn" ? 0.18 : 0.06;
      return { x: mx - dy * k, y: my + dx * k };
    }
    function mix(a, b, t) { return a + (b - a) * t; }
    // Synapses
    NW.edges.forEach(function (e) {
      if (!e.a.on || !e.b.on) return;
      var on = Math.min(e.a.a, e.b.a), f = NW.focus, col = nwColor(e.b.group || e.a.group), grow = Math.min(1, (now - Math.max(e.b.born || 0, e.born || 0)) / 260);
      if (!opts.motion) grow = 1;
      var ctl = curve(e), ex = e.a.x + (e.b.x - e.a.x) * grow, ey = e.a.y + (e.b.y - e.a.y) * grow;
      c.beginPath(); c.moveTo(e.a.x, e.a.y); c.quadraticCurveTo(e.a.x + (ctl.x - e.a.x) * grow, e.a.y + (ctl.y - e.a.y) * grow, ex, ey);
      c.strokeStyle = e.kind === "syn" ? rgba(col, mix(0.04, mix(0.16, 0.55, f), on)) : rgba(col, mix(0.07, mix(0.42, 0.85, f), on));
      c.lineWidth = e.kind === "trunk" ? 1.6 : e.kind === "branch" ? 1.1 : 0.8;
      if (e.kind === "syn") c.setLineDash([2, 4]); else c.setLineDash([]);
      c.stroke();
    });
    c.setLineDash([]);
    // Signals travelling along synapses
    NW.pulses = NW.pulses.filter(function (p) {
      p.t += 0.018; if (p.t >= 1) return false;
      var e = p.e, t = p.rev ? 1 - p.t : p.t, ctl = curve(e), u = 1 - t;
      var x = u * u * e.a.x + 2 * u * t * ctl.x + t * t * e.b.x, y = u * u * e.a.y + 2 * u * t * ctl.y + t * t * e.b.y;
      var col = nwColor(e.b.group || e.a.group), on = Math.min(e.a.a, e.b.a);
      c.beginPath(); c.arc(x, y, 1.8, 0, Math.PI * 2); c.fillStyle = rgba(col, mix(0.2, 0.95, on));
      c.shadowColor = col; c.shadowBlur = on > 0.5 ? 10 : 0; c.fill(); c.shadowBlur = 0;
      return true;
    });
    // Neurons, drawn back to front so the hovered one sits on top
    NW.nodes.slice().sort(function (a, b) { return (a === NW.hover) - (b === NW.hover); }).forEach(function (n) {
      if (!n.on || n.s <= 0.01) return;
      var col = n.kind === "core" ? "#ffffff" : nwColor(n.group), r = n.r * (NW.k || 1) * n.s, hov = n === NW.hover;
      c.globalAlpha = mix(0.22, 1, n.a);
      if (hov) { c.beginPath(); c.arc(n.x + 3, n.y + 6, r * 1.05, 0, Math.PI * 2); c.fillStyle = "rgba(0,0,0,.45)"; c.shadowColor = "rgba(0,0,0,.6)"; c.shadowBlur = 16; c.fill(); }
      var g = c.createRadialGradient(n.x - r * 0.35, n.y - r * 0.35, r * 0.1, n.x, n.y, r);
      g.addColorStop(0, rgba(col, 0.95)); g.addColorStop(0.6, rgba(col, n.kind === "doc" ? 0.55 : 0.35)); g.addColorStop(1, rgba(col, 0.12));
      c.beginPath(); c.arc(n.x, n.y, r, 0, Math.PI * 2); c.fillStyle = g;
      c.shadowColor = col; c.shadowBlur = hov ? 26 : n.kind === "doc" ? 8 : 16; c.fill(); c.shadowBlur = 0;
      c.lineWidth = hov ? 1.6 : 1; c.strokeStyle = rgba(col, hov ? 1 : 0.8); c.stroke();
      if (n.kind !== "doc") {
        var rot = opts.motion ? now / (n.kind === "core" ? 5200 : 3600) : 0;
        c.beginPath(); c.arc(n.x, n.y, r + 6, rot, rot + Math.PI * 1.4); c.strokeStyle = rgba(col, 0.55); c.lineWidth = 1; c.stroke();
        if (n.kind === "core") { c.beginPath(); c.arc(n.x, n.y, r + 12, -rot, -rot + Math.PI * 0.8); c.strokeStyle = rgba("#c9a24a", 0.6); c.stroke(); }
        c.font = (n.kind === "core" ? "500 12px " : "400 11px ") + "'Share Tech Mono', monospace";
        c.textAlign = "center"; c.textBaseline = "alphabetic"; c.fillStyle = rgba(n.kind === "core" ? "#ffffff" : col, 0.95);
        c.fillText(n.label.toUpperCase().split("").join(String.fromCharCode(8202)), n.x, n.y + r + (n.kind === "core" ? 28 : 20));
      }
      c.globalAlpha = 1;
    });
    nwLabels(c, rel, ease);
  }

  // Labels for the neighbours of the hovered neuron. Each label sits on the far side of its neuron,
  // is only shown where it does not overlap another label, a hub name or the tip, and fades in and out.
  function nwLabels(c, rel, ease) {
    var taken = [], h = NW.hover, K = NW.k || 1;
    if (NW.tipBox && NW.tipN) taken.push(NW.tipBox);
    NW.nodes.forEach(function (n) {
      if (n.on && n.kind !== "doc") { var r = n.r * K * n.s; taken.push({ x: n.x - 70, y: n.y - r - 4, w: 140, h: r * 2 + 34 }); }
    });
    c.font = "400 12px 'Barlow Semi Condensed', sans-serif"; c.textBaseline = "middle";
    var cand = NW.nodes.filter(function (n) { return n.on && n.kind === "doc" && rel && rel[n.id] && n !== h; });
    // Labels already showing keep their place first, so nothing flickers while the web moves
    cand.sort(function (a, b) { return (b.la || 0) - (a.la || 0) || Math.hypot(a.x - h.x, a.y - h.y) - Math.hypot(b.x - h.x, b.y - h.y); });
    var show = {};
    cand.forEach(function (n) {
      var txt = n.label.length > 30 ? n.label.slice(0, 29) + "…" : n.label, w = c.measureText(txt).width + 12, r = n.r * K * n.s;
      var dx = n.x - h.x, dy = n.y - h.y, d = Math.hypot(dx, dy) || 1, right = dx >= 0;
      var ax = n.x + (dx / d) * (r + 6), ay = n.y + (dy / d) * (r + 6);
      var box = { x: right ? ax : ax - w, y: ay - 9, w: w, h: 18 };
      if (box.x < 4 || box.x + w > NW.w - 4 || box.y < 4 || box.y + 18 > NW.h - 4) return;
      if (taken.some(function (t) { return box.x < t.x + t.w && box.x + box.w > t.x && box.y < t.y + t.h && box.y + box.h > t.y; })) return;
      taken.push(box); show[n.id] = 1; n.lbox = box; n.ltxt = txt;
    });
    NW.nodes.forEach(function (n) {
      if (n.kind !== "doc") return;
      var t = show[n.id] ? 1 : 0; n.la = (n.la || 0) + (t - (n.la || 0)) * ease;
      if (n.la < 0.02 || !n.lbox) return;
      var b = n.lbox, col = nwColor(n.group);
      c.globalAlpha = n.la;
      c.fillStyle = "rgba(7,10,11,.82)"; c.fillRect(b.x, b.y, b.w, b.h);
      c.fillStyle = col; c.fillRect(b.x, b.y, 2, b.h);
      c.fillStyle = "rgba(233,237,238,.92)"; c.textAlign = "left"; c.fillText(n.ltxt, b.x + 7, b.y + b.h / 2 + 0.5);
      c.globalAlpha = 1;
    });
    c.textBaseline = "alphabetic";
  }

  /* ---- Document windows: stack, minimize to dock, restore ---- */
  function nwDoc(id) { return NW.docs.filter(function (d) { return d.id === id; })[0]; }
  function nwOpen(id) {
    if (!NW) return;
    var d = nwDoc(id); if (!d) return;
    var mi = NW.min.indexOf(id);
    if (mi > -1) { nwRestore(id); return; }
    var oi = NW.open.indexOf(id);
    if (oi > -1) NW.open.splice(oi, 1);
    else if (NW.open.length + NW.min.length >= NW_MAX_DOCS) {
      var drop = NW.min.length ? NW.min.shift() : NW.open.shift();
      status(nwDoc(drop).title + " closed · up to " + NW_MAX_DOCS + " documents");
    }
    NW.open.push(id);
    blip("go");
    nwRender(id);
  }
  function nwContent(d) {
    if (NW.html[d.id]) return Promise.resolve(NW.html[d.id]);
    return loadDoc(d).then(function (md) { NW.text[d.id] = md; return (NW.html[d.id] = markdown(md, d.path)); });
  }
  function nwRender(animateId) {
    var stage = $("#nwStage"), wrap = $("#nw");
    if (!stage) return;
    wrap.classList.toggle("reading", NW.open.length > 0);
    var focus = NW.open[NW.open.length - 1];
    stage.innerHTML = NW.open.map(function (id) {
      var d = nwDoc(id), col = nwColor(d.group), f = id === focus;
      return '<section class="dwin' + (f ? " focus" : "") + (f && id === animateId ? " enter" : "") + '" data-id="' + esc(id) + '" style="--c:' + col + '">' +
        '<header class="dwin-h"' + (f ? "" : ' tabindex="0" role="button" aria-label="Bring ' + esc(d.title) + ' to front"') + '><i class="dot"></i><b>' + esc(d.title) + "</b><span>" + esc(d.group) + "</span>" +
        '<button class="wb" data-act="min" aria-label="Minimize ' + esc(d.title) + '">–</button><button class="wb" data-act="close" aria-label="Close ' + esc(d.title) + '">×</button></header>' +
        (f ? '<div class="dwin-b"><article class="doc a4" id="nwBody">' + loading("Opening " + d.title) + "</article></div>" +
          '<footer class="dwin-f"><span>' + esc(d.path) + '</span><button class="lnk nw-classic">Classic view</button><a href="' + esc(repoUrl("/blob/" + cfg.branch + "/" + d.path)) + '" target="_blank" rel="noopener noreferrer">View on GitHub</a></footer>' : "") +
        "</section>";
    }).join("");
    $$("#nwStage .nw-classic").forEach(function (b) { b.addEventListener("click", function () { $("#nwClassic").click(); }); });
    $$("#nwStage .dwin").forEach(function (w) {
      var id = w.dataset.id;
      w.querySelector('[data-act="min"]').addEventListener("click", function (e) { e.stopPropagation(); nwMinimize(id); });
      w.querySelector('[data-act="close"]').addEventListener("click", function (e) { e.stopPropagation(); nwClose(id); });
      if (!w.classList.contains("focus")) {
        var h = w.querySelector(".dwin-h");
        h.addEventListener("click", function () { nwOpen(id); });
        h.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); nwOpen(id); } });
      }
    });
    if (focus) {
      var d = nwDoc(focus);
      nwContent(d).then(function (html) {
        var b = $("#nwBody"); if (!b || !NW || NW.open[NW.open.length - 1] !== focus) return;
        b.innerHTML = html;
        $$("a[href^='#/docs/']", b).forEach(function (a) {
          a.addEventListener("click", function (e) { e.preventDefault(); nwOpen(a.getAttribute("href").slice(7)); });
        });
        led($("#ledInfo"), d.title);
      }, function () { var b = $("#nwBody"); if (b) b.innerHTML = '<div class="empty">Could not load this document<small>Open it on GitHub instead.</small></div>'; });
    }
    nwDock();
  }
  function nwFly(fromEl, toEl, done) {
    if (!opts.motion || !fromEl || !toEl || !fromEl.animate) { done(); return; }
    var a = fromEl.getBoundingClientRect(), b = toEl.getBoundingClientRect();
    var g = document.createElement("div"); g.className = "nw-ghost";
    g.style.cssText = "left:" + a.left + "px;top:" + a.top + "px;width:" + a.width + "px;height:" + a.height + "px";
    g.style.setProperty("--c", getComputedStyle(fromEl).getPropertyValue("--c") || "#c9a24a");
    document.body.appendChild(g);
    var sx = b.width / a.width, sy = b.height / a.height, tx = b.left - a.left, ty = b.top - a.top;
    g.animate([{ transform: "none", opacity: 1 }, { transform: "translate(" + tx + "px," + ty + "px) scale(" + sx + "," + sy + ")", opacity: 0.6 }],
      { duration: 340, easing: "cubic-bezier(.2,.8,.2,1)" }).onfinish = function () { g.remove(); done(); };
  }
  function nwMinimize(id) {
    var w = $('#nwStage .dwin[data-id="' + id + '"]');
    NW.open.splice(NW.open.indexOf(id), 1);
    NW.min.push(id);
    nwDock();
    var tab = $('#nwDock .dtab[data-id="' + id + '"]');
    if (tab) tab.style.visibility = "hidden";
    nwFly(w, tab, function () { if (tab) tab.style.visibility = ""; nwRender(); });
  }
  function nwRestore(id) {
    var tab = $('#nwDock .dtab[data-id="' + id + '"]');
    NW.min.splice(NW.min.indexOf(id), 1);
    NW.open.push(id);
    $("#nw").classList.add("reading");
    nwFly(tab, $("#nwStage"), function () { nwRender(id); });
    if (tab) tab.remove();
  }
  function nwClose(id) {
    var i = NW.open.indexOf(id); if (i > -1) NW.open.splice(i, 1);
    if (!NW.open.length && !NW.min.length) {
      // Interface closed: reset and rebuild the web from the first neuron
      nwRender();
      NW.hover = null; NW.iso = null; $$("#nwLegend .nw-chip").forEach(function (x) { x.classList.remove("on"); });
      setTimeout(function () { if (NW && $("#nw")) { $("#nwHint") && $("#nwHint").classList.remove("done"); nwBuild(); } }, opts.motion ? 420 : 0);
      led($("#ledInfo"), "Docs");
      return;
    }
    nwRender();
  }
  function nwDock() {
    var dock = $("#nwDock"); if (!dock) return;
    dock.classList.toggle("on", NW.min.length > 0);
    $("#nw").classList.toggle("docked", NW.min.length > 0);
    dock.innerHTML = NW.min.map(function (id) {
      var d = nwDoc(id), txt = (NW.text[id] || "").replace(/^(#|Code:|Status:|Author:).*$/gm, "").replace(/[#>*`|_\[\]()-]/g, " ").replace(/\s+/g, " ").trim().slice(0, 420);
      return '<button class="dtab" data-id="' + esc(id) + '" style="--c:' + nwColor(d.group) + '" aria-label="Restore ' + esc(d.title) + '">' +
        '<span class="pv" aria-hidden="true"><b>' + esc(d.title) + "</b><i>" + esc(d.group) + "</i><span>" + esc(txt) + "</span></span>" +
        '<i class="dot"></i><span class="tt">' + esc(d.title) + "</span></button>";
    }).join("");
    $$("#nwDock .dtab").forEach(function (t) { t.addEventListener("click", function () { nwRestore(t.dataset.id); }); });
  }
