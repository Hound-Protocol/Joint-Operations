/* Hound Protocol · Joint Operations — site application
 *
 * Data sources
 *   data/config.json     project name, version, repo, links, logo
 *   data/servers.json    session list (empty until the session service exists)
 *   data/mods.json       reviewed mods: compatible and with known issues
 *   data/docs.json       documentation library manifest
 *   data/contracts.json  planned contracts, used until GitHub issues carry the "contract" label
 *   data/briefing.json   text for the Briefing page
 *   data/devlog.json     manual dev log entries
 *   GitHub API           releases, contract issues and commits, read live
 *
 * Hooks (for the future session service or tools)
 *   window.JO.setServers(list)   replace the session list
 *   window.JO.setMods({compatible, issues})
 *   window.JO.setDevlog(entries) replace the manual dev log entries
 *   window.JO.refresh()          clear cached GitHub data and reload the current view
 */
(function () {
  "use strict";

  /* ---------------- Utilities ---------------- */
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function fmtBytes(n) { if (!n && n !== 0) return "—"; var u = ["B", "KB", "MB", "GB"], i = 0; while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; } return n.toFixed(i ? 1 : 0) + " " + u[i]; }
  function fmtDate(s) { if (!s) return "—"; var d = new Date(s); return isNaN(d) ? "—" : d.toISOString().slice(0, 10); }
  function plural(n, a, b) { return n + " " + (n === 1 ? a : (b || a + "s")); }
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } }
  };
  var session = {
    get: function (k) { try { var v = sessionStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } },
    set: function (k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } },
    clear: function (prefix) { try { Object.keys(sessionStorage).forEach(function (k) { if (k.indexOf(prefix) === 0) sessionStorage.removeItem(k); }); } catch (e) { /* storage unavailable */ } }
  };

  function fetchJSON(url, opts) {
    var ctl = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctl) ctl.abort(); }, 9000);
    return fetch(url, Object.assign({ signal: ctl ? ctl.signal : undefined, cache: /^https?:/.test(url) ? "default" : "no-cache" }, opts || {})).then(function (r) {
      clearTimeout(timer);
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    }, function (e) { clearTimeout(timer); throw e; });
  }
  function fetchText(url) {
    return fetch(url, { cache: /^https?:/.test(url) ? "default" : "no-cache" }).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.text(); });
  }

  /* ---------------- LED lines ---------------- */
  function led(el, text) {
    if (!el) return;
    el.textContent = "";
    var s = String(text || "");
    for (var k = 0; k < s.length; k++) {
      var span = document.createElement("span");
      if (s[k] === " ") { span.className = "gap"; span.textContent = "\u00a0"; }
      else { span.className = "ch"; span.textContent = s[k]; span.style.animationDelay = (k * 8) + "ms"; }
      el.appendChild(span);
    }
    el.setAttribute("aria-label", s);
  }
  var statusTimer;
  function status(text, keep) {
    led($("#ledStatus"), text);
    clearTimeout(statusTimer);
    if (text && !keep) statusTimer = setTimeout(function () { led($("#ledStatus"), ""); }, 6000);
  }

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

  /* ---------------- GitHub (live, cached per session) ---------------- */
  function gh(path) {
    var key = "jo-gh:" + path, hit = session.get(key), max = (cfg.cacheMinutes || 10) * 60000;
    if (hit && Date.now() - hit.t < max) return Promise.resolve(hit.v);
    return fetchJSON("https://api.github.com" + path, { headers: { Accept: "application/vnd.github+json" } }).then(function (v) {
      session.set(key, { t: Date.now(), v: v });
      return v;
    });
  }
  function repoUrl(p) { return "https://github.com/" + cfg.repo + (p || ""); }
  function newIssueUrl(title, body, labels) {
    return repoUrl("/issues/new?title=" + encodeURIComponent(title) + "&body=" + encodeURIComponent(body) + (labels ? "&labels=" + encodeURIComponent(labels) : ""));
  }

  function loadReleases() {
    if (data.releases !== undefined) return Promise.resolve(data.releases);
    return gh("/repos/" + cfg.repo + "/releases?per_page=10").then(function (list) {
      data.releases = (list || []).filter(function (r) { return !r.draft; });
      return data.releases;
    }, function () { data.releases = null; return null; });
  }

  var SIZE_PTS = { S: 1, M: 3, L: 5 };
  function loadContracts() {
    if (data.issues !== undefined) return Promise.resolve(data.issues);
    return gh("/repos/" + cfg.repo + "/issues?labels=contract&state=all&per_page=100").then(function (list) {
      var issues = (list || []).filter(function (i) { return !i.pull_request; });
      var byNum = {};
      issues.forEach(function (i) { byNum[i.number] = i; });
      data.issues = issues.map(function (i) {
        var labels = (i.labels || []).map(function (l) { return typeof l === "string" ? l : l.name; });
        var mod = "", size = "";
        labels.forEach(function (l) {
          if (l.indexOf("module:") === 0) mod = l.slice(7);
          if (l.indexOf("size:") === 0) size = l.slice(5).toUpperCase();
        });
        var deps = [], m = /depends on\s+((?:#\d+[\s,]*(?:and\s+)?)+)/i.exec(i.body || "");
        if (m) m[1].replace(/#(\d+)/g, function (_, n) { deps.push(+n); });
        var st = i.state === "closed" ? "done" : labels.indexOf("status:review") > -1 ? "review" : (i.assignees && i.assignees.length) ? "claimed" : "open";
        return {
          id: "#" + i.number, num: i.number, title: i.title, module: mod, size: size, skills: "",
          depends: deps.map(function (n) { return "#" + n; }),
          blocked: deps.some(function (n) { return byNum[n] && byNum[n].state !== "closed"; }) || labels.indexOf("blocked") > -1,
          status: st, by: (i.assignees || []).map(function (a) { return a.login; }), url: i.html_url, live: true
        };
      });
      return data.issues;
    }, function () { data.issues = null; return null; });
  }

  function loadCommits() {
    if (data.commits !== undefined) return Promise.resolve(data.commits);
    return gh("/repos/" + cfg.repo + "/commits?sha=" + encodeURIComponent(cfg.branch) + "&per_page=30").then(function (list) {
      data.commits = (list || []).map(function (c) {
        var msg = (c.commit && c.commit.message) || "";
        return { date: (c.commit && c.commit.author && c.commit.author.date) || "", title: msg.split("\n")[0], tag: "Commit", url: c.html_url, by: (c.author && c.author.login) || (c.commit && c.commit.author && c.commit.author.name) || "" };
      });
      return data.commits;
    }, function () { data.commits = null; return null; });
  }
  function parseRoadmap(md) {
    var phases = [], cur = null;
    String(md).split("\n").forEach(function (l) {
      var h = /^##\s+Phase\s+(\d+):\s*([^(]*)/.exec(l);
      if (h) { cur = { n: +h[1], title: h[2].trim(), done: 0, total: 0, items: [] }; phases.push(cur); return; }
      if (/^##\s/.test(l)) { cur = null; return; }
      var t = /^\s*-\s+\[([ xX])\]\s+(.*)$/.exec(l);
      if (t && cur) { cur.total++; if (t[1] !== " ") cur.done++; cur.items.push({ done: t[1] !== " ", text: t[2] }); }
    });
    return phases;
  }
  function loadRoadmap() {
    if (data.roadmap !== undefined) return Promise.resolve(data.roadmap);
    return loadDoc({ path: "ROADMAP.md" }).then(function (md) { data.roadmap = parseRoadmap(md); return data.roadmap; }, function () { data.roadmap = null; return null; });
  }
  function currentPhase() {
    var r = data.roadmap || [];
    for (var k = 0; k < r.length; k++) if (r[k].done < r[k].total) return r[k];
    return r[r.length - 1] || null;
  }
  var EMBED = window.JO_EMBED || null; // set by tools/bundle_site.py for the single-file build
  function loadLocal(name) {
    if (data[name]) return Promise.resolve(data[name]);
    if (EMBED && EMBED[name]) { data[name] = EMBED[name]; return Promise.resolve(data[name]); }
    return fetchJSON("data/" + name + ".json").then(function (v) { data[name] = v; return v; }, function () { return null; });
  }

  /* ---------------- Markdown (small, safe renderer for project docs) ---------------- */
  function resolvePath(base, rel) {
    var parts = base.split("/"); parts.pop();
    rel.split("/").forEach(function (p) { if (p === "..") parts.pop(); else if (p !== ".") parts.push(p); });
    return parts.join("/");
  }
  function linkTarget(url, basePath) {
    if (/^(https?:|mailto:)/i.test(url)) return { href: url, ext: true };
    if (url.charAt(0) === "#") return { href: url, ext: false };
    if (/^[a-z]+:/i.test(url)) return null;
    var clean = url.split("#")[0], p = resolvePath(basePath || "", clean);
    var hit = (data.docs && data.docs.docs || []).filter(function (d) { return d.path === p; })[0];
    if (hit) return { href: "#/docs/" + hit.id, ext: false };
    return { href: repoUrl("/blob/" + cfg.branch + "/" + p), ext: true };
  }
  function inline(src, basePath) {
    var out = "", parts = String(src).split(/(`[^`]+`)/);
    parts.forEach(function (part) {
      if (/^`[^`]+`$/.test(part)) { out += "<code>" + esc(part.slice(1, -1)) + "</code>"; return; }
      var h = esc(part);
      h = h.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (_, t, u) {
        var raw = u.replace(/&amp;/g, "&"), tg = linkTarget(raw, basePath);
        if (!tg) return t;
        return '<a href="' + esc(tg.href) + '"' + (tg.ext ? ' target="_blank" rel="noopener noreferrer"' : "") + ">" + t + "</a>";
      });
      h = h.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
      h = h.replace(/(^|[\s(])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>");
      out += h;
    });
    return out;
  }
  function markdown(md, basePath) {
    var lines = String(md).replace(/\r\n?/g, "\n").split("\n"), html = "", i = 0, para = [];
    function flush() { if (para.length) { html += "<p>" + inline(para.join(" "), basePath) + "</p>"; para = []; } }
    function cells(l) { return l.replace(/^\s*\|/, "").replace(/\|\s*$/, "").split("|").map(function (c) { return c.trim(); }); }
    while (i < lines.length) {
      var l = lines[i];
      if (/^```/.test(l)) {
        flush(); var code = []; i++;
        while (i < lines.length && !/^```/.test(lines[i])) code.push(lines[i++]);
        i++; html += "<pre><code>" + esc(code.join("\n")) + "</code></pre>"; continue;
      }
      var h = /^(#{1,4})\s+(.*)$/.exec(l);
      if (h) { flush(); var lv = h[1].length; html += "<h" + lv + ">" + inline(h[2], basePath) + "</h" + lv + ">"; i++; continue; }
      if (/^\s*(-{3,}|\*{3,})\s*$/.test(l)) { flush(); html += "<hr>"; i++; continue; }
      if (/^\s*\|/.test(l) && i + 1 < lines.length && /^\s*\|?\s*:?-{2,}/.test(lines[i + 1])) {
        flush(); var head = cells(l); i += 2; var rows = [];
        while (i < lines.length && /^\s*\|/.test(lines[i])) rows.push(cells(lines[i++]));
        html += '<div class="tw"><table><tr>' + head.map(function (c) { return "<th>" + inline(c, basePath) + "</th>"; }).join("") + "</tr>" +
          rows.map(function (r) { return "<tr>" + r.map(function (c) { return "<td>" + inline(c, basePath) + "</td>"; }).join("") + "</tr>"; }).join("") + "</table></div>";
        continue;
      }
      if (/^>\s?/.test(l)) {
        flush(); var q = [];
        while (i < lines.length && /^>\s?/.test(lines[i])) q.push(lines[i++].replace(/^>\s?/, ""));
        html += "<blockquote>" + inline(q.join(" "), basePath) + "</blockquote>"; continue;
      }
      if (/^\s*([-*]|\d+\.)\s+/.test(l)) {
        flush(); var stack = [];
        while (i < lines.length && /^\s*([-*]|\d+\.)\s+/.test(lines[i])) {
          var m = /^(\s*)([-*]|\d+\.)\s+(.*)$/.exec(lines[i]), ind = m[1].length, tag = /\d/.test(m[2]) ? "ol" : "ul";
          while (stack.length && ind < stack[stack.length - 1].ind) { html += "</li></" + stack.pop().tag + ">"; }
          if (!stack.length || ind > stack[stack.length - 1].ind) { html += "<" + tag + ">"; stack.push({ ind: ind, tag: tag }); }
          else html += "</li>";
          var text = m[3], cls = "", t = /^\[([ xX])\]\s+(.*)$/.exec(text);
          if (t) { cls = ' class="task' + (t[1] === " " ? "" : " done") + '"'; text = t[2]; }
          html += "<li" + cls + ">" + inline(text, basePath);
          i++;
        }
        while (stack.length) html += "</li></" + stack.pop().tag + ">";
        continue;
      }
      if (/^\s*$/.test(l)) { flush(); i++; continue; }
      para.push(l.trim()); i++;
    }
    flush();
    return html;
  }

  /* ---------------- Menu ---------------- */
  var ITEMS = [
    { id: "briefing", title: "Briefing", desc: "What Joint Operations is and where it stands", tab: "Briefing" },
    { id: "roadmap", title: "Roadmap", desc: "Phases, progress and what comes next", tab: "Roadmap", tabOnly: true },
    { id: "download", title: "Download", desc: "Available for Windows and Linux using Proton", tab: "Download" },
    { id: "sessions", title: "Session Overview", desc: "Browse sessions, details, status and ping", tab: "Sessions" },
    { id: "contribute", title: "Contribute", desc: "Become a part of the Protocol", tab: "Contribute" },
    { id: "team", title: "Team", desc: "The people behind Hound Protocol", tab: "Team", tabOnly: true },
    { id: "mods", title: "Mods", desc: "Compatible mods and mods with known issues", tab: "Mods" },
    { id: "devlog", title: "Dev Log", desc: "Recent changes, decisions and releases", tab: "Dev Log" },
    { id: "docs", title: "Documentation", desc: "Library of project documentation", tab: "Docs" },
    { id: "options", title: "Options", desc: "Interface and data settings", tab: "Options" }
  ];
  var MENU = ITEMS.filter(function (it) { return !it.tabOnly; });
  var cur = 0;
  function itemInfo(id) {
    switch (id) {
      case "briefing":
        var ph = currentPhase();
        return ph ? "Current: Phase " + ph.n + " · " + ph.title + " · " + ph.done + " of " + ph.total + " done" : "Project overview";
      case "roadmap":
        return "Roadmap";
      case "team":
        return "Team";
      case "devlog":
        var n2 = devlogEntries().length;
        return n2 ? plural(n2, "entry", "entries") : "Dev log";
      case "download":
        if (data.releases === undefined) return "Checking releases";
        if (data.releases && data.releases.length) return "Latest " + (data.releases[0].tag_name || "") + " · " + fmtDate(data.releases[0].published_at);
        return buildLabel() + " · " + cfg.stage + " · No public release yet";
      case "sessions":
        var n = data.servers ? (data.servers.servers || []).length : 0;
        return n ? plural(n, "session") + " listed" : "No sessions online";
      case "contribute":
        var list = contractList(), open = list.filter(function (c) { return c.status === "open" || c.status === "planned"; }).length;
        return list.length ? plural(open, "open contract") + " · " + plural(list.length, "total contract") : "Contract board";
      case "mods":
        var md = data.mods || { compatible: [], issues: [] };
        return (md.compatible || []).length + " compatible · " + (md.issues || []).length + " with known issues";
      case "docs":
        return data.docs ? plural((data.docs.docs || []).length, "document") : "Documentation library";
      case "options":
        return "Saved on this device";
    }
    return "";
  }
  function renderMenu() {
    $("#menu").innerHTML = MENU.map(function (it, n) {
      return '<a href="#/' + it.id + '" data-n="' + n + '" style="--i:' + n + '" aria-description="' + esc(it.desc) + '"><i class="hl"></i><span class="t">' + esc(it.title) + '</span><span class="win" aria-hidden="true"><span class="d"></span></span></a>';
    }).join("");
    $$("#menu a").forEach(function (a) {
      var n = +a.dataset.n;
      a.addEventListener("mouseenter", function () { select(n, false); });
      a.addEventListener("focus", function () { select(n, false); });
    });
    // Discord icon hook: set links.discordIcon in config.json to Discord's official logo file.
    var dIcon = cfg.links.discordIcon ? '<img class="ico" src="' + esc(cfg.links.discordIcon) + '" alt="">' : ICON_CHAT;
    var links = [["Discord", cfg.links.discord, dIcon], ["GitHub", cfg.links.github, ""]];
    $("#links").innerHTML = links.map(function (l) {
      return l[1] ? '<a class="btn" href="' + esc(l[1]) + '" target="_blank" rel="noopener noreferrer">' + l[2] + l[0] + "</a>"
        : '<span class="btn off" aria-disabled="true" title="Invite link coming soon">' + l[2] + l[0] + "</span>";
    }).join("");
  }
  function typeInto(el, text) {
    el.textContent = "";
    for (var k = 0; k < text.length; k++) {
      var c = document.createElement("span"); c.className = "ch"; c.textContent = text[k] === " " ? "\u00a0" : text[k];
      c.style.animationDelay = (k * 9) + "ms"; el.appendChild(c);
    }
    var cur = document.createElement("i"); cur.className = "cur"; el.appendChild(cur);
  }
  function select(n, focus) {
    var prev = cur;
    cur = (n + MENU.length) % MENU.length;
    $$("#menu a").forEach(function (a, j) {
      var on = j === cur, d = a.querySelector(".d");
      if (compact()) { if (!d.childNodes.length) d.textContent = MENU[j].desc; }
      else {
        if (on && (!a.classList.contains("on") || prev !== cur || !d.childNodes.length)) typeInto(d, MENU[j].desc);
        if (!on && d) d.textContent = "";
      }
      a.classList.toggle("on", on);
    });
    if (prev !== cur && focus) blip("move");
    if (focus) { var a = $$("#menu a")[cur]; if (a) a.focus({ preventScroll: false }); }
    led($("#ledInfo"), itemInfo(MENU[cur].id));
  }
  function refreshInfo() { if (!currentView) led($("#ledInfo"), itemInfo(MENU[cur].id)); }

  /* ---------------- Interface sounds (optional, off by default) ---------------- */
  var audioCtx = null;
  function blip(kind) {
    if (!opts.sound) return;
    try {
      if (!audioCtx) { var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; audioCtx = new AC(); }
      if (audioCtx.state === "suspended") audioCtx.resume();
      var t = audioCtx.currentTime, o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = "triangle";
      if (kind === "go") { o.frequency.setValueAtTime(700, t); o.frequency.exponentialRampToValueAtTime(1500, t + 0.07); }
      else { o.frequency.setValueAtTime(1250, t); }
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(kind === "go" ? 0.05 : 0.03, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t + (kind === "go" ? 0.11 : 0.05));
      o.connect(g); g.connect(audioCtx.destination); o.start(t); o.stop(t + 0.12);
    } catch (e) { /* audio unavailable */ }
  }

  /* ---------------- Compatibility layer ----------------
   * Detects the browser engine, input type and platform, adds classes to <html>
   * for CSS hooks, applies fallbacks, and exposes the result as JO.env.
   * Targets: Chrome, Edge, Brave, Opera, Vivaldi (Blink), Firefox (Gecko),
   * Safari on macOS and iOS (WebKit), Chrome and Samsung Internet on Android.
   */
  var ENV = (function () {
    var ua = navigator.userAgent || "", mm = function (q) { try { return window.matchMedia && matchMedia(q).matches; } catch (e) { return false; } };
    var touch = mm("(pointer: coarse)") || ("ontouchstart" in window && !mm("(pointer: fine)"));
    var ios = /iP(hone|ad|od)/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
    var css = function (p, v) { try { return window.CSS && CSS.supports(p, v); } catch (e) { return false; } };
    var engine = css("-moz-appearance", "none") ? "gecko" : (window.chrome || /Chrom(e|ium)|Edg\//.test(ua)) ? "blink" : /AppleWebKit/.test(ua) ? "webkit" : "other";
    return {
      engine: engine,
      brave: !!(navigator.brave),
      ios: ios,
      android: /Android/.test(ua),
      touch: !!touch,
      hover: mm("(hover: hover)"),
      standalone: mm("(display-mode: standalone)") || navigator.standalone === true,
      reducedMotion: mm("(prefers-reduced-motion: reduce)"),
      features: {
        intersectionObserver: "IntersectionObserver" in window,
        clipPath: css("clip-path", "inset(0 0 0 0)"),
        dvh: css("height", "100dvh"),
        backdrop: css("backdrop-filter", "blur(2px)") || css("-webkit-backdrop-filter", "blur(2px)"),
        fetch: "fetch" in window,
        abort: "AbortController" in window,
        audio: !!(window.AudioContext || window.webkitAudioContext),
        storage: (function () { try { localStorage.setItem("_t", "1"); localStorage.removeItem("_t"); return true; } catch (e) { return false; } })()
      }
    };
  })();
  (function applyEnv() {
    var c = document.documentElement.classList, f = ENV.features;
    c.add("eng-" + ENV.engine);
    c.toggle("is-touch", ENV.touch);
    c.toggle("is-ios", ENV.ios);
    c.toggle("is-android", ENV.android);
    c.toggle("no-clip", !f.clipPath);
    c.toggle("no-dvh", !f.dvh);
    c.toggle("no-io", !f.intersectionObserver);
    // Older mobile browsers: 100vh includes the address bar. Keep a --vh unit in sync.
    function vh() { document.documentElement.style.setProperty("--vh", (window.innerHeight * 0.01) + "px"); }
    vh(); window.addEventListener("resize", vh, { passive: true }); window.addEventListener("orientationchange", vh, { passive: true });
  })();
  function compact() { try { return matchMedia("(max-width: 700px)").matches || ENV.touch; } catch (e) { return ENV.touch; } }

  /* ---------------- Views ---------------- */
  var currentView = "";
  function shell(kicker, title, body) {
    var tabs = '<nav class="secbar" aria-label="Sections">' + ITEMS.map(function (it) {
      return '<a href="#/' + it.id + '"' + (it.id === currentView ? ' aria-current="page"' : "") + ">" + esc(it.tab) + "</a>";
    }).join("") + "</nav>";
    return tabs + '<div class="vh"><div><span class="kicker">' + esc(kicker) + '</span><h2>' + esc(title) + '</h2></div><a class="btn" href="#/">Menu</a></div><div id="vb">' + body + "</div>";
  }
  function milestone(key) { var m = cfg.milestones && cfg.milestones[key]; return m ? '<p class="note">' + esc(m) + "</p>" : ""; }
  function loading(t) { return '<p class="sub"><span class="spin"></span>' + esc(t) + "</p>"; }
  var ICON_CHAT = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/><path d="M8 10h.01M12 10h.01M16 10h.01" stroke-width="2.4" stroke-linecap="round"/></svg>';
  var ICON_WIN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5l8-1v8H3zM13 4l8-1v9h-8zM3 13h8v7l-8-1zM13 13h8v8l-8-1z"/></svg>';
  var ICON_LNX = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="13"/><path d="M8 21h8M12 17v4M7 9l3 2-3 2M12 13h4"/></svg>';

  /* Briefing */
  function hl(t) { return esc(t).replace(/\{\{([^}]+)\}\}/g, '<mark class="key">$1</mark>'); }
  var ICONS = {
    host: '<svg class="ico-i" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2l8 8-8 8-8-8z"/><path d="M10 7l3 3-3 3-3-3z" class="f"/></svg>',
    soldier: '<svg class="ico-i" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="6" r="3"/><path d="M4 18c0-4 2.7-6 6-6s6 2 6 6"/></svg>',
    link: '<svg class="ico-i" viewBox="0 0 20 20" aria-hidden="true"><path d="M2 7h13l-3-3M18 13H5l3 3"/></svg>'
  };
  /* Architecture diagram: host PC, connection, soldier PCs, and what flows each way */
  function howDiagram() {
    var narrow = window.matchMedia && matchMedia("(max-width: 700px)").matches;
    function box(x, y, w, h, title, sub, rows, cls, k) {
      var o = '<g class="dn ' + cls + '" style="--k:' + k + '"><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '"/>' +
        '<path class="tick" d="M' + x + ' ' + (y + 10) + 'V' + y + 'H' + (x + 10) + '"/>' +
        '<text class="t" x="' + (x + 16) + '" y="' + (y + 26) + '">' + title + '</text><text class="s" x="' + (x + 16) + '" y="' + (y + 42) + '">' + sub + "</text>";
      rows.forEach(function (r, i) { o += '<rect class="row" x="' + (x + 16) + '" y="' + (y + 56 + i * 26) + '" width="' + (w - 32) + '" height="20"/><text class="r" x="' + (x + 26) + '" y="' + (y + 70 + i * 26) + '">' + r + "</text>"; });
      return o + "</g>";
    }
    if (narrow) {
      var v = '<svg class="how narrow" viewBox="0 0 340 600" role="img" aria-label="How a session works: the host PC runs the mission, AI and world; soldier PCs send movement and actions; the host sends world state back.">';
      v += box(10, 10, 320, 180, "HOST PC", "Venom Snake's position", ["Mission state", "AI and enemies", "World and time", "Decides outcomes"], "hostbox", 0);
      v += '<g class="dn lane" style="--k:1"><text class="lt" x="170" y="222" text-anchor="middle">STEAM RELAY · DIRECT IP</text>' +
        '<line class="rail" x1="120" y1="236" x2="120" y2="362"/><line class="pkt up" x1="120" y1="362" x2="120" y2="236"/><path class="arrow" d="M114 244l6-8 6 8"/><text class="lb" x="110" y="304" text-anchor="end">movement</text><text class="lb" x="110" y="318" text-anchor="end">actions</text>' +
        '<line class="rail" x1="220" y1="236" x2="220" y2="362"/><line class="pkt down" x1="220" y1="236" x2="220" y2="362"/><path class="arrow" d="M214 354l6 8 6-8"/><text class="lb" x="230" y="296">world state</text><text class="lb" x="230" y="310">AI</text><text class="lb" x="230" y="324">events</text></g>';
      [0, 1].forEach(function (i) { v += '<g class="dn ghost" style="--k:' + (3 + i) + '"><rect x="' + (26 - i * 8) + '" y="' + (382 + i * 8) + '" width="304" height="160"/></g>'; });
      v += box(10, 398, 304, 160, "SOLDIER PC", "Up to 15 players", ["Own movement", "Own camera", "Local view of world"], "soldierbox", 2);
      return v + '<text class="foot" x="170" y="592" text-anchor="middle">ONE HOST DECIDES · ALL SEE THE SAME WORLD</text></svg>';
    }
    var svg = '<svg class="how" viewBox="0 30 760 270" role="img" aria-label="How a session works: the host PC runs the mission, AI and world; soldier PCs send movement and actions; the host sends world state back through Steam relay or a direct connection.">';
    svg += box(10, 40, 230, 200, "HOST PC", "Venom Snake's position", ["Mission state", "AI and enemies", "World and time", "Decides outcomes"], "hostbox", 0);
    [0, 1, 2].forEach(function (i) { svg += '<g class="dn ghost" style="--k:' + (3 + i) + '"><rect x="' + (536 - i * 8) + '" y="' + (40 + i * 8) + '" width="214" height="200"/></g>'; });
    svg += box(520, 56, 214, 200, "SOLDIER PC", "Up to 15 players", ["Own movement", "Own camera", "Local view of world"], "soldierbox", 2);
    svg += '<g class="dn lane" style="--k:1">' +
      '<text class="lt" x="380" y="70" text-anchor="middle">STEAM RELAY · DIRECT IP</text>' +
      '<line class="rail" x1="250" y1="120" x2="510" y2="120"/><line class="pkt up" x1="510" y1="120" x2="250" y2="120"/>' +
      '<path class="arrow" d="M258 114l-8 6 8 6"/><text class="lb" x="380" y="108" text-anchor="middle">movement · actions</text>' +
      '<line class="rail" x1="250" y1="180" x2="510" y2="180"/><line class="pkt down" x1="250" y1="180" x2="510" y2="180"/>' +
      '<path class="arrow" d="M502 174l8 6-8 6"/><text class="lb" x="380" y="204" text-anchor="middle">world state · AI · events</text></g>';
    svg += '<text class="foot" x="380" y="292" text-anchor="middle">UP TO 16 PLAYERS · ONE HOST DECIDES · EVERYONE SEES THE SAME WORLD</text></svg>';
    return svg;
  }
  function viewBriefing() {
    var v = $("#view");
    v.innerHTML = shell("Overview", "Briefing", loading("Loading briefing"));
    loadLocal("briefing").then(function () {
      if (currentView !== "briefing") return;
      var b = data.briefing || {}, host = b.host || { places: [] };
      $("#vb").innerHTML = '<div class="bf">' +
        '<section class="bf-sec bf-hero"><h3 class="bf-head">' + hl(b.headline || "") + "</h3>" +
        (b.summary || []).map(function (t) { return '<p class="bf-lead">' + hl(t) + "</p>"; }).join("") +
        '<div class="toolbar"><a class="btn primary" href="#/contribute">Join the Hound</a><a class="btn" href="#/roadmap">Roadmap</a><a class="btn" href="#/docs/plan">Read the plan</a></div></section>' +
        '<section class="bf-sec"><div class="label">How a session works</div>' + howDiagram() +
        '<div class="bf-how">' + (b.how || []).map(function (h, k) {
          return '<div class="bf-pt" style="--k:' + k + '"><h4>' + (ICONS[h[0]] || "") + esc(h[1]) + "</h4><p>" + hl(h[2]) + "</p></div>";
        }).join("") + "</div></section>" +
        '<section class="bf-sec bf-hostline"><p>' + ICONS.host + hl(host.text || "") + '</p><ul class="chips">' + (host.places || []).map(function (pl, k) { return '<li style="--k:' + k + '">' + esc(pl) + "</li>"; }).join("") + "</ul></section>" +
        "</div>";
      revealSections();
      refreshInfo();
    });
  }
  function revealSections() {
    var secs = $$(".bf-sec");
    function show(el) { if (el.classList.contains("in")) return; el.classList.add("in"); $$("[data-to]", el).forEach(countUp); }
    if (!("IntersectionObserver" in window)) { secs.forEach(show); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } }); }, { root: $("#center"), threshold: 0.12 });
    secs.forEach(function (el, k) { setTimeout(function () { io.observe(el); }, k * 90); });
  }
  function countUp(el) {
    var to = +el.dataset.to, t0 = null;
    if (!opts.motion || to === 0) { el.textContent = to; return; }
    function step(ts) { if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / 900); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
  }

  /* Roadmap */
  function viewRoadmap() {
    var v = $("#view");
    v.innerHTML = shell("Plan", "Roadmap", loading("Loading roadmap"));
    loadRoadmap().then(function () {
      if (currentView !== "roadmap") return;
      var r = data.roadmap || [], ph = currentPhase(), idx = r.indexOf(ph);
      if (!r.length) { $("#vb").innerHTML = '<div class="empty">Roadmap unavailable<small>ROADMAP.md could not be loaded.</small></div>'; return; }
      var prog = Math.round(((idx < 0 ? 0 : idx) + (ph && ph.total ? ph.done / ph.total : 0)) / r.length * 100);
      var all = r.reduce(function (a, p) { return [a[0] + p.done, a[1] + p.total]; }, [0, 0]);
      $("#vb").innerHTML = '<div class="bf">' +
        '<section class="bf-sec"><div class="bf-road" style="--p:' + prog + '%"><i class="fill"></i>' + r.map(function (p) {
          var state = p === ph ? "now" : (p.total && p.done === p.total ? "done" : "next");
          return '<a class="ph ' + state + '" href="#rm-' + p.n + '"><div class="n">Phase ' + p.n + (state === "now" ? " · Now" : state === "done" ? " · Done" : "") + '</div><div class="tt">' + esc(p.title) + '</div><div class="c">' + p.done + " / " + p.total + " tasks</div></a>";
        }).join("") + "</div>" +
        '<p class="source">' + all[0] + " of " + all[1] + ' tasks done · read live from <a href="' + repoUrl("/blob/" + cfg.branch + "/ROADMAP.md") + '" target="_blank" rel="noopener noreferrer">ROADMAP.md</a> · a phase starts when the previous one is complete or deferred by the project lead</p></section>' +
        '<section class="bf-sec rm-list">' + r.map(function (p) {
          var state = p === ph ? "now" : (p.total && p.done === p.total ? "done" : "next");
          return '<div class="rm-ph ' + state + '" id="rm-' + p.n + '"><div class="rm-h"><span class="n">Phase ' + p.n + '</span><h3>' + esc(p.title) + '</h3><span class="pill ' + (state === "now" ? "warn" : state === "done" ? "ok" : "") + '">' + (state === "now" ? "In progress" : state === "done" ? "Complete" : "Planned") + "</span></div>" +
            '<div class="meter"><i style="width:' + (p.total ? Math.round(p.done / p.total * 100) : 0) + '%"></i></div><ul class="rm-items">' + p.items.map(function (it) {
              return '<li class="' + (it.done ? "done" : "") + '">' + inline(it.text, "ROADMAP.md") + "</li>";
            }).join("") + "</ul></div>";
        }).join("") + "</section></div>";
      $$(".bf-road a.ph").forEach(function (a) { a.addEventListener("click", function (e) { e.preventDefault(); var t = $(a.getAttribute("href")); if (t) t.scrollIntoView({ behavior: opts.motion ? "smooth" : "auto", block: "start" }); }); });
      revealSections();
      refreshInfo();
    });
  }

  /* Dev log */
  var logFilter = "all";
  function devlogEntries() {
    var out = [];
    ((data.devlog && data.devlog.entries) || []).forEach(function (e) { out.push(Object.assign({ kind: "note" }, e)); });
    (data.commits || []).forEach(function (c) { out.push(Object.assign({ kind: "commit" }, c)); });
    (data.releases || []).forEach(function (r) { out.push({ kind: "release", tag: "Release", date: r.published_at, title: (r.name || r.tag_name), url: r.html_url }); });
    return out.sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });
  }
  function viewDevlog() {
    var v = $("#view");
    v.innerHTML = shell("Intel", "Dev Log", loading("Loading the dev log"));
    Promise.all([loadLocal("devlog"), loadCommits(), loadReleases()]).then(function () { if (currentView === "devlog") drawDevlog(); refreshInfo(); });
  }
  function drawDevlog() {
    var all = devlogEntries(), list = all.filter(function (e) { return logFilter === "all" || e.kind === logFilter; }), groups = [], by = {};
    list.forEach(function (e) { var d = fmtDate(e.date); if (!by[d]) { by[d] = []; groups.push(d); } by[d].push(e); });
    var count = function (k) { return all.filter(function (e) { return e.kind === k; }).length; };
    $("#vb").innerHTML = '<div class="tabs" role="tablist">' + [["all", "All", all.length], ["note", "Notes", count("note")], ["commit", "Commits", count("commit")], ["release", "Releases", count("release")]].map(function (t) {
      return '<button role="tab" data-lf="' + t[0] + '" aria-selected="' + (logFilter === t[0]) + '">' + t[1] + '<span class="count">' + t[2] + "</span></button>";
    }).join("") + "</div>" +
      (groups.length ? groups.map(function (g) {
        return '<section class="day"><div class="day-d">' + esc(g) + "</div>" + by[g].map(function (e) {
          var title = e.url ? '<a href="' + esc(e.url) + '" target="_blank" rel="noopener noreferrer">' + esc(e.title) + "</a>" : esc(e.title);
          return '<article class="entry"><span class="pill ' + (e.kind === "release" ? "ok" : e.kind === "note" ? "hot" : "") + '">' + esc(e.tag || e.kind) + "</span><div><h3>" + title + "</h3>" +
            (e.body ? "<p>" + esc(e.body) + "</p>" : "") + (e.by ? '<div class="meta">' + esc(e.by) + "</div>" : "") + "</div></article>";
        }).join("") + "</section>";
      }).join("") : '<div class="empty">No entries<small>' + (logFilter === "commit" && data.commits === null ? "GitHub could not be reached." : "Nothing logged here yet.") + "</small></div>") +
      '<p class="source">Sources: data/devlog.json' + (data.commits ? " · commits on " + esc(cfg.branch) : "") + (data.releases && data.releases.length ? " · releases" : "") + (data.commits === null ? " · GitHub unreachable" : "") + "</p>";
    $$("[data-lf]").forEach(function (b) { b.addEventListener("click", function () { logFilter = b.dataset.lf; drawDevlog(); }); });
  }

  /* Download */
  function viewDownload() {
    var v = $("#view");
    v.innerHTML = shell("Releases", "Download", loading("Checking releases on GitHub"));
    loadReleases().then(function (rel) {
      if (currentView !== "download") return;
      var latest = rel && rel[0], body = "", pre = "";
      body += '<div class="cols">';
      if (latest) {
        body += '<div class="panel"><div class="label">Latest release</div>' +
          '<div class="kv"><span>Version</span><b>' + esc(latest.tag_name) + "</b></div>" +
          '<div class="kv"><span>Name</span><b>' + esc(latest.name || latest.tag_name) + "</b></div>" +
          '<div class="kv"><span>Published</span><b>' + fmtDate(latest.published_at) + "</b></div>" +
          '<div class="kv"><span>Channel</span><b>' + (latest.prerelease ? '<span class="pill warn">Pre-release</span>' : '<span class="pill ok">Stable</span>') + "</b></div>" +
          '<div class="label">Files</div>' +
          ((latest.assets || []).length ? '<ul class="release-assets">' + latest.assets.map(function (a) {
            return "<li><span>" + esc(a.name) + '<br><small class="sub">' + fmtBytes(a.size) + " · " + plural(a.download_count || 0, "download") + '</small></span><a class="btn primary small" href="' + esc(a.browser_download_url) + '">Download</a></li>';
          }).join("") + "</ul>" : '<p class="sub">This release has no attached files.</p>') +
          '<div class="toolbar" style="margin-top:12px"><a class="btn" href="' + esc(latest.html_url) + '" target="_blank" rel="noopener noreferrer">Release notes</a><a class="btn" href="' + repoUrl("/releases") + '" target="_blank" rel="noopener noreferrer">All releases</a></div></div>';
      } else {
        pre = milestone("download");
        body += '<div class="panel"><div class="label">Release status</div>' +
          '<div class="kv"><span>Build</span><b>' + esc(cfg.version) + "</b></div>" +
          '<div class="kv"><span>Stage</span><b><span class="pill warn">' + esc(cfg.stage) + "</span></b></div>" +
          '<div class="kv"><span>Public release</span><b>' + (rel === null ? "Could not reach GitHub" : "None yet") + "</b></div>" +
          '<p class="sub" style="margin-top:12px">' + (rel === null ? "GitHub could not be reached. Releases will show here when it responds." : "No playable build has been published. Releases appear here automatically when they are published on GitHub.") + "</p>" +
          '<div class="toolbar"><a class="btn" href="' + repoUrl("/releases") + '" target="_blank" rel="noopener noreferrer">Releases on GitHub</a>' +
          '<a class="btn" href="' + repoUrl("/archive/refs/heads/" + cfg.branch + ".zip") + '">Source code (zip)</a></div></div>';
      }
      body += '<div class="panel"><div class="label">Requirements</div>' +
        '<div class="kv"><span>Game</span><b>Your own copy of MGSV on Steam</b></div>' +
        '<div class="kv"><span>Windows</span><b>Supported</b></div>' +
        '<div class="kv"><span>Linux</span><b>Supported through Proton</b></div>' +
        '<div class="kv"><span>Online play</span><b>Steam client running</b></div>' +
        '<div class="kv"><span>Players</span><b>Up to 16 per session</b></div></div>';
      body += "</div>";
      body += '<div class="cols" style="margin-top:14px">' +
        '<div class="panel"><div class="platform">' + ICON_WIN + "Windows</div><ol class=\"steps\">" +
        "<li>Install MGSV from Steam and launch it once.</li><li>Download the latest release above.</li><li>Follow the install notes that ship with the release.</li><li>Start the game and choose Host or Join.</li></ol></div>" +
        '<div class="panel"><div class="platform">' + ICON_LNX + "Linux (Proton)</div><ol class=\"steps\">" +
        "<li>Enable Steam Play and run MGSV with Proton. Launch it once.</li><li>Download the same release as Windows. Proton runs it.</li><li>Follow the install notes, installing into the game folder Steam uses.</li><li>Include your Proton version in any bug report.</li></ol></div></div>";
      body += '<p class="note">Joint Operations does not include or distribute any game files. You need your own copy of Metal Gear Solid V.</p>';
      v.querySelector("#vb").innerHTML = pre + body;
      refreshInfo();
    });
  }

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

  /* Contribute */
  var MODULES = { launcher: "Launcher / Injector", hooks: "Game Hooks", session: "Session / Host", net: "Networking", modapi: "Mod API", lobby: "Lobby App", web: "Web", docs: "Docs", testing: "Testing", legal: "Legal" };
  var RANKS = [["Recruit", 0, "Claim small contracts"], ["Operative", 3, "Claim medium contracts, review small ones"], ["Specialist", 10, "Claim large contracts, review medium ones, own a module area"], ["Squad Lead", 25, "Approve contracts, vote on priorities"], ["Commander", 50, "Seat holder candidate, approve releases"]];
  var conState = { module: "all", status: "all", size: "all", q: "" };
  function contractList() {
    if (data.issues && data.issues.length) return data.issues;
    var p = data.contracts && data.contracts.contracts;
    return (p || []).map(function (c) { return Object.assign({ status: "planned", by: [], live: false }, c); });
  }
  function rankFor(p) { var r = RANKS[0]; RANKS.forEach(function (x) { if (p >= x[1]) r = x; }); return r; }
  function viewContribute() {
    var v = $("#view");
    v.innerHTML = shell("Contract network", "Contribute", loading("Loading the contract board"));
    cardsAnim = true;
    Promise.all([loadContracts(), loadLocal("contracts")]).then(function () { if (currentView === "contribute") drawContribute(); refreshInfo(); });
  }
  function drawContribute() {
    var list = contractList(), live = !!(data.issues && data.issues.length);
    var counts = { open: 0, planned: 0, claimed: 0, review: 0, done: 0 };
    list.forEach(function (c) { counts[c.status] = (counts[c.status] || 0) + 1; });
    var shown = list.filter(function (c) {
      if (conState.module !== "all" && c.module !== conState.module) return false;
      if (conState.status !== "all" && c.status !== conState.status) return false;
      if (conState.size !== "all" && c.size !== conState.size) return false;
      if (conState.q && (c.id + " " + c.title + " " + (c.skills || "") + " " + (c.goal || "")).toLowerCase().indexOf(conState.q.toLowerCase()) < 0) return false;
      return true;
    });
    var board = shown.map(function (c, n) {
      var label = { planned: "Planned", open: c.blocked ? "Blocked" : "Open", claimed: "Claimed", review: "In review", done: "Done" }[c.status];
      var action = "";
      if (c.live) action = '<a class="btn small' + (c.status === "open" && !c.blocked ? " primary" : "") + '" href="' + esc(c.url) + '" target="_blank" rel="noopener noreferrer">' + (c.status === "open" && !c.blocked ? "Claim on GitHub" : "View on GitHub") + "</a>";
      else action = '<a class="btn small" href="' + esc(newIssueUrl("[" + c.id + "] " + c.title, "Module: " + (MODULES[c.module] || c.module) + "\nSize: " + c.size + "\nSkills: " + (c.skills || "") + (c.depends && c.depends.length ? "\nDepends on: " + c.depends.join(", ") : "") + "\n\n## Goal\n" + (c.goal || "") + (c.deliverable ? "\n\n## Deliverable\n" + c.deliverable : "") + "\n\n## Definition of done\n" + ((c.acceptance && c.acceptance.length) ? c.acceptance.map(function (a) { return "- [ ] " + a; }).join("\n") : "- ") + "\n", "contract,module:" + c.module + ",size:" + c.size)) + '" target="_blank" rel="noopener noreferrer">Open as issue</a>';
      return '<article class="card" style="--i:' + n + '"><div class="id">' + esc(c.id) + '</div><h3>' + esc(c.title) + "</h3><div>" +
        (c.module ? '<span class="pill">' + esc(MODULES[c.module] || c.module) + "</span>" : "") +
        (c.size ? '<span class="pill">' + esc(c.size) + " · " + (SIZE_PTS[c.size] || 0) + " pts</span>" : "") +
        (c.skills ? '<span class="pill">' + esc(c.skills) + "</span>" : "") + "</div>" +
        '<div class="status ' + (c.blocked && c.status === "open" ? "claimed" : c.status) + '">' + label + (c.by && c.by.length ? " · " + esc(c.by.join(", ")) : "") + "</div>" +
        (c.depends && c.depends.length ? '<div class="meta' + (c.blocked ? " blocked" : "") + '">Depends on ' + esc(c.depends.join(", ")) + "</div>" : "") +
        (c.goal ? '<p class="goal">' + esc(c.goal) + "</p>" : "") +
        ((c.acceptance && c.acceptance.length) || c.deliverable ? '<details class="spec"><summary>Acceptance criteria</summary>' +
          (c.deliverable ? '<div class="meta">Deliverable: ' + esc(c.deliverable) + "</div>" : "") +
          (c.acceptance && c.acceptance.length ? "<ul>" + c.acceptance.map(function (a) { return "<li>" + esc(a) + "</li>"; }).join("") + "</ul>" : "") + "</details>" : "") +
        '<div class="actions">' + action + "</div></article>";
    }).join("");
    // Module progress
    var mods = Object.keys(MODULES).map(function (k) {
      var l = list.filter(function (c) { return c.module === k; }), d = l.filter(function (c) { return c.status === "done"; }).length;
      return { k: k, n: l.length, d: d };
    }).filter(function (m) { return m.n; });
    // Leaderboard from completed live contracts
    var pts = {};
    list.forEach(function (c) { if (c.status === "done") (c.by || []).forEach(function (u) { pts[u] = pts[u] || { p: 0, n: 0 }; pts[u].p += SIZE_PTS[c.size] || 0; pts[u].n++; }); });
    var ops = Object.keys(pts).sort(function (a, b) { return pts[b].p - pts[a].p; });
    var opt = function (val, cur, txt) { return '<option value="' + val + '"' + (cur === val ? " selected" : "") + ">" + txt + "</option>"; };
    $("#vb").innerHTML =
      '<div class="tabs" role="tablist">' + [["board", "Contract board"], ["how", "How it works"], ["ranks", "Ranks and operatives"]].map(function (t) {
        return '<button role="tab" data-tab="' + t[0] + '" aria-selected="' + (conTab === t[0]) + '">' + t[1] + "</button>";
      }).join("") + "</div>" +
      '<div id="ctab"></div>';
    var tabHtml = {
      board:
        (live ? "" : '<p class="note">These are the planned Phase 1 contracts. They are not on GitHub yet. Use "Open as issue" to publish one, with the labels described in Contributing.</p>') +
        '<div class="stats">' + (live
          ? '<div class="stat"><b>' + counts.open + '</b><span>Open</span></div><div class="stat"><b>' + counts.claimed + '</b><span>Claimed</span></div><div class="stat"><b>' + counts.review + '</b><span>In review</span></div><div class="stat"><b>' + counts.done + "</b><span>Done</span></div>"
          : '<div class="stat"><b>' + counts.planned + '</b><span>Planned</span></div><div class="stat"><b>' + mods.length + '</b><span>Modules</span></div><div class="stat"><b>' + counts.done + '</b><span>Done</span></div>') + "</div>" +
        '<div class="toolbar"><input class="field grow" id="cq" type="search" placeholder="Search contracts" value="' + esc(conState.q) + '" aria-label="Search contracts">' +
        '<select class="field" id="cm" aria-label="Module">' + opt("all", conState.module, "All modules") + Object.keys(MODULES).map(function (k) { return opt(k, conState.module, MODULES[k]); }).join("") + "</select>" +
        '<select class="field" id="cs" aria-label="Status">' + opt("all", conState.status, "All statuses") + (live ? opt("open", conState.status, "Open") + opt("claimed", conState.status, "Claimed") + opt("review", conState.status, "In review") + opt("done", conState.status, "Done") : opt("planned", conState.status, "Planned")) + "</select>" +
        '<select class="field" id="cz" aria-label="Size">' + opt("all", conState.size, "All sizes") + opt("S", conState.size, "Small") + opt("M", conState.size, "Medium") + opt("L", conState.size, "Large") + "</select></div>" +
        (board ? '<div class="cards' + (cardsAnim ? " anim" : "") + '">' + board + "</div>" : '<div class="empty">No contracts match<small>Change the filters.</small></div>') +
        '<p class="source">Source: ' + (live ? "GitHub issues labeled contract, live" : data.issues === null ? "data/contracts.json · GitHub could not be reached" : "data/contracts.json") + "</p>",
      how:
        '<div class="cols"><div class="panel"><div class="label">Taking a contract</div><ol class="steps">' +
        "<li>Pick an open contract whose dependencies are done.</li><li>Comment on the GitHub issue to claim it. A maintainer assigns you.</li><li>Work on a branch in your fork. Sign off every commit.</li><li>Open a pull request that says Closes #number.</li><li>A reviewer approves and merges. The contract closes and counts toward your rank.</li></ol></div>" +
        '<div class="panel"><div class="label">Rules</div><ol class="steps">' +
        "<li>Fork and pull request only. Nobody pushes to main.</li><li>No game files, binaries or third-party mod code.</li><li>Research in your own words, with sources.</li><li>Nothing that touches Konami online services or anti-cheat.</li><li>Leaving is fine. Post a handoff note on the issue first.</li></ol></div></div>" +
        '<div class="toolbar" style="margin-top:14px"><a class="btn primary" href="#/docs/contributing">Read Contributing</a><a class="btn" href="' + repoUrl("/fork") + '" target="_blank" rel="noopener noreferrer">Fork on GitHub</a><a class="btn" href="' + repoUrl("/issues?q=is%3Aopen+label%3Acontract") + '" target="_blank" rel="noopener noreferrer">Contracts on GitHub</a></div>' +
        '<div class="label">Module progress</div><div class="cols">' + mods.map(function (m) {
          return '<div class="panel"><div class="kv"><span>' + esc(MODULES[m.k]) + "</span><b>" + m.d + " / " + m.n + '</b></div><div class="meter"><i style="width:' + Math.round(m.d / m.n * 100) + '%"></i></div></div>';
        }).join("") + "</div>",
      ranks:
        '<div class="tw"><table><tr><th>Rank</th><th>Points</th><th>Unlocks</th></tr>' + RANKS.map(function (r) { return "<tr><td>" + r[0] + '</td><td class="num">' + r[1] + "</td><td>" + r[2] + "</td></tr>"; }).join("") + "</table></div>" +
        '<p class="sub" style="margin-top:10px">Points per completed contract: small 1, medium 3, large 5.</p>' +
        '<div class="label">Operatives</div>' +
        (ops.length ? '<div class="tw"><table><tr><th>Operative</th><th>Contracts</th><th>Points</th><th>Rank</th></tr>' + ops.map(function (u) {
          return '<tr><td><a href="https://github.com/' + encodeURIComponent(u) + '" target="_blank" rel="noopener noreferrer">' + esc(u) + '</a></td><td class="num">' + pts[u].n + '</td><td class="num">' + pts[u].p + "</td><td>" + rankFor(pts[u].p)[0] + "</td></tr>";
        }).join("") + "</table></div>" : '<div class="empty">No completed contracts yet<small>Operatives appear here when contracts are closed on GitHub.</small></div>')
    };
    $("#ctab").innerHTML = tabHtml[conTab];
    cardsAnim = false;
    $$('[data-tab]').forEach(function (b) { b.addEventListener("click", function () { conTab = b.dataset.tab; drawContribute(); }); });
    if (conTab === "board") {
      $("#cq").addEventListener("input", function (e) { conState.q = e.target.value; var p = e.target.selectionStart; drawContribute(); var n = $("#cq"); n.focus(); try { n.setSelectionRange(p, p); } catch (x) { /* ignore */ } });
      $("#cm").addEventListener("change", function (e) { conState.module = e.target.value; drawContribute(); });
      $("#cs").addEventListener("change", function (e) { conState.status = e.target.value; drawContribute(); });
      $("#cz").addEventListener("change", function (e) { conState.size = e.target.value; drawContribute(); });
    }
  }
  var conTab = "board", cardsAnim = true;

  /* Mods */
  var modState = { tab: "compatible", q: "" };
  function viewMods() {
    var v = $("#view");
    v.innerHTML = shell("Hosted repository", "Mods", loading("Loading the mod repository"));
    loadLocal("mods").then(function () { if (currentView === "mods") drawMods(); refreshInfo(); });
  }
  function drawMods() {
    var md = data.mods || { compatible: [], issues: [] }, list = (md[modState.tab] || []).filter(function (m) {
      return !modState.q || (m.name + " " + m.author + " " + (m.notes || "")).toLowerCase().indexOf(modState.q.toLowerCase()) > -1;
    });
    $("#vb").innerHTML =
      '<div class="tabs" role="tablist"><button role="tab" data-mt="compatible" aria-selected="' + (modState.tab === "compatible") + '">Compatible<span class="count">' + (md.compatible || []).length + "</span></button>" +
      '<button role="tab" data-mt="issues" aria-selected="' + (modState.tab === "issues") + '">Known issues<span class="count">' + (md.issues || []).length + "</span></button></div>" +
      ((md.compatible || []).length + (md.issues || []).length ? "" : milestone("mods")) +
      '<p class="sub">' + (modState.tab === "compatible" ? "Reviewed and tested with Joint Operations. No known issues." : "Run with Joint Operations, but with known issues. Read the notes before installing.") + "</p>" +
      '<div class="toolbar"><input class="field grow" id="mq" type="search" placeholder="Search mods" value="' + esc(modState.q) + '" aria-label="Search mods">' +
      '<a class="btn primary" href="' + esc(repoUrl("/issues/new?template=mod-submission.md")) + '" target="_blank" rel="noopener noreferrer">Submit a mod</a></div>' +
      '<div class="tw"><table><tr><th>Mod</th><th>Version</th><th>Author</th><th>Tested on</th><th>Notes</th><th></th></tr>' +
      (list.length ? list.map(function (m) {
        return "<tr><td>" + esc(m.name) + "</td><td>" + esc(m.version || "—") + "</td><td>" + esc(m.author || "—") + "</td><td>" + esc(m.tested || "—") + "</td><td>" + esc(m.notes || "—") + '</td><td class="num">' +
          (m.url && /^https?:/i.test(m.url) ? '<a class="btn small" href="' + esc(m.url) + '" target="_blank" rel="noopener noreferrer">Get</a>' : "") + "</td></tr>";
      }).join("") : "") + "</table></div>" +
      (list.length ? "" : '<div class="empty">No mods listed<small>' + (modState.q ? "No mods match the search." : "Reviewed mods will be listed here. Submit one for review.") + "</small></div>") +
      '<p class="source">Source: data/mods.json</p>';
    $$("[data-mt]").forEach(function (b) { b.addEventListener("click", function () { modState.tab = b.dataset.mt; drawMods(); }); });
    $("#mq").addEventListener("input", function (e) { modState.q = e.target.value; var p = e.target.selectionStart; drawMods(); var n = $("#mq"); n.focus(); try { n.setSelectionRange(p, p); } catch (x) { /* ignore */ } });
  }

  /* Documentation */
  var docFilter = "", searchTimer, docBodyBackup = null;
  /* Full-text search across all documents; results replace the article until the query is cleared */
  function searchDocs(docs, q) {
    var body = $("#docBody"); if (!body) return;
    q = q.trim();
    if (q.length < 3) { if (docBodyBackup !== null) { body.innerHTML = docBodyBackup; docBodyBackup = null; } return; }
    if (docBodyBackup === null) docBodyBackup = body.innerHTML;
    Promise.all(docs.map(function (d) { return loadDoc(d).then(function (t) { return [d, t]; }, function () { return [d, ""]; }); })).then(function (all) {
      if (currentView !== "docs" || docFilter.trim() !== q) return;
      var ql = q.toLowerCase(), hits = [];
      all.forEach(function (pair) {
        var text = pair[1].replace(/[#*`|>\[\]()_-]+/g, " ").replace(/\s+/g, " "), i = text.toLowerCase().indexOf(ql), n = 0, j = i;
        while (j > -1) { n++; j = text.toLowerCase().indexOf(ql, j + ql.length); }
        if (i > -1 || pair[0].title.toLowerCase().indexOf(ql) > -1) {
          var a = Math.max(0, i - 60), snip = i > -1 ? (a ? "…" : "") + text.slice(a, i + ql.length + 90) + "…" : "";
          hits.push({ d: pair[0], n: n, snip: snip });
        }
      });
      hits.sort(function (x, y) { return y.n - x.n; });
      var re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "ig");
      body.innerHTML = '<div class="meta-line"><span>Search · ' + plural(hits.length, "document") + ' match "' + esc(q) + '"</span></div>' +
        (hits.length ? '<ol class="hits">' + hits.map(function (h) {
          return '<li><a href="#/docs/' + esc(h.d.id) + '">' + esc(h.d.title) + '</a><span class="pill">' + esc(h.d.group) + "</span>" + (h.n ? '<span class="cnt">' + plural(h.n, "match", "matches") + "</span>" : "") +
            (h.snip ? "<p>" + esc(h.snip).replace(re, function (m) { return "<mark>" + m + "</mark>"; }) + "</p>" : "") + "</li>";
        }).join("") + "</ol>" : '<div class="empty">No matches<small>Try a different word.</small></div>');
    });
  }
  function viewDocs(id) {
    var v = $("#view");
    if (!$("#docNav")) v.innerHTML = shell("Library", "Documentation", loading("Loading the library"));
    loadLocal("docs").then(function (man) {
      if (currentView !== "docs") return;
      var docs = (man && man.docs) || [];
      if (!docs.length) { $("#vb").innerHTML = '<div class="empty">No documents<small>data/docs.json could not be loaded.</small></div>'; return; }
      var doc = docs.filter(function (d) { return d.id === id; })[0] || docs[0];
      if (!$("#docNav")) {
        $("#vb").innerHTML = '<div class="docs"><nav class="doc-nav" id="docNav" aria-label="Documents"></nav><article class="doc" id="docBody"></article></div>';
      }
      drawDocNav(docs, doc.id);
      var body = $("#docBody");
      docBodyBackup = null;
      body.innerHTML = loading("Loading " + doc.title);
      loadDoc(doc).then(function (md) {
        if (currentView !== "docs") return;
        body.style.animation = "none"; void body.offsetWidth; body.style.animation = "";
        body.innerHTML = '<div class="meta-line"><span>' + esc(doc.group) + " · " + esc(doc.path) + '</span><a href="' + repoUrl("/blob/" + cfg.branch + "/" + doc.path) + '" target="_blank" rel="noopener noreferrer">View on GitHub</a><a href="' + repoUrl("/edit/" + cfg.branch + "/" + doc.path) + '" target="_blank" rel="noopener noreferrer">Suggest an edit</a></div>' + markdown(md, doc.path);
        led($("#ledInfo"), doc.title);
      }, function () {
        if (currentView !== "docs") return;
        body.innerHTML = '<div class="empty">Could not load this document<small>Open it on GitHub instead.</small></div><div class="toolbar" style="justify-content:center;margin-top:12px"><a class="btn" href="' + repoUrl("/blob/" + cfg.branch + "/" + doc.path) + '" target="_blank" rel="noopener noreferrer">Open on GitHub</a></div>';
      });
    });
  }
  function drawDocNav(docs, active) {
    var groups = [], by = {};
    docs.forEach(function (d) { if (!by[d.group]) { by[d.group] = []; groups.push(d.group); } by[d.group].push(d); });
    var q = docFilter.toLowerCase(), cur = docs.filter(function (d) { return d.id === active; })[0];
    var html = '<button class="btn doc-toggle" id="dtog" aria-expanded="false" aria-controls="docNav">' + esc(cur ? cur.title : "Documents") + '<span aria-hidden="true">▾</span></button>' + '<input class="field" id="dq" type="search" placeholder="Search documents" value="' + esc(docFilter) + '" aria-label="Search documents">';
    groups.forEach(function (g) {
      var items = by[g].filter(function (d) { return !q || q.length >= 3 || d.title.toLowerCase().indexOf(q) > -1; });
      if (!items.length) return;
      html += '<div class="grp">' + esc(g) + "</div>" + items.map(function (d) {
        return '<a href="#/docs/' + esc(d.id) + '"' + (d.id === active ? ' aria-current="true"' : "") + ">" + esc(d.title) + "</a>";
      }).join("");
    });
    var nav = $("#docNav"); nav.innerHTML = html;
    $("#dtog").addEventListener("click", function () { var open = nav.classList.toggle("open"); this.setAttribute("aria-expanded", String(open)); });
    $("#dq").addEventListener("input", function (e) {
      docFilter = e.target.value; var p = e.target.selectionStart; drawDocNav(docs, active);
      var n = $("#dq"); n.focus(); try { n.setSelectionRange(p, p); } catch (x) { /* ignore */ }
      clearTimeout(searchTimer); searchTimer = setTimeout(function () { searchDocs(docs, docFilter); }, 180);
    });
  }
  function loadDoc(doc) {
    if (docCache[doc.path]) return Promise.resolve(docCache[doc.path]);
    if (EMBED && EMBED.content && EMBED.content[doc.path] != null) return Promise.resolve(docCache[doc.path] = EMBED.content[doc.path]);
    var raw = "https://raw.githubusercontent.com/" + cfg.repo + "/" + cfg.branch + "/" + doc.path;
    return fetchText("content/" + doc.path).catch(function () { return fetchText(raw); }).then(function (t) { docCache[doc.path] = t; return t; });
  }

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

  /* Team */
  function viewTeam() {
    var v = $("#view");
    v.innerHTML = shell("Hound Protocol", "Team", loading("Loading team"));
    loadLocal("team").then(function (t) {
      if (currentView !== "team") return;
      t = t || { members: [], seats: [], roles: [] };
      var still = !opts.motion;
      $("#vb").innerHTML = '<div class="bf">' +
        '<section class="bf-sec team-members">' + t.members.map(function (m) {
          return '<article class="member"><div class="portrait"><picture>' +
            (m.still ? '<source srcset="' + esc(m.still) + '" media="(prefers-reduced-motion: reduce)">' : "") +
            '<img src="' + esc(still && m.still ? m.still : m.image) + '" alt="' + esc(m.name) + '" width="168" height="168" loading="lazy"></picture><i class="pc tl"></i><i class="pc br"></i></div>' +
            '<div><div class="m-role">' + esc(m.role) + '</div><h3 class="m-name">' + esc(m.name) + '</h3><p>' + esc(m.bio) + "</p></div></article>";
        }).join("") + "</section>" +
        '<section class="bf-sec"><div class="label">Seats</div><div class="seats">' + t.seats.map(function (s, k) {
          var open = Math.max(0, s.need - s.holders.length);
          return '<div class="seat" style="--k:' + k + '"><div class="s-name">' + esc(s.seat) + '</div><div class="s-who">' + (s.holders.length ? esc(s.holders.join(", ")) : "Vacant") + '</div><span class="pill ' + (open ? "warn" : "ok") + '">' + (open ? open + " open" : "Filled") + "</span></div>";
        }).join("") + '</div><p class="source">Seats are roles with a term and at least two holders where possible. See <a href="#/docs/governance">governance</a>.</p></section>' +
        '<section class="bf-sec"><div class="label">Wanted</div><ul class="chips">' + t.roles.map(function (r, k) { return '<li style="--k:' + k + '">' + esc(r) + "</li>"; }).join("") + '</ul>' +
        '<div class="toolbar" style="margin-top:18px"><a class="btn primary" href="#/contribute">Join the Hound</a></div></section></div>';
      revealSections();
    });
  }

  /* ---------------- Router ---------------- */
  var VIEWS = { briefing: viewBriefing, roadmap: viewRoadmap, team: viewTeam, devlog: viewDevlog, download: viewDownload, sessions: viewSessions, contribute: viewContribute, mods: viewMods, docs: viewDocs, options: viewOptions };
  var goTimer;
  function flash() {
    var st = $("#stage");
    blip("go");
    st.classList.remove("going"); void st.offsetWidth; st.classList.add("going");
    clearTimeout(goTimer); goTimer = setTimeout(function () { st.classList.remove("going"); }, 450);
  }
  /* Light background glitch at a random interval of 5 to 20 seconds */
  function scheduleGlitch() {
    setTimeout(function () {
      var st = $("#stage");
      if (opts.glitch && opts.motion && !document.hidden && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
        $$(".gl i").forEach(function (b) { b.style.setProperty("--y", (Math.random() * 90 + 5).toFixed(1) + "%"); b.style.setProperty("--h", (Math.random() * 10 + 2).toFixed(0) + "px"); });
        st.style.setProperty("--d", (0.16 + Math.random() * 0.12).toFixed(2) + "s");
        st.classList.add("glitch");
        setTimeout(function () { st.classList.remove("glitch"); }, 320);
      }
      scheduleGlitch();
    }, 5000 + Math.random() * 15000);
  }
  var booted = false;
  function route() {
    if (booted) flash();
    booted = true;
    var parts = (location.hash || "").replace(/^#\/?/, "").split("/"), name = parts[0];
    var menu = $("#menuView"), view = $("#view");
    $("#keys").innerHTML = VIEWS[name] ? "<kbd>←</kbd><kbd>→</kbd>Section<kbd>Esc</kbd>Menu" : "<kbd>↑</kbd><kbd>↓</kbd>Select<kbd>Enter</kbd>Confirm";
    if (!VIEWS[name]) {
      if (currentView) {
        currentView = ""; view.hidden = true; view.innerHTML = ""; menu.hidden = false;
        document.body.classList.remove("in-view");
        var idx = MENU.map(function (i) { return i.id; }).indexOf(lastView);
        select(idx > -1 ? idx : cur, true);
      }
      document.title = cfg.team + " · " + cfg.project;
      return;
    }
    var same = currentView === name;
    currentView = name; lastView = name;
    menu.hidden = true; view.hidden = false; document.body.classList.add("in-view");
    if (!same || name !== "docs") { view.innerHTML = ""; $("#center").scrollTop = 0; }
    var item = ITEMS.filter(function (i) { return i.id === name; })[0];
    led($("#ledInfo"), item ? item.title : "");
    document.title = (item ? item.title + " · " : "") + cfg.project;
    VIEWS[name](parts[1]);
    var tab = $('.secbar a[aria-current="page"]');
    if (tab) { var bar = tab.parentNode; bar.scrollLeft = Math.max(0, tab.offsetLeft - (bar.clientWidth - tab.offsetWidth) / 2); }
  }
  var lastView = "";

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
      var ids = ITEMS.map(function (i) { return i.id; }), k = ids.indexOf(currentView);
      location.hash = "#/" + ids[(k + (e.key === "ArrowRight" ? 1 : -1) + ids.length) % ids.length]; e.preventDefault(); return;
    }
    if (currentView || /INPUT|SELECT|TEXTAREA/.test(tag)) return;
    if (e.key === "ArrowDown") { select(cur + 1, true); e.preventDefault(); }
    else if (e.key === "ArrowUp") { select(cur - 1, true); e.preventDefault(); }
    else if (e.key === "Enter" && tag !== "A") { location.hash = "#/" + MENU[cur].id; e.preventDefault(); }
  });

  /* ---------------- Hooks ---------------- */
  window.JO = {
    env: ENV,
    setServers: function (list) { data.servers = { servers: Array.isArray(list) ? list : [] }; data.serversHooked = true; if (currentView === "sessions") drawSessions(); refreshInfo(); },
    setMods: function (m) { data.mods = { compatible: (m && m.compatible) || [], issues: (m && m.issues) || [] }; if (currentView === "mods") drawMods(); refreshInfo(); },
    setDevlog: function (list) { data.devlog = { entries: Array.isArray(list) ? list : [] }; if (currentView === "devlog") drawDevlog(); refreshInfo(); },
    refresh: function () { session.clear("jo-gh:"); data.releases = undefined; data.issues = undefined; data.commits = undefined; preload(); if (currentView) route(); }
  };

  /* ---------------- Boot ---------------- */
  function buildLabel() {
    var b = data.build;
    return "Build " + cfg.version + (b && b.build ? "." + b.build : "") + (b && b.sha ? " · " + String(b.sha).slice(0, 7) : "");
  }
  function applyConfig() {
    $("#teamName").textContent = cfg.team;
    $("#projectName").textContent = cfg.project;
    $("#tagline").textContent = cfg.tagline || "";
    $("#build").textContent = buildLabel() + " · " + cfg.stage;
    document.title = cfg.team + " · " + cfg.project;
    var logo = cfg.logo || {};
    if (logo.src) {
      var img = new Image(); img.alt = logo.alt || ""; img.src = logo.src;
      document.documentElement.style.setProperty("--logo-opacity", logo.opacity != null ? logo.opacity : 0.18);
      var box = $("#logo"); box.textContent = ""; box.appendChild(img);
    }
  }
  function preload() {
    Promise.all([loadLocal("servers"), loadLocal("mods"), loadLocal("docs"), loadLocal("contracts"), loadLocal("briefing"), loadLocal("devlog"), loadLocal("team"), loadRoadmap(), loadReleases(), loadContracts(), loadCommits()]).then(function () {
      refreshInfo();
      if (data.releases === null || data.issues === null) status("GitHub unreachable · showing bundled data");
    });
  }
  applyOpts();
  scheduleGlitch();
  renderMenu(); select(0, false);
  (EMBED && EMBED.config ? Promise.resolve(EMBED.config) : fetchJSON("data/config.json")).then(function (c) {
    cfg = Object.assign({}, DEFAULT_CFG, c, { links: Object.assign({}, DEFAULT_CFG.links, c.links), logo: Object.assign({}, DEFAULT_CFG.logo, c.logo), milestones: Object.assign({}, c.milestones) });
  }, function () { /* keep defaults */ }).then(function () {
    loadLocal("build").then(function () { applyConfig(); renderMenu(); select(cur, false); route(); preload(); });
  });
  window.addEventListener("hashchange", route);
})();
