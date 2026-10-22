  /* ---------------- Config and state ---------------- */
  var DEFAULT_CFG = {
    project: "Joint Operations", team: "Hound Protocol", tagline: "", version: "0.0.1", stage: "Pre-release", milestones: {},
    repo: "Hound-Protocol/Joint-Operations", branch: "main",
    logo: { src: "", alt: "Joint Operations logo", opacity: 0.18 },
    links: { discord: "", discordIcon: "", github: "https://github.com/Hound-Protocol/Joint-Operations" },
    cacheMinutes: 10
  };
  var cfg = DEFAULT_CFG;
  var data = { servers: null, mods: null, docs: null, contracts: null, briefing: null, devlog: null, releases: undefined, issues: undefined, commits: undefined, roadmap: undefined };
  var docCache = {};

  var OPT_KEY = "hp-jo-options";
  var DEFAULT_OPTS = { glitch: true, grid: true, motion: true, ledFx: true, contrast: false, sound: false, size: "1" };
  var opts = Object.assign({}, DEFAULT_OPTS, store.get(OPT_KEY, {}));
  function applyOpts() {
    var c = document.body.classList;
    c.toggle("no-glitch", !opts.glitch);
    c.toggle("no-grid", !opts.grid);
    c.toggle("no-motion", !opts.motion);
    c.toggle("no-led", !opts.ledFx);
    c.toggle("hi-contrast", !!opts.contrast);
    document.documentElement.style.setProperty("--fs", opts.size);
  }
