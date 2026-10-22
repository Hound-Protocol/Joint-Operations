  /* Sessions */
  var sessState = { q: "", region: "all", hideFull: false, sort: "ping", dir: 1 };
  function serverList() { return (data.servers && data.servers.servers) || []; }
  function viewSessions() {
    var v = $("#view");
    v.innerHTML = shell("Server browser", "Session Overview", loading("Loading sessions"));
    loadLocal("servers").then(function () { if (currentView === "sessions") drawSessions(); });
  }
  function drawSessions() {
    var all = serverList(), regions = {};
    all.forEach(function (s) { if (s.region) regions[s.region] = 1; });
    var list = all.filter(function (s) {
      var q = sessState.q.toLowerCase();
      if (q && (String(s.name) + " " + String(s.host) + " " + String(s.details)).toLowerCase().indexOf(q) < 0) return false;
      if (sessState.region !== "all" && s.region !== sessState.region) return false;
      if (sessState.hideFull && s.players >= (s.maxPlayers || 16)) return false;
      return true;
    }).sort(function (a, b) {
      var k = sessState.sort, x = a[k], y = b[k];
      if (typeof x === "string") return x.localeCompare(y) * sessState.dir;
      return ((x == null ? 1e9 : x) - (y == null ? 1e9 : y)) * sessState.dir;
    });
    var online = all.filter(function (s) { return /online|open|in progress/i.test(s.status || ""); }).length;
    var players = all.reduce(function (n, s) { return n + (+s.players || 0); }, 0);
    function th(k, t) { return '<th><button data-sort="' + k + '">' + t + (sessState.sort === k ? (sessState.dir > 0 ? " ▲" : " ▼") : "") + "</button></th>"; }
    function pingCls(p) { return p == null ? "" : p < 60 ? "ping-good" : p < 120 ? "ping-mid" : "ping-bad"; }
    var rows = list.map(function (s) {
      var full = s.players >= (s.maxPlayers || 16);
      return "<tr><td>" + esc(s.name) + "</td><td>" + esc(s.host || "—") + "</td><td>" + esc(s.details || "—") + '</td><td class="num">' + (+s.players || 0) + " / " + (s.maxPlayers || 16) +
        '</td><td><span class="pill ' + (full ? "bad" : "ok") + '">' + esc(full ? "Full" : (s.status || "Open")) + '</span></td><td class="num ' + pingCls(s.ping) + '">' + (s.ping != null ? s.ping + " ms" : "—") + "</td></tr>";
    }).join("");
    $("#vb").innerHTML = (all.length ? "" : milestone("sessions")) +
      '<div class="stats"><div class="stat"><b>' + all.length + '</b><span>Sessions</span></div><div class="stat"><b>' + online + '</b><span>Online</span></div><div class="stat"><b>' + players + '</b><span>Players</span></div><div class="stat"><b>16</b><span>Max per session</span></div></div>' +
      '<div class="toolbar"><input class="field grow" id="sq" type="search" placeholder="Search sessions" value="' + esc(sessState.q) + '" aria-label="Search sessions">' +
      '<select class="field" id="sr" aria-label="Region"><option value="all">All regions</option>' + Object.keys(regions).sort().map(function (r) { return '<option' + (sessState.region === r ? " selected" : "") + ">" + esc(r) + "</option>"; }).join("") + "</select>" +
      '<button class="btn' + (sessState.hideFull ? " sel" : "") + '" id="sf" aria-pressed="' + sessState.hideFull + '">Hide full</button>' +
      '<button class="btn" id="srf">Refresh</button></div>' +
      '<div class="tw"><table><tr>' + th("name", "Session") + th("host", "Host") + "<th>Details</th>" + th("players", "Players") + "<th>Status</th>" + th("ping", "Ping") + "</tr>" +
      rows + "</table></div>" +
      (rows ? "" : all.length ? '<div class="empty" id="noServers">No servers found<small>No sessions match the filters.</small></div>'
        : '<div class="scanbox" id="noServers"><div class="radar" aria-hidden="true"><i class="sweep"></i><i class="blip"></i></div><div><b>No servers found</b><small>Scanning for sessions. They appear here once the session service is running.</small></div></div>') +
      '<p class="source">Source: data/servers.json' + (data.serversHooked ? " · live hook" : "") + "</p>";
    $("#sq").addEventListener("input", function (e) { sessState.q = e.target.value; drawSessionsKeepFocus("#sq"); });
    $("#sr").addEventListener("change", function (e) { sessState.region = e.target.value; drawSessions(); });
    $("#sf").addEventListener("click", function () { sessState.hideFull = !sessState.hideFull; drawSessions(); });
    $("#srf").addEventListener("click", function () {
      data.servers = null; data.serversHooked = false; status("Refreshing sessions");
      loadLocal("servers").then(function () { if (currentView === "sessions") { drawSessions(); status(plural(serverList().length, "session") + " found"); } });
    });
    $$("th button[data-sort]").forEach(function (b) {
      b.addEventListener("click", function () { var k = b.dataset.sort; if (sessState.sort === k) sessState.dir *= -1; else { sessState.sort = k; sessState.dir = 1; } drawSessions(); });
    });
  }
  function drawSessionsKeepFocus(sel) {
    var el = $(sel), pos = el ? el.selectionStart : 0;
    drawSessions();
    var n = $(sel); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) { /* not a text field */ } }
  }
