  /* Verify: signed contributor records and the contributor wall */
  function b64bytes(s) { var b = atob(s), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
  // Same bytes as canonical() in tools/records.py: record without sig, keys sorted, no spaces, UTF-8
  function canonicalRecord(r) {
    var keys = Object.keys(r).filter(function (k) { return k !== "sig"; }).sort();
    return new TextEncoder().encode("{" + keys.map(function (k) { return JSON.stringify(k) + ":" + JSON.stringify(r[k]); }).join(",") + "}");
  }
  var keyCache = {};
  // Resolves "ok", "bad", "nokey" or "unsupported" (browser without Ed25519 in Web Crypto)
  function verifyRecord(r, keys) {
    var k = (keys || []).filter(function (x) { return x.id === r.key; })[0];
    if (!k) return Promise.resolve("nokey");
    if (!(window.crypto && crypto.subtle && window.TextEncoder)) return Promise.resolve("unsupported");
    var kp = keyCache[k.id] || (keyCache[k.id] = crypto.subtle.importKey("raw", b64bytes(k.public), { name: "Ed25519" }, false, ["verify"]));
    return kp.then(function (key) {
      return crypto.subtle.verify({ name: "Ed25519" }, key, b64bytes(r.sig || ""), canonicalRecord(r));
    }).then(function (ok) { return ok ? "ok" : "bad"; }, function (e) {
      delete keyCache[k.id];
      return e && (e.name === "NotSupportedError" || e.name === "TypeError") ? "unsupported" : "bad";
    });
  }
  var VSTATE = { ok: ["Verified", "done"], bad: ["Signature invalid", "bad"], nokey: ["Unknown key", "bad"], unsupported: ["Can't check in this browser", "claimed"], wait: ["Checking", "planned"] };
  function vBadge(s) { var v = VSTATE[s] || VSTATE.wait; return '<span class="status ' + v[1] + '">' + v[0] + "</span>"; }
  function recordCard(r, n) {
    return '<article class="card rec" style="--i:' + (n || 0) + '" data-rid="' + esc(r.id) + '"><div class="id">' + esc(r.id) + " · " + esc(fmtDate(r.date)) + "</div>" +
      "<h3>" + esc(r.contract) + " · " + esc(r.title) + "</h3><div>" +
      '<span class="pill">' + esc(r.name ? r.name + " (" + r.login + ")" : r.login) + "</span>" +
      (r.assisted && r.assisted.length ? '<span class="pill agent" title="AI agents used for this contract, credited as the contributor\'s tools">with ' + esc(r.assisted.join(", ")) + "</span>" : "") +
      '<span class="pill">' + esc((DIFF[r.difficulty] || [r.difficulty])[0]) + "</span></div>" +
      '<div class="vs">' + vBadge("wait") + "</div>" +
      '<div class="actions"><a class="btn small" href="#/verify/' + encodeURIComponent(r.id) + '">Details</a>' +
      (r.pr ? '<a class="btn small" href="' + esc(repoUrl("/pull/" + r.pr)) + '" target="_blank" rel="noopener noreferrer">Pull request</a>' : "") +
      (r.commit ? '<a class="btn small" href="' + esc(repoUrl("/commit/" + r.commit)) + '" target="_blank" rel="noopener noreferrer">Commit</a>' : "") + "</div></article>";
  }
  function markVerified(list, keys) {
    list.forEach(function (r) {
      verifyRecord(r, keys).then(function (s) {
        $$('[data-rid="' + r.id + '"] .vs').forEach(function (el) { el.innerHTML = vBadge(s); });
      });
    });
  }
  function viewVerify(rid) {
    var v = $("#view");
    v.innerHTML = shell("Contract network", "Verify", loading("Loading contributor records"));
    Promise.all([loadLocal("records"), loadLocal("records-key"), loadLocal("staff"), loadLocal("contracts")]).then(function (res) {
      if (currentView !== "verify") return;
      var recs = (res[0] && res[0].records) || [], keys = (res[1] && res[1].keys) || [], staff = (res[2] && res[2].staff) || [];
      var key = keys[keys.length - 1];
      var keyHtml = key
        ? '<div class="tw"><table><tr><th>Key</th><th>Fingerprint</th><th>Owner</th><th>Since</th></tr>' + keys.map(function (k) {
            return "<tr><td>" + esc(k.id) + '</td><td><code>' + esc(k.fingerprint) + "</code>" + "</td><td>" + esc(k.owner) + "</td><td>" + esc(fmtDate(k.added)) + "</td></tr>";
          }).join("") + "</table></div>"
        : '<div class="empty">No signing key published yet<small>The project lead creates it before the first record is issued.</small></div>';
      if (rid) {
        var r = recs.filter(function (x) { return x.id === rid; })[0];
        $("#vb").innerHTML = r
          ? '<p class="sub"><a href="#/verify">All records</a></p><div class="cards">' + recordCard(r) + '</div><div class="label">Signed data</div><pre class="code">' + esc(JSON.stringify(r, null, 2)) + "</pre>"
          : '<div class="empty">No record ' + esc(rid) + '<small><a href="#/verify">Back to all records</a></small></div>';
        if (r) markVerified([r], keys);
        return;
      }
      // Contributor wall
      // Grades per field, from each record's difficulty and its contract's module (data/contracts.json)
      var specs = {}; ((data.contracts && data.contracts.contracts) || []).forEach(function (c) { specs[c.id] = c; });
      var wall = tallyGrades(recs.map(function (r) { return { login: r.login, name: r.name, difficulty: r.difficulty, module: (specs[r.contract] || {}).module }; }));
      // Agents each person worked with, across their records (ADR 0015)
      var tools = {};
      recs.forEach(function (r) { (r.assisted || []).forEach(function (t) { var m = tools[r.login] = tools[r.login] || []; if (m.indexOf(t) < 0) m.push(t); }); });
      $("#vb").innerHTML =
        '<p class="sub">Every completed contract earns a contributor record, signed with the project\'s key. This page checks each signature in your browser. Hand-written and AI-assisted work earn the same record.</p>' +
        '<div class="label">Contributor wall</div>' +
        (wall.length ? '<div class="wall">' + wall.map(function (u, n) {
          var grade = u.best ? u.best[0] : "–";
          return '<a class="op" style="--i:' + n + '" href="https://github.com/' + encodeURIComponent(u.login) + '" target="_blank" rel="noopener noreferrer"><span class="mono">' + esc(grade) + "</span><b>" + esc(u.name || u.login) + "</b><small>Rank " + esc(grade) + " · " + u.n + " contract" + (u.n === 1 ? "" : "s") + (tools[u.login] ? " · with " + esc(tools[u.login].join(", ")) : "") + "</small></a>";
        }).join("") + "</div>" : '<div class="empty">No records yet<small>The wall fills as contracts are completed and signed.</small></div>') +
        '<div class="label">Records</div>' +
        (recs.length ? '<div class="cards">' + recs.slice().reverse().map(recordCard).join("") + "</div>" : "") +
        '<div class="label">Hound staff</div>' +
        '<p class="sub">Every staff member has a permanent <b class="tint key">Hound ID</b>, tied to their GitHub account number, which never changes even if they rename the account. Check anyone who claims to be staff here.</p>' +
        '<div class="toolbar"><input class="field grow" id="sfind" type="search" placeholder="Hound ID, GitHub name or Discord ID" aria-label="Find staff"><span id="sres"></span></div>' +
        (staff.length ? '<div class="tw"><table><tr><th>Hound ID</th><th>Name</th><th>Card</th><th>Department</th><th>Since</th><th>Check</th></tr>' + staff.map(function (s) {
          return '<tr data-rid="' + esc(s.id) + '"' + (s.status === "revoked" ? ' class="revoked"' : "") + '><td><code>' + esc(s.id) + "</code></td><td>" + esc(s.name ? s.name + " (" + s.login + ")" : s.login) + '</td><td><span class="card-lv lv' + esc(String(s.card).slice(2)) + '">' + esc(s.card) + "</span></td><td>" + esc(s.department) + "</td><td>" + esc(fmtDate(s.since)) + '</td><td class="vs">' + (s.status === "revoked" ? '<span class="status bad">Revoked ' + esc(fmtDate(s.revoked)) + "</span>" : vBadge("wait")) + "</td></tr>";
        }).join("") + "</table></div>" : '<div class="empty">No staff cards issued yet<small>The owner issues them once the signing key exists.</small></div>') +
        '<div class="label">Check a record</div>' +
        '<p class="sub">Paste a record someone shared with you.</p>' +
        '<textarea class="field" id="vpaste" rows="5" spellcheck="false" aria-label="Record JSON" placeholder="{&quot;id&quot;: &quot;HP-0001&quot;, ...}"></textarea>' +
        '<div class="toolbar"><button class="btn small primary" id="vcheck">Check</button><span id="vres"></span></div>' +
        '<div class="label">Signing keys</div>' + keyHtml +
        '<p class="source">Source: data/records.json · checked with tools/records.py in CI</p>';
      markVerified(recs, keys);
      markVerified(staff.filter(function (s) { return s.status !== "revoked"; }), keys);
      $("#sfind").addEventListener("input", function (e) {
        var q = e.target.value.trim().toLowerCase(), out = $("#sres");
        if (!q) { out.innerHTML = ""; return; }
        var s = staff.filter(function (x) { return x.id.toLowerCase() === q || String(x.login).toLowerCase() === q || String(x.discord_id || "") === q; })[0];
        if (!s) { out.innerHTML = '<span class="status bad">Not Hound staff</span>'; return; }
        if (s.status === "revoked") { out.innerHTML = '<span class="status bad">' + esc(s.id) + " · card revoked</span>"; return; }
        out.innerHTML = vBadge("wait");
        verifyRecord(s, keys).then(function (st) { out.innerHTML = st === "ok" ? '<span class="status done">' + esc(s.id) + " · " + esc(s.card) + " · " + esc(s.department) + " · verified</span>" : vBadge(st); });
      });
      $("#vcheck").addEventListener("click", function () {
        var out = $("#vres"), r;
        try { r = JSON.parse($("#vpaste").value); } catch (e) { out.innerHTML = vBadge("bad").replace("Signature invalid", "Not valid JSON"); return; }
        if (!r || typeof r !== "object" || !r.sig || !r.key) { out.innerHTML = vBadge("bad").replace("Signature invalid", "Not a record"); return; }
        out.innerHTML = vBadge("wait");
        verifyRecord(r, keys).then(function (s) {
          var listed = recs.some(function (x) { return x.id === r.id && x.sig === r.sig; });
          out.innerHTML = vBadge(s) + (s === "ok" ? ' <span class="sub">' + (listed ? "Listed on this page" : "Valid signature, but not in the published list") + "</span>" : "");
        });
      });
    });
  }
