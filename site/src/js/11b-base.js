  /* ---------------- Roadmap: the base under construction ----------------
     Seen from above. Phase 0 is the command platform in the centre, every later phase is a platform on its own bridge.
     The fill inside a platform is the share of that phase's tasks that are done. Point at a platform to light it,
     click it to read its tasks on the right. The motion (boats, crews, cranes, a helicopter) is decoration only. */
  var MB_NAMES = ["Command", "R&D", "Combat", "Base Development", "Support", "Intel", "Medical"];
  var MB_SLOTS = [[-300, -178], [300, -178], [300, 178], [-300, 178], [0, -282], [0, 282]];
  var MB_W = 1100, MB_H = 720, MB_CX = 550, MB_CY = 360;
  var MB = null;
  function mbRng(seed) { var s = (seed >>> 0) || 1; return function () { s = (Math.imul ? Math.imul(s, 1664525) : s * 1664525) + 1013904223 >>> 0; return s / 4294967296; }; }
  function mbRot(p, a) { var c = Math.cos(a), s = Math.sin(a); return [p[0] * c - p[1] * s, p[0] * s + p[1] * c]; }
  function mbF(n) { return (Math.round(n * 10) / 10).toString(); }
  function mbState(p, now) { return p.total && p.done === p.total ? "done" : (p === now || p.done > 0 ? "now" : "next"); }

  /* Platform outline in local units: +x points away from the command platform */
  function mbGeom(i, core) {
    var r = mbRng(i * 97 + 13), K = 1.3, R = core ? 80 : 56, sh = [], hex = [], k, zones = [];
    for (k = 0; k < 6; k++) { var a = Math.PI / 3 * k + Math.PI / 6; hex.push([Math.cos(a) * R, Math.sin(a) * R]); }
    sh.push({ t: "poly", p: hex });
    zones.push({ t: "disc", x: 0, y: 0, r: R * 0.62 });
    var flat = R * Math.cos(Math.PI / 6), pad;
    if (core) {
      sh.push({ t: "rect", x: -34, y: -R - 34, w: 68, h: 44 });
      sh.push({ t: "rect", x: -34, y: R - 10, w: 68, h: 44 });
      pad = { x: 0, y: -R - 58, r: 26 };
      zones.push({ t: "rect", x: -28, y: R - 2, w: 56, h: 28 });
    } else {
      var L = Math.round((50 + r() * 20) * K), side = r() < 0.5 ? -1 : 1, off = Math.round((-20 + r() * 12) * K);
      sh.push({ t: "rect", x: flat - 6, y: -22, w: L, h: 44 });
      sh.push({ t: "rect", x: off, y: side > 0 ? R - 12 : -R - 32, w: 54, h: 44 });
      pad = { x: flat + L + 18, y: 0, r: 26 };
      zones.push({ t: "rect", x: flat, y: -15, w: L - 12, h: 30 });
      zones.push({ t: "rect", x: off + 8, y: side > 0 ? R - 4 : -R - 24, w: 38, h: 28 });
    }
    sh.push({ t: "circ", x: pad.x, y: pad.y, r: pad.r });
    return { sh: sh, R: R, pad: pad, zones: zones };
  }
  function mbShapeSvg(s, deg, cls) {
    var tr = ' transform="rotate(' + mbF(deg) + ')"', c = cls ? ' class="' + cls + '"' : "";
    if (s.t === "poly") return "<polygon" + c + tr + ' points="' + s.p.map(function (q) { return mbF(q[0]) + "," + mbF(q[1]); }).join(" ") + '"/>';
    if (s.t === "rect") return "<rect" + c + tr + ' x="' + s.x + '" y="' + s.y + '" width="' + s.w + '" height="' + s.h + '"/>';
    return "<circle" + c + tr + ' cx="' + mbF(s.x) + '" cy="' + mbF(s.y) + '" r="' + s.r + '"/>';
  }
  function mbExtent(sh, a) {
    var e = [1e9, 1e9, -1e9, -1e9];
    function add(p, pad) { var q = mbRot(p, a); e[0] = Math.min(e[0], q[0] - pad); e[1] = Math.min(e[1], q[1] - pad); e[2] = Math.max(e[2], q[0] + pad); e[3] = Math.max(e[3], q[1] + pad); }
    sh.forEach(function (s) {
      if (s.t === "poly") s.p.forEach(function (p) { add(p, 0); });
      else if (s.t === "rect") { add([s.x, s.y], 0); add([s.x + s.w, s.y], 0); add([s.x, s.y + s.h], 0); add([s.x + s.w, s.y + s.h], 0); }
      else add([s.x, s.y], s.r);
    });
    return e;
  }
  function mbPick(m, r) {
    var z = m.g.zones[Math.floor(r() * m.g.zones.length)], p;
    if (z.t === "disc") { var a = r() * Math.PI * 2, d = Math.sqrt(r()) * z.r; p = [Math.cos(a) * d, Math.sin(a) * d]; }
    else p = [z.x + r() * z.w, z.y + r() * z.h];
    p = mbRot(p, m.a);
    return [m.x + p[0], m.y + p[1]];
  }
  function mbWorld(m, lp) { var p = mbRot(lp, m.a); return [m.x + p[0], m.y + p[1]]; }

  function mbBuild(r, now) {
    var mods = r.map(function (p, i) {
      var core = i === 0, slot = core ? [0, 0] : MB_SLOTS[(i - 1) % MB_SLOTS.length];
      var a = core ? 0 : Math.atan2(slot[1], slot[0]), g = mbGeom(i, core), ext = mbExtent(g.sh, a);
      return { i: i, p: p, core: core, x: MB_CX + slot[0], y: MB_CY + slot[1], a: a, deg: a * 180 / Math.PI, g: g, ext: ext,
        pct: p.total ? Math.round(p.done / p.total * 100) : 0, st: mbState(p, now), name: MB_NAMES[i] || ("Platform " + i) };
    });
    var defs = '<defs><filter id="mbGlow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
      mods.map(function (m) { return '<clipPath id="mbClip' + m.i + '">' + m.g.sh.map(function (s) { return mbShapeSvg(s, m.deg); }).join("") + "</clipPath>"; }).join("") + "</defs>";
    var bridges = mods.filter(function (m) { return !m.core; }).map(function (m) {
      var built = m.st !== "next", x1 = MB_CX, y1 = MB_CY, x2 = m.x, y2 = m.y, len = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1)), ux = (x2 - x1) / len, uy = (y2 - y1) / len, piers = "";
      for (var d = 110; d < len - 70; d += 46) piers += '<rect class="mb-pier" x="' + mbF(x1 + ux * d - 4) + '" y="' + mbF(y1 + uy * d - 4) + '" width="8" height="8"/>';
      var line = 'x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '"';
      return '<g class="mb-bridge ' + (built ? "built" : "plan") + '">' + (built ? piers + '<line class="b-edge" ' + line + "/>" : "") + '<line class="b-deck" ' + line + "/></g>";
    }).join("");
    var plats = mods.map(function (m) {
      var e = m.ext, H = e[3] - e[1], label = "Phase " + m.p.n + ": " + m.p.title + ", " + m.pct + "% complete";
      var details = '<g class="mb-mark">' +
        mbShapeSvg({ t: "poly", p: m.g.sh[0].p.map(function (q) { return [q[0] * 0.7, q[1] * 0.7]; }) }, m.deg) +
        mbShapeSvg({ t: "circ", x: m.g.pad.x, y: m.g.pad.y, r: 16 }, m.deg) + "</g>";
      var padC = mbRot([m.g.pad.x, m.g.pad.y], m.a);
      details += '<text class="mb-h" x="' + mbF(padC[0]) + '" y="' + mbF(padC[1] + 4) + '">H</text>';
      return '<g class="mb-mod st-' + m.st + (m.core ? " core" : "") + '" data-i="' + m.i + '" tabindex="0" role="button" aria-pressed="false" aria-label="' + esc(label) + '" transform="translate(' + m.x + " " + m.y + ')">' +
        '<g class="mb-edge">' + m.g.sh.map(function (s) { return mbShapeSvg(s, m.deg); }).join("") + "</g>" +
        '<g class="mb-deck">' + m.g.sh.map(function (s) { return mbShapeSvg(s, m.deg); }).join("") + "</g>" +
        '<g clip-path="url(#mbClip' + m.i + ')"><rect class="mb-fill" x="' + mbF(e[0] - 2) + '" y="' + mbF(e[3]) + '" width="' + mbF(e[2] - e[0] + 4) + '" height="0"/>' +
        '<line class="mb-lvl" x1="' + mbF(e[0]) + '" x2="' + mbF(e[2]) + '" y1="' + mbF(e[3]) + '" y2="' + mbF(e[3]) + '"/></g>' +
        details +
        '<text class="mb-pct" x="0" y="' + mbF(e[1] - 16) + '">0%</text>' +
        '<text class="mb-name" x="0" y="' + mbF(e[3] + 30) + '">' + esc("P" + m.p.n + " · " + m.name) + "</text>" +
        "</g>";
    }).join("");
    var water = "";
    for (var w = 0; w < 34; w++) water += '<line class="mb-wave"/>';
    var svg = '<svg class="mb-svg" viewBox="0 0 ' + MB_W + " " + MB_H + '" role="group" aria-label="Base under construction: one platform per roadmap phase">' + defs +
      '<g class="mb-water">' + water + '<g id="mbBoats"></g></g>' +
      '<g class="mb-bridges">' + bridges + '<g id="mbWalk"></g></g>' +
      '<g class="mb-plats">' + plats + "</g>" +
      '<g class="mb-fx" aria-hidden="true"><g id="mbCrew"></g><g id="mbCranes"></g><g id="mbHeli"></g></g>' +
      '<g class="mb-hud" aria-hidden="true"><path d="M14 40V14h26M1086 40V14h-26M14 680v26h26M1086 680v26h-26"/>' +
      '<g transform="translate(1046 80)"><circle r="18"/><path d="M0 -14L5 4 0 0-5 4z"/><text y="-24">N</text></g></g>' +
      "</svg>";
    return { mods: mods, svg: svg };
  }

  function mbPanel(m) {
    var p = m.p, word = { now: "Under construction", done: "Complete", next: "Planned" }[m.st], pill = { now: "warn", done: "ok", next: "" }[m.st];
    return '<div class="mb-p st-' + m.st + '"><div class="kicker">Phase ' + p.n + " · " + esc(m.name) + (m.core ? " platform (foundation)" : " platform") + "</div>" +
      "<h3>" + esc(p.title) + "</h3>" +
      '<div class="mb-big"><b>' + m.pct + '%</b><span class="pill ' + pill + '">' + word + "</span></div>" +
      '<div class="meter"><i style="width:' + m.pct + '%"></i></div>' +
      '<p class="mb-count">' + p.done + " of " + plural(p.total, "task") + " done</p>" +
      '<ul class="rm-items">' + p.items.map(function (it) { return '<li class="' + (it.done ? "done" : "") + '">' + inline(it.text, "ROADMAP.md") + "</li>"; }).join("") + "</ul></div>";
  }

  function mbStop() { if (MB && MB.raf) cancelAnimationFrame(MB.raf); MB = null; }

  function viewRoadmap() {
    mbStop();
    var v = $("#view");
    v.innerHTML = shell("Plan", "Roadmap", loading("Loading roadmap"));
    loadRoadmap().then(function () {
      if (currentView !== "roadmap") return;
      var r = data.roadmap || [], now = currentPhase();
      if (!r.length) { $("#vb").innerHTML = '<div class="empty">Roadmap unavailable<small>ROADMAP.md could not be loaded.</small></div>'; return; }
      var all = r.reduce(function (a, p) { return [a[0] + p.done, a[1] + p.total]; }, [0, 0]);
      var b = mbBuild(r, now);
      $("#vb").innerHTML = '<div class="bf"><section class="bf-sec">' +
        '<div class="mb-head"><div><span class="kicker">Base construction</span><b>' + (all[1] ? Math.round(all[0] / all[1] * 100) : 0) + "%</b><small>" + all[0] + " of " + all[1] + " tasks done</small></div>" +
        '<ul class="mb-key"><li class="k-done">Complete</li><li class="k-now">Under construction</li><li class="k-next">Planned</li></ul></div>' +
        '<div class="mb"><div class="mb-map">' + b.svg + '<p class="mb-hint">Point at a platform to light it, click it to see its progress</p></div>' +
        '<aside class="mb-panel" id="mbPanel" aria-live="polite"></aside></div>' +
        '<p class="source">Read live from <a href="' + repoUrl("/blob/" + cfg.branch + "/ROADMAP.md") + '" target="_blank" rel="noopener noreferrer">ROADMAP.md</a> · Phase 0 is the command platform in the centre · each phase starts when the one before it is done</p>' +
        "</section></div>";
      mbStart(b.mods, r.indexOf(now));
      revealSections();
      refreshInfo();
    });
  }

  function mbStart(mods, nowIdx) {
    var svg = $(".mb-svg"), r = mbRng(7);
    MB = { svg: svg, mods: mods, sel: -1, t: 0, last: 0, raf: 0, fill: 0 };
    function select(i, quiet) {
      MB.sel = i;
      $$(".mb-mod").forEach(function (g) { var on = +g.getAttribute("data-i") === i; g.classList.toggle("sel", on); g.setAttribute("aria-pressed", String(on)); });
      var pn = $("#mbPanel"); pn.innerHTML = mbPanel(mods[i]);
      if (!quiet) { blip("go"); status("Phase " + mods[i].p.n + " · " + mods[i].p.title); if (window.innerWidth <= 900 && pn.scrollIntoView) pn.scrollIntoView({ behavior: opts.motion ? "smooth" : "auto", block: "nearest" }); }
    }
    $$(".mb-mod").forEach(function (g) {
      var i = +g.getAttribute("data-i");
      g.addEventListener("click", function () { select(i); });
      g.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(i); } });
      g.addEventListener("mouseenter", function () { blip(); });
    });
    select(nowIdx < 0 ? 0 : nowIdx, true);

    /* Scene: crews per platform (busy where work is happening), walkers on built bridges, cranes on the current platform,
       supply boats, waves and one helicopter shuttling between the command platform and the current one */
    var crew = [], walk = [], cranes = [], boats = [], waves = [], sparks = [], html;
    var cur = mods[nowIdx < 0 ? 0 : nowIdx];
    mods.forEach(function (m) {
      var n = m.st === "now" ? (m.core ? 14 : 11) : m.st === "done" ? (m.core ? 6 : 4) : 2;
      for (var k = 0; k < n; k++) { var p = mbPick(m, r); crew.push({ m: m, x: p[0], y: p[1], tx: p[0], ty: p[1], wait: r() * 2, sp: m.st === "next" ? 7 : 12 + r() * 8 }); }
      if (m.st === "now") {
        [[-m.g.R * 0.35, -m.g.R * 0.3], [m.g.R * 0.3, m.g.R * 0.32]].forEach(function (lp, k) { var w = mbWorld(m, lp); cranes.push({ x: w[0], y: w[1], base: r() * 360, ph: k * 2.1, sp: 0.25 + r() * 0.2 }); });
        for (var s = 0; s < 4; s++) sparks.push({ m: m, x: 0, y: 0, on: 0, next: r() * 2 });
      }
      if (!m.core && m.st !== "next") for (var q = 0; q < 3; q++) walk.push({ m: m, u: r(), d: r() < 0.5 ? 1 : -1, lane: (q % 2 ? 2.4 : -2.4), sp: 0.035 + r() * 0.03 });
    });
    for (var bI = 0; bI < 4; bI++) boats.push({ st: "in", x: 0, y: 0, tx: 0, ty: 0, wait: 0, trail: [], tick: 0, h: 0, delay: bI * 3.5 });
    for (var wI = 0; wI < 34; wI++) waves.push({ x: r() * MB_W, y: r() * MB_H, l: 10 + r() * 18, sp: 4 + r() * 6, o: 0.05 + r() * 0.1 });

    html = crew.map(function (c) { return '<circle class="mb-man st-' + c.m.st + '" r="1.9"/>'; }).join("") + sparks.map(function () { return '<circle class="mb-spark" r="2.6"/>'; }).join("");
    $("#mbCrew").innerHTML = html;
    $("#mbWalk").innerHTML = walk.map(function () { return '<circle class="mb-man st-done" r="1.7"/>'; }).join("");
    $("#mbCranes").innerHTML = cranes.map(function () { return '<g class="mb-crane"><rect x="-4" y="-4" width="8" height="8"/><line x1="-9" y1="0" x2="34" y2="0"/><circle cx="34" cy="0" r="2"/></g>'; }).join("");
    $("#mbBoats").innerHTML = boats.map(function () { return '<polyline class="mb-wake"/><polygon class="mb-hull" points="13,0 6,-4.6 -11,-4.6 -11,4.6 6,4.6"/>'; }).join("");
    $("#mbHeli").innerHTML = '<ellipse class="mb-hsh" rx="7" ry="3"/><g class="mb-heli"><g class="hb"><ellipse rx="6.5" ry="2.8"/><line x1="-5" y1="0" x2="-16" y2="0"/><line x1="-16" y1="-3" x2="-16" y2="3"/></g><line class="rotor" x1="-11" y1="0" x2="11" y2="0"/><line class="rotor" x1="0" y1="-11" x2="0" y2="11"/></g>';
    var menEl = $$("#mbCrew .mb-man"), spEl = $$("#mbCrew .mb-spark"), walkEl = $$("#mbWalk circle"), crEl = $$("#mbCranes .mb-crane"),
      wakeEl = $$("#mbBoats .mb-wake"), hullEl = $$("#mbBoats .mb-hull"), waveEl = $$(".mb-wave"), fills = $$(".mb-fill"), lvls = $$(".mb-lvl"), pcts = $$(".mb-pct"),
      hsh = $("#mbHeli .mb-hsh"), heli = $("#mbHeli .mb-heli"), hb = $("#mbHeli .hb"), rot = $$("#mbHeli .rotor");
    function padOf(m) { return mbWorld(m, [m.g.pad.x, m.g.pad.y]); }
    var hp = padOf(mods[0]), H = { x: hp[0], y: hp[1], from: mods[0], to: cur === mods[0] ? (mods[1] || mods[0]) : cur, st: "wait", t: 1.5, alt: 0, h: -40 };
    function edgePoint() { var s = Math.floor(r() * 4), u = r(); return s === 0 ? [u * MB_W, -24] : s === 1 ? [MB_W + 24, u * MB_H] : s === 2 ? [u * MB_W, MB_H + 24] : [-24, u * MB_H]; }
    function dockFor() {
      var pick = r(), m = pick < 0.55 ? cur : pick < 0.8 ? mods[0] : mods[Math.floor(r() * mods.length)];
      if (m.core) return [m.x + (r() - 0.5) * 80, m.y + m.g.R + 84];
      var dx = Math.cos(m.a), dy = Math.sin(m.a), reach = Math.max(m.ext[2] - m.ext[0], m.ext[3] - m.ext[1]) / 2 + 22, side = (r() - 0.5) * 70;
      return [Math.max(20, Math.min(MB_W - 20, m.x + dx * reach - dy * side)), Math.max(20, Math.min(MB_H - 20, m.y + dy * reach + dx * side))];
    }
    boats.forEach(function (b) { var e = edgePoint(), d = dockFor(); b.x = e[0]; b.y = e[1]; b.tx = d[0]; b.ty = d[1]; });

    function ease(t) { return 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3); }
    function step(dt) {
      MB.t += dt; MB.fill = Math.min(1, MB.fill + dt / 1.6);
      var T = MB.t, f = ease(MB.fill);
      mods.forEach(function (m, i) {
        var e = m.ext, hgt = (e[3] - e[1]) * m.pct / 100 * f, y = e[3] - hgt;
        fills[i].setAttribute("y", mbF(y)); fills[i].setAttribute("height", mbF(hgt));
        lvls[i].setAttribute("y1", mbF(y)); lvls[i].setAttribute("y2", mbF(y)); lvls[i].style.opacity = hgt > 0.5 && m.pct < 100 ? "" : "0";
        pcts[i].textContent = Math.round(m.pct * f) + "%";
      });
      waves.forEach(function (w, i) { w.x += w.sp * dt; if (w.x > MB_W + 30) w.x = -30; var el = waveEl[i]; el.setAttribute("x1", mbF(w.x)); el.setAttribute("x2", mbF(w.x + w.l)); el.setAttribute("y1", mbF(w.y)); el.setAttribute("y2", mbF(w.y)); el.style.opacity = w.o; });
      crew.forEach(function (c, i) {
        if (c.wait > 0) c.wait -= dt;
        else {
          var dx = c.tx - c.x, dy = c.ty - c.y, d = Math.sqrt((dx) * (dx) + (dy) * (dy)), s = c.sp * dt;
          if (d <= s) { c.x = c.tx; c.y = c.ty; c.wait = 0.4 + r() * 2.4; var p = mbPick(c.m, r); c.tx = p[0]; c.ty = p[1]; }
          else { c.x += dx / d * s; c.y += dy / d * s; }
        }
        menEl[i].setAttribute("cx", mbF(c.x)); menEl[i].setAttribute("cy", mbF(c.y));
      });
      sparks.forEach(function (s, i) {
        s.next -= dt;
        if (s.next <= 0) { var p = mbPick(s.m, r); s.x = p[0]; s.y = p[1]; s.on = 0.25 + r() * 0.35; s.next = s.on + 0.6 + r() * 2.2; }
        s.on -= dt;
        spEl[i].setAttribute("cx", mbF(s.x)); spEl[i].setAttribute("cy", mbF(s.y)); spEl[i].style.opacity = s.on > 0 ? (0.5 + 0.5 * Math.sin(T * 60)).toFixed(2) : "0";
      });
      walk.forEach(function (w, i) {
        w.u += w.d * w.sp * dt; if (w.u > 1) { w.u = 1; w.d = -1; } if (w.u < 0) { w.u = 0; w.d = 1; }
        var x1 = MB_CX, y1 = MB_CY, x2 = w.m.x, y2 = w.m.y, len = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1)), ux = (x2 - x1) / len, uy = (y2 - y1) / len, d = 90 + w.u * (len - 160);
        walkEl[i].setAttribute("cx", mbF(x1 + ux * d - uy * w.lane)); walkEl[i].setAttribute("cy", mbF(y1 + uy * d + ux * w.lane));
      });
      cranes.forEach(function (c, i) {
        var ang = c.base + 55 * Math.sin(T * c.sp + c.ph);
        crEl[i].setAttribute("transform", "translate(" + mbF(c.x) + " " + mbF(c.y) + ") rotate(" + mbF(ang) + ")");
      });
      boats.forEach(function (b, i) {
        if (b.delay > 0) { b.delay -= dt; hullEl[i].style.opacity = "0"; wakeEl[i].style.opacity = "0"; return; }
        hullEl[i].style.opacity = ""; wakeEl[i].style.opacity = "";
        if (b.st === "dock") { b.wait -= dt; if (b.wait <= 0) { var e = edgePoint(); b.tx = e[0]; b.ty = e[1]; b.st = "out"; } }
        else {
          var dx = b.tx - b.x, dy = b.ty - b.y, d = Math.sqrt((dx) * (dx) + (dy) * (dy)), sp = 34 * (b.st === "in" ? Math.min(1, d / 60) + 0.12 : 1), s = sp * dt;
          b.h = Math.atan2(dy, dx) * 180 / Math.PI;
          if (d <= s) {
            b.x = b.tx; b.y = b.ty;
            if (b.st === "in") { b.st = "dock"; b.wait = 2.5 + r() * 4; }
            else { var e2 = edgePoint(), dk = dockFor(); b.x = e2[0]; b.y = e2[1]; b.tx = dk[0]; b.ty = dk[1]; b.st = "in"; b.trail = []; }
          } else { b.x += dx / d * s; b.y += dy / d * s; }
        }
        b.tick += dt; if (b.tick > 0.12) { b.tick = 0; b.trail.push([b.x, b.y]); if (b.trail.length > 16) b.trail.shift(); }
        if (b.st === "dock" && b.trail.length) b.trail.shift();
        hullEl[i].setAttribute("transform", "translate(" + mbF(b.x) + " " + mbF(b.y) + ") rotate(" + mbF(b.h) + ")");
        wakeEl[i].setAttribute("points", b.trail.map(function (p) { return mbF(p[0]) + "," + mbF(p[1]); }).join(" ") + " " + mbF(b.x) + "," + mbF(b.y));
      });
      /* Helicopter: wait on a pad, lift, fly, settle */
      H.t -= dt;
      if (H.st === "wait") { H.alt = Math.max(0, H.alt - dt * 0.8); if (H.t <= 0) { H.st = "fly"; H.t = 0; var a2 = padOf(H.to); H.sx = H.x; H.sy = H.y; H.ex = a2[0]; H.ey = a2[1]; H.dur = Math.max(2.5, Math.sqrt((H.ex - H.sx) * (H.ex - H.sx) + (H.ey - H.sy) * (H.ey - H.sy)) / 90); H.h = Math.atan2(H.ey - H.sy, H.ex - H.sx) * 180 / Math.PI; } }
      else {
        H.t += 2 * dt; var k = Math.min(1, H.t / H.dur), e3 = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        H.x = H.sx + (H.ex - H.sx) * e3; H.y = H.sy + (H.ey - H.sy) * e3; H.alt = Math.min(1, H.alt + dt);
        if (k >= 1) { H.st = "wait"; H.t = 3 + r() * 3; var nx = H.to === mods[0] ? (cur === mods[0] ? mods[1 + Math.floor(r() * (mods.length - 1))] || mods[0] : cur) : mods[0]; H.from = H.to; H.to = nx; }
      }
      var off = 3 + H.alt * 12;
      hsh.setAttribute("cx", mbF(H.x + off)); hsh.setAttribute("cy", mbF(H.y + off * 1.3)); hsh.style.opacity = (0.35 - H.alt * 0.15).toFixed(2);
      heli.setAttribute("transform", "translate(" + mbF(H.x) + " " + mbF(H.y) + ") scale(" + (1 + H.alt * 0.18).toFixed(2) + ")");
      hb.setAttribute("transform", "rotate(" + mbF(H.h) + ")");
      var spin = T * (H.st === "wait" && H.alt < 0.05 ? 160 : 1500);
      rot[0].setAttribute("transform", "rotate(" + mbF(spin % 360) + ")"); rot[1].setAttribute("transform", "rotate(" + mbF(spin % 360) + ")");
    }
    if (!opts.motion) { MB.fill = 1; step(0); return; }
    step(0);
    function frame(ts) {
      if (!MB || currentView !== "roadmap" || !document.body.contains(svg)) { mbStop(); return; }
      var dt = MB.last ? Math.min(0.05, (ts - MB.last) / 1000) : 0; MB.last = ts;
      step(dt);
      MB.raf = requestAnimationFrame(frame);
    }
    MB.raf = requestAnimationFrame(frame);
  }
