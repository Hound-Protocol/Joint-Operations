  /* ---------------- Modal window ----------------
     A centered window in the site's own design, used for sign-in and confirmations. Esc or the backdrop cancels. */
  function hpModal(o) {
    var old = $("#hpModal"); if (old) old.remove();
    document.body.insertAdjacentHTML("beforeend", '<div class="hm" id="hpModal" role="dialog" aria-modal="true" aria-labelledby="hmTitle"><div class="hm-back"></div>' +
      '<div class="hm-win' + (o.tone ? " hm-" + o.tone : "") + '"><div class="hm-bar"><span>' + esc(o.kicker || "Hound Protocol") + '</span><button type="button" class="hm-x" aria-label="Close">✕</button></div>' +
      '<div class="hm-body"><h3 id="hmTitle">' + esc(o.title || "") + '</h3><div class="hm-content">' + (o.html || "") + '</div></div><div class="hm-act"></div></div></div>');
    var el = $("#hpModal"), act = $(".hm-act", el), done = null, prev = document.activeElement;
    var m = {
      el: el,
      body: function (html) { $(".hm-content", el).innerHTML = html; },
      actions: function (list) {
        act.innerHTML = (list || []).map(function (a, i) { return '<button type="button" class="btn' + (a.primary ? " primary" : "") + (a.danger ? " danger" : "") + '" data-i="' + i + '">' + esc(a.label) + "</button>"; }).join("");
        $$("button", act).forEach(function (b) { b.addEventListener("click", function () { var a = list[+b.getAttribute("data-i")]; if (a.run) a.run(m); else m.close(a.value); }); });
        var f = $(".primary, .danger", act) || $("button", act); if (f) f.focus();
      },
      close: function (v) {
        document.removeEventListener("keydown", key);
        el.classList.add("out"); setTimeout(function () { el.remove(); if (prev && prev.focus) prev.focus(); }, opts.motion ? 220 : 0);
        if (done) { var d = done; done = null; d(v); }
      },
      result: new Promise(function (ok) { done = ok; })
    };
    function key(e) { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); if (o.cancel) o.cancel(); m.close(null); } }
    document.addEventListener("keydown", key);
    $(".hm-x", el).addEventListener("click", function () { if (o.cancel) o.cancel(); m.close(null); });
    $(".hm-back", el).addEventListener("click", function () { if (o.cancel) o.cancel(); m.close(null); });
    m.actions(o.actions);
    blip();
    return m;
  }
  /* A yes-or-no question in a modal window; resolves true when confirmed */
  function hpConfirm(title, text, yes, no, tone) {
    var m = hpModal({ kicker: "Confirm", title: title, html: "<p>" + esc(text) + "</p>", tone: tone, actions: [{ label: no || "Cancel", value: false }, { label: yes || "OK", value: true, danger: tone === "danger", primary: tone !== "danger" }] });
    return m.result.then(function (v) { return !!v; });
  }
