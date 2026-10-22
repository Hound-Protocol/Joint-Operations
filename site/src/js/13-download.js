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
          '<div class="kv"><span>Public release</span><b>' + (rel === null ? "Could not reach GitHub" : "None yet") + "</b></div>" +
          '<p class="sub" style="margin-top:12px">' + (rel === null ? "GitHub could not be reached. Releases will show here when it responds." : "No playable build has been published. Releases appear here automatically when they are published on GitHub.") + "</p>" +
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
        "<li>Install MGSV from Steam and launch it once.</li><li>Download the latest release above.</li><li>Follow the install notes that ship with the release.</li><li>Start the game and choose Host or Join.</li></ol></div>" +
        '<div class="panel"><div class="platform">' + ICON_LNX + "Linux (Proton)</div><ol class=\"steps\">" +
        "<li>Enable Steam Play and run MGSV with Proton. Launch it once.</li><li>Download the same release as Windows. Proton runs it.</li><li>Follow the install notes, installing into the game folder Steam uses.</li><li>Include your Proton version in any bug report.</li></ol></div></div>";
      body += '<p class="note">Joint Operations does not include or distribute any game files. You need your own copy of Metal Gear Solid V.</p>';
      v.querySelector("#vb").innerHTML = pre + body;
      refreshInfo();
    });
  }
