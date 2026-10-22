  /* Download */
  var dlOS = null;
  function guessOS() {
    var ua = (navigator.userAgent || "") + " " + (navigator.platform || "");
    return /Linux|X11|SteamOS/i.test(ua) && !/Android/i.test(ua) ? "linux" : "windows";
  }
  var DL_STEPS = {
    windows: ["Install Metal Gear Solid V from Steam and start it once.", "Download the latest release.", "Run the installer. It backs up your saves first.", "Start the game, then host a session or join one from the Session Browser."],
    linux: ["Install Metal Gear Solid V in Steam and start it once with Proton.", "Download the same release as Windows and install it into the game folder.", 'In Steam, open MGSV → Properties → Launch Options and paste:<br><code>WINEDLLOVERRIDES="dinput8=n,b" %command%</code>', 'Start the game. Full steps and Bazzite notes: <a href="#/guides/hp-gde-002">Linux and Proton Guide</a>.']
  };
  function viewDownload() {
    var v = $("#view");
    v.innerHTML = shell("Releases", "Download", loading("Checking releases on GitHub"));
    loadReleases().then(function (rel) {
      if (currentView !== "download") return;
      dlOS = dlOS || guessOS();
      var latest = playableReleases()[0], foundation = (rel || []).filter(function (r) { return !isPlayable(r); }).slice(0, 5);
      var files = latest ? (latest.assets || []) : [];
      var hero = latest
        ? '<div class="dl-hero ready"><div class="dl-main"><span class="kicker">Latest release · ' + (latest.prerelease ? "Pre-release" : "Stable") + '</span><h3>Joint Operations ' + esc(latest.tag_name) + '</h3><p>Published ' + fmtDate(latest.published_at) + ". Free and open source.</p>" +
            '<div class="dl-files">' + (files.length ? files.map(function (a) {
              return '<a class="btn primary" href="' + esc(a.browser_download_url) + '">' + esc(a.name) + ' <small>' + fmtBytes(a.size) + "</small></a>";
            }).join("") : '<span class="sub">This release has no attached files yet.</span>') + "</div>" +
            '<div class="toolbar"><a class="btn" href="' + esc(latest.html_url) + '" target="_blank" rel="noopener noreferrer">Release notes</a><a class="btn" href="' + repoUrl("/releases") + '" target="_blank" rel="noopener noreferrer">All releases</a></div></div></div>'
        : '<div class="dl-hero"><div class="dl-main"><span class="kicker">Playable release</span><h3>Joint Operations 0.1 is on its way</h3>' +
            "<p>" + (rel === null ? "GitHub could not be reached, so the latest status is not shown. Try again later." : "There is no playable version yet. When 0.1 is released, the download appears here automatically, for Windows and Linux.") + "</p>" +
            '<div class="dl-status"><div><span>Current build</span><b>' + esc(cfg.version) + '</b></div><div><span>Stage</span><b>' + esc(cfg.stage || "In development") + '</b></div><div><span>Next</span><b>0.1 · first playable</b></div></div>' +
            '<div class="toolbar"><a class="btn primary" href="#/roadmap">See the roadmap</a><a class="btn" href="#/contribute">Help test</a><a class="btn" href="' + repoUrl("/archive/refs/heads/" + cfg.branch + ".zip") + '">Source code (zip)</a></div></div></div>';
      var req = [["Game", "Your own copy of MGSV: The Phantom Pain on Steam"], ["Windows", "Windows 10 or 11"], ["Linux", "Through Proton, including Steam Deck and Bazzite"], ["Online", "Steam running. No ports to open"], ["Players", "Up to 16 per session"], ["Price", "Free"]];
      var body = hero +
        '<div class="dl-grid"><section class="panel"><div class="label">Install</div>' +
          '<div class="tabs small" role="tablist">' + [["windows", "Windows"], ["linux", "Linux · Proton"]].map(function (t) {
            return '<button role="tab" data-os="' + t[0] + '" aria-selected="' + (dlOS === t[0]) + '">' + (t[0] === "windows" ? ICON_WIN : ICON_LNX) + t[1] + "</button>";
          }).join("") + "</div>" +
          '<ol class="steps" id="dlSteps">' + DL_STEPS[dlOS].map(function (s) { return "<li>" + s + "</li>"; }).join("") + "</ol>" +
          '<p class="sub">We guessed your system from your browser. Pick the other tab if that is wrong.</p></section>' +
        '<section class="panel"><div class="label">Requirements</div><dl class="dl-req">' + req.map(function (r) { return "<div><dt>" + r[0] + "</dt><dd>" + r[1] + "</dd></div>"; }).join("") + "</dl></section></div>" +
        (foundation.length ? '<section class="panel" style="margin-top:14px"><div class="label">Foundation builds · not playable</div><ul class="dl-hist">' + foundation.map(function (r) {
          return '<li><a href="' + esc(r.html_url) + '" target="_blank" rel="noopener noreferrer"><b>' + esc(r.tag_name) + "</b><span>" + esc((r.name || "").replace(/^Release\s+v?[\d.]+:?\s*/i, "") || "Foundation release") + "</span><small>" + fmtDate(r.published_at) + "</small></a></li>";
        }).join("") + '</ul><p class="sub">Foundation builds update the website, docs and tools. The game mod starts with 0.1.</p></section>' : "") +
        '<p class="note">You need your own copy of Metal Gear Solid V. Joint Operations never includes game files and never connects to Konami\'s servers. Step-by-step help: <a href="#/guides/hp-gde-001">Player Guide</a>.</p>';
      v.querySelector("#vb").innerHTML = body;
      $$('[data-os]').forEach(function (b) {
        b.addEventListener("click", function () {
          dlOS = b.dataset.os;
          $$('[data-os]').forEach(function (x) { x.setAttribute("aria-selected", String(x === b)); });
          $("#dlSteps").innerHTML = DL_STEPS[dlOS].map(function (s) { return "<li>" + s + "</li>"; }).join("");
        });
      });
      refreshInfo();
    });
  }
