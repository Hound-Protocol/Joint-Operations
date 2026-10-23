  /* ---------------- Keycards and Hound ID proof ----------------
     A staff card is shown as a keycard: level, department, Hound ID, grade. The card itself is public and can be copied,
     so it proves nothing about who is holding it. The proof is a fresh challenge signed with the holder's SSH signing key:
     the key must be one of the signing keys on the GitHub account the card is tied to (by account number), and if the card
     pins a key fingerprint, it must be that key. Everything is checked in this browser (ADR 0017). */
  var KC_LV = {
    LV1: ["Visitor", "#8b9599"], LV2: ["Member", "#c9d0d2"], LV3: ["Contractor", "#7fbf8a"], LV4: ["Quality", "#5aa7d6"],
    LV5: ["Development", "#f28c28"], LV6: ["Administration", "#e0453f"], LV7: ["Owner", "#d4ae52"]
  };
  var KC_NS = "hound-id";
  function kcHash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (Math.imul ? Math.imul(h, 16777619) : h * 16777619) >>> 0; } return h; }
  function kcBars(id) {
    var h = kcHash(id), x = 0, out = "";
    for (var i = 0; i < 34; i++) { h = (h ^ (h << 13)) >>> 0; h = (h ^ (h >>> 17)) >>> 0; h = (h ^ (h << 5)) >>> 0; var w = 1 + (h % 3); if (i % 2 === 0) out += '<rect x="' + x + '" y="0" width="' + w + '" height="18"/>'; x += w + 1; }
    return '<svg class="hk-bars" viewBox="0 0 ' + x + ' 18" preserveAspectRatio="none" aria-hidden="true">' + out + "</svg>";
  }
  function kcGrade(login) {
    var recs = (data.records && data.records.records) || [], specs = {};
    ((data.contracts && data.contracts.contracts) || []).forEach(function (c) { specs[c.id] = c; });
    var mine = recs.filter(function (r) { return String(r.login).toLowerCase() === String(login).toLowerCase(); });
    if (!mine.length || typeof tallyGrades !== "function") return "–";
    var t = tallyGrades(mine.map(function (r) { return { login: r.login, name: r.name, difficulty: r.difficulty, module: (specs[r.contract] || {}).module }; }))[0];
    return t && t.best ? t.best[0] : "–";
  }
  /* s: a staff card. o.specimen marks a sample card, o.big the profile size, o.link wraps it in a link to the profile */
  function keycard(s, o) {
    o = o || {};
    var lv = KC_LV[s.card] || KC_LV.LV3, n = String(s.card || "LV3").slice(2), revoked = s.status === "revoked";
    var tag = o.link ? 'a href="#/verify/' + encodeURIComponent(s.id) + '"' : "div";
    return "<" + tag + ' class="hk' + (o.big ? " big" : "") + (revoked ? " revoked" : "") + (o.specimen ? " specimen" : "") + '" style="--hk:' + lv[1] + "; --i:" + (o.i || 0) + '" data-rid="' + esc(s.id) + '">' +
      '<span class="hk-band"><img src="assets/brand/hound-protocol-mark-light.svg" alt="" width="22" height="22"><span>Hound Protocol<small>Security card · ' + esc(lv[0]) + '</small></span></span>' +
      '<span class="hk-lv" aria-label="Keycard level ' + n + '"><small>LV</small>' + esc(n) + "</span>" +
      '<span class="hk-chip" aria-hidden="true"></span><img class="hk-wm" src="assets/brand/hound-protocol-mark-light.svg" alt="" aria-hidden="true">' +
      '<span class="hk-who"><b>' + esc(s.name || s.login) + "</b><small>" + esc(s.name ? "@" + s.login : "GitHub #" + s.github_id) + "</small></span>" +
      '<span class="hk-meta"><span><i>Hound ID</i>' + esc(s.id) + "</span><span><i>Clearance</i>Level " + esc(n) + "</span><span><i>Dept</i>" + esc(s.department) + "</span><span><i>Grade</i>" + esc(o.specimen ? "B" : kcGrade(s.login)) + "</span><span class=\"k-since\"><i>Since</i>" + esc(fmtDate(s.since)) + "</span></span>" +
      '<span class="hk-foot">' + kcBars(s.id) + '<span class="vs">' + (o.specimen ? '<span class="status planned">Specimen</span>' : revoked ? '<span class="status bad">Revoked</span>' : vBadge("wait")) + "</span>" + (s.ssh_key ? '<span class="hk-key" title="SSH signing key pinned to this card">KEY</span>' : "") + "</span>" +
      (revoked ? '<span class="hk-void" aria-hidden="true">VOID</span>' : "") +
      "</" + (o.link ? "a" : "div") + ">";
  }
  var KC_SPECIMEN = { id: "HND-0000", login: "your-github-name", name: "Your Name", github_id: 0, card: "LV5", department: "Development", since: "2026-10-23", status: "active" };

  /* -------- SSH signatures (ssh-keygen -Y sign), checked with Web Crypto -------- */
  function kcTE(s) { return new TextEncoder().encode(s); }
  function kcTxt(u) { return new TextDecoder().decode(u); }
  function kcCat(list) { var n = 0, o = 0; list.forEach(function (a) { n += a.length; }); var out = new Uint8Array(n); list.forEach(function (a) { out.set(a, o); o += a.length; }); return out; }
  function kcStr(b) { var n = b.length; return kcCat([new Uint8Array([n >>> 24 & 255, n >>> 16 & 255, n >>> 8 & 255, n & 255]), b]); }
  function kcB64(u) { var s = ""; for (var i = 0; i < u.length; i++) s += String.fromCharCode(u[i]); return btoa(s); }
  function kcB64url(u) { return kcB64(u).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
  function kcStrip(u) { var i = 0; while (i < u.length - 1 && u[i] === 0) i++; return u.subarray(i); }
  function kcPad(u, n) { u = kcStrip(u); if (u.length >= n) return u.subarray(u.length - n); var o = new Uint8Array(n); o.set(u, n - u.length); return o; }
  function kcReader(u) {
    var o = 0;
    function u32() { if (o + 4 > u.length) throw new Error("truncated"); var v = ((u[o] << 24) >>> 0) + (u[o + 1] << 16) + (u[o + 2] << 8) + u[o + 3]; o += 4; return v; }
    return { u32: u32, str: function () { var n = u32(); if (o + n > u.length) throw new Error("truncated"); var s = u.subarray(o, o + n); o += n; return s; } };
  }
  function kcParseSig(text) {
    var m = /-----BEGIN SSH SIGNATURE-----([\s\S]*?)-----END SSH SIGNATURE-----/.exec(String(text || ""));
    if (!m) throw new Error("That is not an SSH signature. Paste everything from -----BEGIN SSH SIGNATURE----- to -----END SSH SIGNATURE-----.");
    var u = b64bytes(m[1].replace(/\s+/g, ""));
    if (kcTxt(u.subarray(0, 6)) !== "SSHSIG") throw new Error("Not an SSH signature.");
    var r = kcReader(u.subarray(6));
    if (r.u32() !== 1) throw new Error("Unknown SSH signature version.");
    return { pub: r.str(), ns: kcTxt(r.str()), reserved: r.str(), hash: kcTxt(r.str()), sig: r.str() };
  }
  function kcFingerprint(pub) { return crypto.subtle.digest("SHA-256", pub).then(function (h) { return "SHA256:" + kcB64(new Uint8Array(h)).replace(/=+$/, ""); }); }
  function kcVerifySig(s, message) {
    var H = { sha512: "SHA-512", sha256: "SHA-256" }[s.hash];
    if (!H) return Promise.reject(new Error("Unsupported hash " + s.hash + "."));
    return crypto.subtle.digest(H, kcTE(message)).then(function (h) {
      var blob = kcCat([kcTE("SSHSIG"), kcStr(kcTE(s.ns)), kcStr(s.reserved), kcStr(kcTE(s.hash)), kcStr(new Uint8Array(h))]);
      var pk = kcReader(s.pub), type = kcTxt(pk.str()), sg = kcReader(s.sig), stype = kcTxt(sg.str()), sdata = sg.str(), ec;
      if (type === "ssh-ed25519") {
        return crypto.subtle.importKey("raw", pk.str(), { name: "Ed25519" }, false, ["verify"]).then(function (k) { return crypto.subtle.verify({ name: "Ed25519" }, k, sdata, blob); });
      }
      if (type === "ssh-rsa") {
        var e = pk.str(), n = pk.str(), rh = { "rsa-sha2-512": "SHA-512", "rsa-sha2-256": "SHA-256" }[stype];
        if (!rh) return Promise.reject(new Error("Unsupported RSA signature type " + stype + "."));
        return crypto.subtle.importKey("jwk", { kty: "RSA", n: kcB64url(kcStrip(n)), e: kcB64url(kcStrip(e)), ext: true }, { name: "RSASSA-PKCS1-v1_5", hash: rh }, false, ["verify"])
          .then(function (k) { return crypto.subtle.verify({ name: "RSASSA-PKCS1-v1_5" }, k, sdata, blob); });
      }
      if ((ec = /^ecdsa-sha2-nistp(256|384)$/.exec(type))) {
        pk.str(); var q = pk.str(), len = ec[1] === "256" ? 32 : 48, rs = kcReader(sdata), raw = kcCat([kcPad(rs.str(), len), kcPad(rs.str(), len)]);
        return crypto.subtle.importKey("raw", q, { name: "ECDSA", namedCurve: "P-" + ec[1] }, false, ["verify"])
          .then(function (k) { return crypto.subtle.verify({ name: "ECDSA", hash: ec[1] === "256" ? "SHA-256" : "SHA-384" }, k, raw, blob); });
      }
      return Promise.reject(new Error("Key type " + type + " is not supported here. Use an ed25519, RSA or ECDSA key."));
    });
  }
  function kcGitHubKeys(gidOrLogin) {
    var who = typeof gidOrLogin === "number" ? fetchJSON("https://api.github.com/user/" + gidOrLogin) : Promise.resolve({ login: gidOrLogin });
    return who.then(function (u) {
      return fetchJSON("https://api.github.com/users/" + encodeURIComponent(u.login) + "/ssh_signing_keys").then(function (keys) { return { login: u.login, keys: keys || [] }; });
    });
  }
  function kcChallenge(id) {
    var a = new Uint8Array(6); crypto.getRandomValues(a);
    var code = Array.prototype.map.call(a, function (b) { return "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[b % 32]; }).join("");
    return "HOUND-ID PROOF " + id + " " + new Date().toISOString().slice(0, 16) + "Z " + code.slice(0, 3) + "-" + code.slice(3);
  }
  /* Who: a staff card, or a plain GitHub login (to try the check before any card exists) */
  function kcProve(who, challenge, sigText) {
    var s;
    try { s = kcParseSig(sigText); } catch (e) { return Promise.reject(e); }
    if (s.ns !== KC_NS) return Promise.reject(new Error('The signature was made for "' + s.ns + '", not "' + KC_NS + '". Use -n ' + KC_NS + "."));
    var card = who.card ? who : null;
    return Promise.all([kcFingerprint(s.pub), kcVerifySig(s, challenge), kcGitHubKeys(card ? card.github_id : who.login)]).then(function (res) {
      var fp = res[0], ok = res[1], gh = res[2], b = kcB64(s.pub);
      var onGitHub = gh.keys.some(function (k) { return String(k.key || "").split(/\s+/)[1] === b; });
      if (!ok) throw new Error("The signature does not match this challenge. Sign the exact text shown, with no extra line break.");
      if (card && card.ssh_key && card.ssh_key !== fp) throw new Error("Signed with " + fp + ", but this card pins " + card.ssh_key + ".");
      if (!onGitHub && !(card && card.ssh_key)) throw new Error("The key " + fp + " is not a signing key on GitHub account " + gh.login + ". Add it under Settings → SSH and GPG keys → New SSH key → Signing key.");
      return { fp: fp, login: gh.login, pinned: !!(card && card.ssh_key), onGitHub: onGitHub };
    });
  }

  /* The proof panel: a checker issues a challenge, the holder signs it and sends back the signature */
  function kcProofHtml(id) {
    return '<div class="kc-proof">' +
      '<div class="tabs" role="tablist"><button role="tab" class="on" data-kt="check" aria-selected="true">Check someone</button><button role="tab" data-kt="sign" aria-selected="false">Prove it\'s me</button></div>' +
      '<div class="kt" data-kp="check">' +
        '<p class="sub">Ask the person for their Hound ID, give them the challenge below, and paste back the signature they send you. Only the holder of the card\'s SSH signing key can make it.</p>' +
        '<div class="toolbar"><input class="field" id="kcWho" value="' + esc(id || "") + '" placeholder="Hound ID (HND-0001) or GitHub name" aria-label="Hound ID or GitHub name"><button class="btn small" id="kcNew">New challenge</button></div>' +
        '<pre class="code" id="kcCh" data-copy></pre>' +
        '<textarea class="field" id="kcSig" rows="6" spellcheck="false" aria-label="Signature" placeholder="-----BEGIN SSH SIGNATURE-----&#10;...&#10;-----END SSH SIGNATURE-----"></textarea>' +
        '<div class="toolbar"><button class="btn small primary" id="kcCheck">Check signature</button><span id="kcRes" aria-live="polite"></span></div>' +
      "</div>" +
      '<div class="kt" data-kp="sign" hidden>' +
        '<p class="sub">Paste the challenge you were given. Copy the command for your system, run it, and send back everything it prints. Your private key never leaves your computer.</p>' +
        '<input class="field grow" id="kcIn" placeholder="HOUND-ID PROOF HND-0001 …" aria-label="Challenge">' +
        '<div class="label">Linux, macOS, Git Bash</div><pre class="code" id="kcCmdU" data-copy></pre>' +
        '<div class="label">Windows PowerShell</div><pre class="code" id="kcCmdW" data-copy></pre>' +
        '<p class="sub">Use your own key file if it is not <code>id_ed25519</code>. The key must be added on GitHub as a <b>signing key</b> (Settings → SSH and GPG keys → New SSH key → Key type: Signing Key). Guide: <a href="#/guides/hp-gde-009">HP-GDE-009</a>.</p>' +
      "</div></div>";
  }
  function kcProofBind(staff, keys) {
    var ch = "";
    function fresh() {
      var w = $("#kcWho").value.trim();
      ch = kcChallenge(w ? w.toUpperCase().indexOf("HND-") === 0 ? w.toUpperCase() : "@" + w : "HND-0000");
      $("#kcCh").textContent = ch; $("#kcRes").innerHTML = "";
    }
    $$(".kc-proof [data-kt]").forEach(function (b) {
      b.addEventListener("click", function () {
        $$(".kc-proof [data-kt]").forEach(function (x) { var on = x === b; x.classList.toggle("on", on); x.setAttribute("aria-selected", String(on)); });
        $$(".kc-proof .kt").forEach(function (p) { p.hidden = p.getAttribute("data-kp") !== b.getAttribute("data-kt"); });
      });
    });
    $("#kcNew").addEventListener("click", fresh);
    $("#kcWho").addEventListener("change", fresh);
    fresh();
    $("#kcCheck").addEventListener("click", function () {
      var w = $("#kcWho").value.trim(), out = $("#kcRes"), card = null;
      if (!w) { out.innerHTML = '<span class="status bad">Enter a Hound ID or GitHub name</span>'; return; }
      if (/^HND-\d+$/i.test(w)) {
        card = staff.filter(function (x) { return x.id.toUpperCase() === w.toUpperCase(); })[0];
        if (!card) { out.innerHTML = '<span class="status bad">No staff card ' + esc(w) + "</span>"; return; }
        if (card.status === "revoked") { out.innerHTML = '<span class="status bad">' + esc(card.id) + " is revoked</span>"; return; }
      }
      if (!(window.crypto && crypto.subtle)) { out.innerHTML = vBadge("unsupported"); return; }
      out.innerHTML = vBadge("wait");
      Promise.all([card ? verifyRecord(card, keys) : Promise.resolve("ok"), kcProve(card || { login: w.replace(/^@/, "") }, ch, $("#kcSig").value)]).then(function (r) {
        if (r[0] !== "ok") { out.innerHTML = '<span class="status bad">The card itself failed its check (' + esc((VSTATE[r[0]] || [r[0]])[0]) + ")</span>"; return; }
        var p = r[1];
        out.innerHTML = '<span class="status done">' + (card ? esc(card.id) + " · " + esc(card.card) + " · proven" : "Controls GitHub account " + esc(p.login) + " (not a staff card)") + "</span>" +
          ' <span class="sub">Key ' + esc(p.fp) + (p.pinned ? " (pinned on the card)" : " (signing key on GitHub " + esc(p.login) + ")") + "</span>";
        status("Hound ID proof checked");
      }, function (e) { out.innerHTML = '<span class="status bad">Not proven</span> <span class="sub">' + esc(e && e.message || "Check failed") + "</span>"; });
    });
    function cmds() {
      var c = $("#kcIn").value.trim().replace(/'/g, ""), q = c || "PASTE-THE-CHALLENGE";
      $("#kcCmdU").textContent = "printf '%s' '" + q + "' | ssh-keygen -Y sign -n " + KC_NS + " -f ~/.ssh/id_ed25519";
      $("#kcCmdW").textContent = "Set-Content -NoNewline -Path challenge.txt -Value '" + q + "'; ssh-keygen -Y sign -n " + KC_NS + " -f $HOME\\.ssh\\id_ed25519 challenge.txt; Get-Content challenge.txt.sig";
    }
    $("#kcIn").addEventListener("input", cmds); cmds();
  }
