  /* ---------------- Keyboard ---------------- */
  document.addEventListener("keydown", function (e) {
    var tag = (e.target && e.target.tagName) || "";
    if (e.key === "Escape") {
      if (/INPUT|SELECT|TEXTAREA/.test(tag) && e.target.value) return;
      if (currentView) { location.hash = "#/"; e.preventDefault(); }
      else select(0, true);
      return;
    }
    if (currentView && !/INPUT|SELECT|TEXTAREA/.test(tag) && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
      var ids = ITEMS.map(function (i) { return i.id; }), k = ids.indexOf(tabOf(currentView));
      location.hash = "#/" + ids[(k + (e.key === "ArrowRight" ? 1 : -1) + ids.length) % ids.length]; e.preventDefault(); return;
    }
    if (currentView || /INPUT|SELECT|TEXTAREA/.test(tag)) return;
    if (e.key === "ArrowDown") { select(cur + 1, true); e.preventDefault(); }
    else if (e.key === "ArrowUp") { select(cur - 1, true); e.preventDefault(); }
    else if (e.key === "Enter" && tag !== "A") { location.hash = "#/" + MENU[cur].id; e.preventDefault(); }
  });
