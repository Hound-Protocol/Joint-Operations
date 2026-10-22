  /* ---------------- Boot ---------------- */
  function buildLabel() {
    var b = data.build;
    return "Build " + cfg.version + (b && b.build ? "." + b.build : "") + (b && b.sha ? " · " + String(b.sha).slice(0, 7) : "");
  }
  function applyConfig() {
    $("#teamName").textContent = cfg.team;
    $("#projectName").textContent = cfg.project;
    $("#tagline").textContent = cfg.tagline || "";
    $("#build").textContent = buildLabel() + " · " + cfg.stage;
    document.title = cfg.team + " · " + cfg.project;
    var logo = cfg.logo || {};
    if (logo.src) {
      var img = new Image(); img.alt = logo.alt || ""; img.src = logo.src;
      document.documentElement.style.setProperty("--logo-opacity", logo.opacity != null ? logo.opacity : 0.18);
      var box = $("#logo"); box.textContent = ""; box.appendChild(img);
    }
  }
  function preload() {
    Promise.all([loadLocal("servers"), loadLocal("mods"), loadLocal("docs"), loadLocal("contracts"), loadLocal("briefing"), loadLocal("devlog"), loadLocal("team"), loadRoadmap(), loadReleases(), loadContracts(), loadCommits()]).then(function () {
      refreshInfo();
      if (data.releases === null || data.issues === null) status("GitHub unreachable · showing bundled data");
    });
  }
  applyOpts();
  scheduleGlitch();
  renderMenu(); select(0, false);
  (EMBED && EMBED.config ? Promise.resolve(EMBED.config) : fetchJSON("data/config.json")).then(function (c) {
    cfg = Object.assign({}, DEFAULT_CFG, c, { links: Object.assign({}, DEFAULT_CFG.links, c.links), logo: Object.assign({}, DEFAULT_CFG.logo, c.logo), milestones: Object.assign({}, c.milestones) });
  }, function () { /* keep defaults */ }).then(function () {
    loadLocal("build").then(function () { applyConfig(); renderMenu(); select(cur, false); route(); preload(); });
  });
  window.addEventListener("hashchange", route);
