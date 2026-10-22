  /* Download */
  function viewDownload() {
    var v = $("#view");
    v.innerHTML = shell("Releases", "Download", loading("Checking releases on GitHub"));
    loadReleases().then(function (rel) {
      if (currentView !== "download") return;
      var latest = playableReleases()[0], body = "", pre = "";
      body += '<div class="cols">';
      if (latest) {
        body += '<div class="panel"><div class="label">Latest release</div>' +
          '<div class="kv"><span>Version</span><b>' + esc(latest.tag_name) + "</b></div>" +
          '<div class="kv"><span>Name</span><b>' + esc(latest.name || latest.tag_name) + "</b></div>" +
          '<div class="kv"><span>Published</span><b>' + fmtDate(latest.published_at) + "</b></div>" +
          '<div class="kv"><span>Channel</span><b>' + (latest.prerelease ? '<span class="pill warn">Pre-release</span>' : '<span class="pill ok">Stable</span>') + "</b></div>" +
          '<div class="label">Files</div>' +
          ((latest.assets || []).length ? '<ul class="release-assets">' + latest.assets.map(function (a) {
            return "<li><span>" + esc(a.name) + '<br><small class="sub">' + fmtBytes(a.size) + " · " + plural(a.download_count || 0, "download") + '</small></span><a class="btn primary small" href="' + esc(a.browser_download_url) + '">Download</a></li>';
          }).join("") + "</ul>" : '<p class="sub">This release has no attached files.</p>') +
          '<div class="toolbar" style="margin-top:12px"><a class="btn" href="' + esc(latest.html_url) + '" target="_blank" rel="noopener noreferrer">Release notes</a><a class="btn" href="' + repoUrl("/releases") + '" target="_blank" rel="noopener noreferrer">All releases</a></div></div>';
      } else {
        pre = milestone("download");
        body += '<div class="panel"><div class="label">Release status</div>' +
          '<div class="kv"><span>Build</span><b>' + esc(cfg.version) + "</b></div>" +
          '<div class="kv"><span>Stage</span><b><span class="pill warn">' + esc(cfg.stage) + "</span></b></div>" +
          '<div class="kv"><span>Playable release</span><b>' + (rel === null ? "Could not reach GitHub" : "Coming with 0.1") + "</b></div>" +
          '<p class="sub" style="margin-top:12px">' + (rel === null ? "GitHub could not be reached. Releases will show here when it responds." : "No playable version yet. When 0.1 is released, it appears here automatically.") + "</p>" +
          '<div class="toolbar"><a class="btn" href="' + repoUrl("/releases") + '" target="_blank" rel="noopener noreferrer">Releases on GitHub</a>' +
          '<a class="btn" href="' + repoUrl("/archive/refs/heads/" + cfg.branch + ".zip") + '">Source code (zip)</a></div></div>';
      }
      body += '<div class="panel"><div class="label">Requirements</div>' +
        '<div class="kv"><span>Game</span><b>Your own copy of MGSV on Steam</b></div>' +
        '<div class="kv"><span>Windows</span><b>Supported</b></div>' +
        '<div class="kv"><span>Linux</span><b>Supported through Proton</b></div>' +
        '<div class="kv"><span>Online play</span><b>Steam client running</b></div>' +
        '<div class="kv"><span>Players</span><b>Up to 16 per session</b></div></div>';
      body += "</div>";
      body += '<div class="cols" style="margin-top:14px">' +
        '<div class="panel"><div class="platform">' + ICON_WIN + "Windows</div><ol class=\"steps\">" +
        "<li>Install MGSV from Steam and start it once.</li><li>Download the latest release above.</li><li>Run the installer. It backs up your saves.</li><li>Start the game. Host a session or join one from the Session Browser.</li></ol></div>" +
        '<div class="panel"><div class="platform">' + ICON_LNX + "Linux (Proton)</div><ol class=\"steps\">" +
        "<li>Install MGSV in Steam and start it once with Proton.</li><li>Download the same release as Windows and install it into the game folder.</li><li>In Steam, open MGSV → Properties → Launch Options and paste:<br><code>WINEDLLOVERRIDES=\"dinput8=n,b\" %command%</code></li><li>Start the game. Full steps in the <a href=\"#/guides/hp-gde-002\">Linux and Proton Guide</a>.</li></ol></div></div>";
      body += '<p class="note">You need your own copy of Metal Gear Solid V. Joint Operations never includes game files. Step-by-step help: <a href="#/guides/hp-gde-001">Player Guide</a>.</p>';
      v.querySelector("#vb").innerHTML = pre + body;
      refreshInfo();
    });
  }
