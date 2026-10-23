  /* ---------------- New version announcement ----------------
     Every few minutes, and when the tab comes back into view, the site asks the server for its build number. When a newer
     release is live, a small notice slides in at the top and offers to reload. "Later" hides it until the next release. */
  var upSeen = "", upLast = 0;
  function upCheck() {
    if (EMBED || location.protocol === "file:" || !data.build || !data.build.sha || typeof fetch !== "function") return;
    upLast = Date.now();
    fetch("data/build.json?t=" + Date.now(), { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : null; }).then(function (b) {
      if (!b || !b.sha || b.sha === data.build.sha || b.sha === upSeen) return;
      return fetch("data/config.json?t=" + Date.now(), { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : {}; }, function () { return {}; }).then(function (c) { upShow(b, c.version); });
    }, function () { /* offline: try again later */ });
  }
  function upShow(b, version) {
    if ($("#upNote")) return;
    document.body.insertAdjacentHTML("beforeend", '<div class="up-note" id="upNote" role="status"><i aria-hidden="true"></i><div><b>Update available</b><span>' +
      esc("Build " + (version || "") + (b.build ? "." + b.build : "")) + ' is live. Reload to get the latest version.</span></div>' +
      '<button class="btn small primary" id="upGo">Reload</button><button class="btn small" id="upLater">Later</button></div>');
    blip();
    $("#upGo").addEventListener("click", function () { location.reload(); });
    $("#upLater").addEventListener("click", function () { upSeen = b.sha; var n = $("#upNote"); n.classList.add("out"); setTimeout(function () { n.remove(); }, 400); });
  }
  setInterval(upCheck, 5 * 60 * 1000);
  document.addEventListener("visibilitychange", function () { if (!document.hidden && Date.now() - upLast > 60 * 1000) upCheck(); });
