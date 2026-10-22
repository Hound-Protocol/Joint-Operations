  /* Team */
  function viewTeam() {
    var v = $("#view");
    v.innerHTML = shell("Hound Protocol", "Team", loading("Loading team"));
    loadLocal("team").then(function (t) {
      if (currentView !== "team") return;
      t = t || { members: [], seats: [], roles: [], departments: [] };
      var still = !opts.motion;
      $("#vb").innerHTML = '<div class="bf">' +
        '<section class="bf-sec team-brand"><div class="tb-mark">' + BRAND.hp + '</div><div><div class="tb-name">Hound Protocol</div><p>A community development team, organized like Mother Base. We build <b>Joint Operations</b> in the open.</p></div><div class="tb-mark jo"><img src="assets/brand/joint-operations-emblem.svg" alt="Joint Operations emblem"></div></section>' +
        '<section class="bf-sec team-members">' + t.members.map(function (m) {
          return '<article class="member"><div class="portrait"><picture>' +
            (m.still ? '<source srcset="' + esc(m.still) + '" media="(prefers-reduced-motion: reduce)">' : "") +
            '<img src="' + esc(still && m.still ? m.still : m.image) + '" alt="' + esc(m.name) + '" width="168" height="168" loading="lazy"></picture><i class="pc tl"></i><i class="pc br"></i></div>' +
            '<div><div class="m-role">' + esc(m.role) + '</div><h3 class="m-name">' + esc(m.name) + '</h3><p>' + esc(m.bio) + "</p></div></article>";
        }).join("") + "</section>" +
        (t.hierarchy ? teamChain(t) : "") +
        '<section class="bf-sec"><div class="label">Seats</div><div class="seats">' + t.seats.map(function (s, k) {
          var open = Math.max(0, s.need - s.holders.length);
          return '<div class="seat" style="--k:' + k + '"><div class="s-name">' + esc(s.seat) + '</div><div class="s-who">' + (s.holders.length ? esc(s.holders.join(", ")) : "Vacant") + '</div><span class="pill ' + (open ? "warn" : "ok") + '">' + (open ? open + " open" : "Filled") + "</span></div>";
        }).join("") + '</div><p class="source">Seats are roles with a term and at least two holders where possible. See <a href="#/docs/governance">governance</a>.</p></section>' +
        '<section class="bf-sec"><div class="label">Wanted</div><ul class="chips">' + t.roles.map(function (r, k) { return '<li style="--k:' + k + '">' + esc(r) + "</li>"; }).join("") + '</ul>' +
        '<div class="toolbar" style="margin-top:18px"><a class="btn primary" href="#/contribute">Join the Hound</a></div></section></div>';
      revealSections();
    });
  }

  // Chain of command (HP-POL-007): one tier per keycard level, authority badges per role
  function teamChain(t) {
    var A = t.authority || {}, depts = {};
    (t.departments || []).forEach(function (d) { depts[d.id] = d; });
    return '<section class="bf-sec"><div class="label">Chain of command</div>' +
      '<div class="principles">' + (t.principles || []).map(function (p) { return "<div><b>" + esc(p[0]) + "</b><span>" + esc(p[1]) + "</span></div>"; }).join("") + "</div>" +
      '<div class="chain">' + t.hierarchy.map(function (tier, k) {
        return '<div class="tier" style="--k:' + k + '"><span class="tier-lv">' + esc(tier.card) + '</span><div class="tier-nodes">' + tier.nodes.map(function (n) {
          var d = n.dept && /Department/.test(n.sub || "") ? depts[n.dept] : null;
          return '<article class="node' + (n.authority.length ? "" : " plain") + '"><header><h3>' + esc(n.title) + "</h3><small>" + esc(n.sub || "") + "</small></header>" +
            "<p>" + esc(n.job) + "</p>" +
            '<div class="auth">' + (n.authority.length ? n.authority.map(function (a) { return '<span class="au ' + a + '" title="' + esc((A[a] || [a, ""])[1]) + '">' + esc((A[a] || [a])[0]) + "</span>"; }).join("") : '<span class="au none">No authority over others</span>') + "</div>" +
            (d && d.units && d.units.length ? '<ul class="chips small">' + d.units.map(function (u) { return "<li>" + esc(u) + "</li>"; }).join("") + "</ul>" : "") +
            '<div class="d-who">' + (n.holders.length ? esc(n.holders.join(" · ")) : "No one yet") + (n.open ? ' <span class="pill warn">' + esc(n.open) + "</span>" : "") + "</div></article>";
        }).join("") + "</div></div>";
      }).join("") + "</div>" +
      '<div class="auth-key">' + Object.keys(A).map(function (k) { return '<span><i class="au ' + k + '">' + esc(A[k][0]) + "</i>" + esc(A[k][1]) + "</span>"; }).join("") + "</div>" +
      '<p class="source">Authority only flows down, and only in its own kind. Anyone can talk to anyone. See <a href="#/guides/hp-pol-007">HP-POL-007 Chain of Command</a> and <a href="#/docs/departments">departments and grades</a>.</p></section>';
  }
