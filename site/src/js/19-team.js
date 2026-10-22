  /* Team */
  function viewTeam() {
    var v = $("#view");
    v.innerHTML = shell("Hound Protocol", "Team", loading("Loading team"));
    loadLocal("team").then(function (t) {
      if (currentView !== "team") return;
      t = t || { members: [], seats: [], roles: [], departments: [] };
      var still = !opts.motion;
      $("#vb").innerHTML = '<div class="bf">' +
        '<section class="bf-sec team-members">' + t.members.map(function (m) {
          return '<article class="member"><div class="portrait"><picture>' +
            (m.still ? '<source srcset="' + esc(m.still) + '" media="(prefers-reduced-motion: reduce)">' : "") +
            '<img src="' + esc(still && m.still ? m.still : m.image) + '" alt="' + esc(m.name) + '" width="168" height="168" loading="lazy"></picture><i class="pc tl"></i><i class="pc br"></i></div>' +
            '<div><div class="m-role">' + esc(m.role) + '</div><h3 class="m-name">' + esc(m.name) + '</h3><p>' + esc(m.bio) + "</p></div></article>";
        }).join("") + "</section>" +
        ((t.departments || []).length ? '<section class="bf-sec"><div class="label">Departments</div><div class="depts">' + t.departments.map(function (d, k) {
          return '<article class="dept" style="--k:' + k + '"><div class="d-head"><span class="d-code">' + esc(d.code) + '</span><h3>' + esc(d.name) + '</h3></div><p>' + esc(d.job) + "</p>" +
            '<ul class="chips small">' + (d.units || []).map(function (u) { return "<li>" + esc(u) + "</li>"; }).join("") + "</ul>" +
            '<div class="d-who">' + ((d.members || []).length ? esc(d.members.join(" · ")) : "No members yet") + "</div>" +
            (d.open ? '<span class="pill warn">' + esc(d.open) + "</span>" : "") + "</article>";
        }).join("") + '</div><p class="source">Organized like Mother Base. See <a href="#/docs/departments">departments and ranks</a>.</p></section>' : "") +
        '<section class="bf-sec"><div class="label">Seats</div><div class="seats">' + t.seats.map(function (s, k) {
          var open = Math.max(0, s.need - s.holders.length);
          return '<div class="seat" style="--k:' + k + '"><div class="s-name">' + esc(s.seat) + '</div><div class="s-who">' + (s.holders.length ? esc(s.holders.join(", ")) : "Vacant") + '</div><span class="pill ' + (open ? "warn" : "ok") + '">' + (open ? open + " open" : "Filled") + "</span></div>";
        }).join("") + '</div><p class="source">Seats are roles with a term and at least two holders where possible. See <a href="#/docs/governance">governance</a>.</p></section>' +
        '<section class="bf-sec"><div class="label">Wanted</div><ul class="chips">' + t.roles.map(function (r, k) { return '<li style="--k:' + k + '">' + esc(r) + "</li>"; }).join("") + '</ul>' +
        '<div class="toolbar" style="margin-top:18px"><a class="btn primary" href="#/contribute">Join the Hound</a></div></section></div>';
      revealSections();
    });
  }
