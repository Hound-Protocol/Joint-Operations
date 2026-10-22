  /* Options */
  function viewOptions() {
    var v = $("#view");
    function sw(k, label, sub) {
      return '<div class="orow"><span>' + label + "<small>" + sub + '</small></span><button class="sw" role="switch" data-opt="' + k + '" aria-checked="' + !!opts[k] + '" aria-label="' + label + '"></button></div>';
    }
    var size = [["1", "Normal"], ["1.1", "Large"], ["1.2", "Larger"]];
    v.innerHTML = shell("Settings", "Options",
      '<div class="opt"><div><div class="label">Display</div>' +
      sw("glitch", "Glitch effect", "A light background distortion every 5 to 20 seconds") +
      sw("grid", "Background grid", "Grid and moving light band") +
      sw("motion", "Animations", "Turn off for a static interface") +
      sw("ledFx", "LED glow", "Glow and letter-by-letter text on the status lines") +
      sw("contrast", "High contrast", "Brighter secondary text and lines") +
      sw("sound", "Interface sounds", "Short tones when selecting and opening sections") +
      '<div class="orow"><span>Text size<small>Applies to the whole site</small></span><select class="field" id="osz" aria-label="Text size">' +
      size.map(function (s) { return '<option value="' + s[0] + '"' + (opts.size === s[0] ? " selected" : "") + ">" + s[1] + "</option>"; }).join("") + "</select></div></div>" +
      '<div><div class="label">Data</div>' +
      '<div class="orow"><span>GitHub data<small>Releases and contracts are cached for ' + (cfg.cacheMinutes || 10) + ' minutes</small></span><button class="btn small" id="oclr">Refresh now</button></div>' +
      '<div class="orow"><span>Repository<small>' + esc(cfg.repo) + '</small></span><a class="btn small" href="' + repoUrl() + '" target="_blank" rel="noopener noreferrer">Open</a></div>' +
      '<div class="orow"><span>Site build<small>' + esc(buildLabel()) + " · " + esc(cfg.stage) + (data.build && data.build.date ? " · " + esc(fmtDate(data.build.date)) : "") + "</small></span><span></span></div>" +
      '<div class="orow"><span>Privacy<small>No cookies, analytics or trackers</small></span><a class="btn small" href="#/docs/privacy">Read</a></div>' +
      '<div class="label">Reset</div>' +
      '<div class="orow"><span>Restore defaults<small>Resets every setting on this page</small></span><button class="btn small" id="orst">Reset</button></div></div></div>' +
      '<p class="source">Settings are stored in this browser only.</p>');
    $$("[data-opt]").forEach(function (b) {
      b.addEventListener("click", function () {
        var k = b.dataset.opt; opts[k] = !opts[k]; store.set(OPT_KEY, opts); applyOpts();
        b.setAttribute("aria-checked", String(!!opts[k])); status(b.getAttribute("aria-label") + (opts[k] ? " on" : " off"));
      });
    });
    $("#osz").addEventListener("change", function (e) { opts.size = e.target.value; store.set(OPT_KEY, opts); applyOpts(); status("Text size changed"); });
    $("#oclr").addEventListener("click", function () { JO.refresh(); status("GitHub data cleared · reloading"); });
    $("#orst").addEventListener("click", function () { opts = Object.assign({}, DEFAULT_OPTS); store.set(OPT_KEY, opts); applyOpts(); viewOptions(); status("Settings reset"); });
  }
