/* Hound Protocol · Joint Operations — site application
 *
 * Data sources
 *   data/config.json     project name, version, repo, links, logo
 *   data/servers.json    session list (empty until the session service exists)
 *   data/mods.json       reviewed mods: compatible and with known issues
 *   data/docs.json       documentation library manifest
 *   data/contracts.json  planned contracts, used until GitHub issues carry the "contract" label
 *   data/briefing.json   text for the About page (route #/briefing)
 *   data/devlog.json     manual dev log entries
 *   data/records.json    signed contributor records (tools/records.py), checked on the Verify page
 *   data/records-key.json public keys for those records
 *   data/staff.json      signed staff cards with Hound IDs, checked on the Verify page
 *   data/guides.json     handbook index (tools/guides_index.py), shown on the Guides page
 *   GitHub API           releases, contract issues and commits, read live
 *
 * Hooks (for the future session service or tools)
 *   window.JO.setServers(list)   replace the session list
 *   window.JO.setMods({compatible, issues})
 *   window.JO.setDevlog(entries) replace the manual dev log entries
 *   window.JO.refresh()          clear cached GitHub data and reload the current view
 *   window.JO.docsGraph()        read-only snapshot of the Docs neural web (used by tests)
 */
(function () {
  "use strict";

  /* ---------------- Utilities ---------------- */
  // Browsers too old for the app get the plain page from index.html instead
  if (window.JO_LEGACY) return;
  // Small polyfills for older browsers (Safari 9, old Chromium on older systems)
  if (typeof Object.assign !== "function") {
    Object.assign = function (t) { for (var i = 1; i < arguments.length; i++) { var s = arguments[i]; if (s) for (var k in s) if (Object.prototype.hasOwnProperty.call(s, k)) t[k] = s[k]; } return t; };
  }
  if (window.Element && !Element.prototype.matches) Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
  if (window.Element && !Element.prototype.closest) Element.prototype.closest = function (s) { var el = this; while (el && el.nodeType === 1) { if (el.matches(s)) return el; el = el.parentNode; } return null; };
  if (window.Element && !Element.prototype.remove) Element.prototype.remove = function () { if (this.parentNode) this.parentNode.removeChild(this); };
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

  // fetch() fallback for older browsers: same result, through XMLHttpRequest
  function xhrGet(url, headers) {
    return new Promise(function (ok, fail) {
      var x = new XMLHttpRequest(), h = headers || {};
      x.open("GET", url, true); x.timeout = 9000;
      Object.keys(h).forEach(function (k) { x.setRequestHeader(k, h[k]); });
      x.onload = function () { if (x.status < 200 || x.status > 299) fail(new Error("HTTP " + x.status)); else ok(x.responseText); };
      x.onerror = x.ontimeout = function () { fail(new Error("Network error")); };
      x.send();
    });
  }
  function fetchJSON(url, opts) {
    var ctl = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctl) ctl.abort(); }, 9000);
    if (typeof fetch !== "function") { clearTimeout(timer); return xhrGet(url, opts && opts.headers).then(JSON.parse); }
    return fetch(url, Object.assign({ signal: ctl ? ctl.signal : undefined, cache: /^https?:/.test(url) ? "default" : "no-cache" }, opts || {})).then(function (r) {
      clearTimeout(timer);
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    }, function (e) { clearTimeout(timer); throw e; });
  }
  function fetchText(url) {
    if (typeof fetch !== "function") return xhrGet(url);
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
  var PREFERS_LESS_MOTION = (function () { try { return !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches); } catch (e) { return false; } })();
  var DEFAULT_OPTS = { glitch: !PREFERS_LESS_MOTION, grid: true, motion: !PREFERS_LESS_MOTION, ledFx: true, emblem: true, contrast: false, sound: false, size: "1" };
  var opts = Object.assign({}, DEFAULT_OPTS, store.get(OPT_KEY, {}));
  function applyOpts() {
    var c = document.body.classList;
    c.toggle("no-glitch", !opts.glitch);
    c.toggle("no-grid", !opts.grid);
    c.toggle("no-motion", !opts.motion);
    c.toggle("no-led", !opts.ledFx);
    c.toggle("hi-contrast", !!opts.contrast);
    c.toggle("no-emblem", opts.emblem === false);
    document.documentElement.style.setProperty("--fs", opts.size);
  }

  /* ---------------- GitHub (live, cached per session) ---------------- */
  function gh(path, maxMinutes) {
    var key = "jo-gh:" + path, hit = session.get(key), max = (maxMinutes || cfg.cacheMinutes || 10) * 60000;
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

  // Playable releases start at 0.1; 0.0.x are foundation releases (docs/guides/HP-SOP-003)
  function isPlayable(r) { var m = /^v?(\d+)\.(\d+)/.exec((r && r.tag_name) || ""); return !!m && (+m[1] > 0 || +m[2] >= 1); }
  function playableReleases() { return (data.releases || []).filter(isPlayable); }
  // Live Discord numbers from the server widget (Server Settings → Widget must be on). Optional.
  function loadDiscord() {
    var id = cfg.links && cfg.links.discordGuildId;
    if (!id || !/^\d{15,21}$/.test(id)) return Promise.resolve(null);
    if (data.discord !== undefined) return Promise.resolve(data.discord);
    return fetchJSON("https://discord.com/api/guilds/" + id + "/widget.json").then(function (w) {
      data.discord = { online: +w.presence_count || 0, invite: w.instant_invite || "" };
      return data.discord;
    }, function () { data.discord = null; return null; });
  }
  function loadReleases() {
    if (data.releases !== undefined) return Promise.resolve(data.releases);
    return gh("/repos/" + cfg.repo + "/releases?per_page=10").then(function (list) {
      data.releases = (list || []).filter(function (r) { return !r.draft; });
      return data.releases;
    }, function () { data.releases = null; return null; });
  }

  function loadContracts() {
    if (data.issues !== undefined) return Promise.resolve(data.issues);
    // Claims change often, so contract issues are cached for 2 minutes only
    return gh("/repos/" + cfg.repo + "/issues?labels=contract&state=all&per_page=100", 2).then(function (list) {
      var issues = (list || []).filter(function (i) { return !i.pull_request; });
      var byNum = {};
      issues.forEach(function (i) { byNum[i.number] = i; });
      data.issuesAt = Date.now();
      data.issues = issues.map(function (i) {
        var labels = (i.labels || []).map(function (l) { return typeof l === "string" ? l : l.name; });
        var mod = "", diff = "";
        labels.forEach(function (l) {
          if (l.indexOf("module:") === 0) mod = l.slice(7);
          if (l.indexOf("difficulty:") === 0) diff = l.slice(11).toLowerCase();
        });
        var deps = [], m = /depends on\s+((?:#\d+[\s,]*(?:and\s+)?)+)/i.exec(i.body || "");
        if (m) m[1].replace(/#(\d+)/g, function (_, n) { deps.push(+n); });
        var st = i.state === "closed" ? "done" : labels.indexOf("status:review") > -1 ? "review" : (i.assignees && i.assignees.length) ? "claimed" : "open";
        return {
          id: "#" + i.number, num: i.number, title: i.title, module: mod, difficulty: diff, core: labels.indexOf("core") > -1, skills: "",
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
    // Raw HTML lines (the README's centered banner and badges) are skipped: this renderer never emits raw HTML
    var lines = String(md).replace(/\r\n?/g, "\n").split("\n").filter(function (l) { return !/^\s*<\/?[a-z][^>]*>/i.test(l); }), html = "", i = 0, para = [];
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

  /* Brand marks, generated by tools/brand/build_brand.py. Do not edit by hand. */
  var BRAND = {
    hp: '<svg class="bm" viewBox="0 0 200 200" aria-hidden="true"><polygon points="100.00,8.00 179.67,54.00 179.67,146.00 100.00,192.00 20.33,146.00 20.33,54.00" fill="none" stroke="currentColor" stroke-width="6"/><polygon points="100.00,21.00 168.42,60.50 168.42,139.50 100.00,179.00 31.58,139.50 31.58,60.50" fill="none" stroke="currentColor" stroke-width="3"/><g transform="translate(46 42) scale(1.1)"><path d="M40 8 L50 29 L61 35 L84 42 L93 47 L90 53 L74 56 L63 60 L55 70 L54 92 L23 95 L28 58 L31 34 L35 24 Z M60 42 L67 43 L61 45.5 Z M41 15 L46.5 29 L38.5 30 Z M73 54.2 L88 51.6 L88.6 52.8 L73.6 55.6 Z" fill="currentColor" fill-rule="evenodd"/></g></svg>',
    jo: '<svg class="bm" viewBox="0 0 200 200" aria-hidden="true"><line x1="100.00" y1="30.00" x2="100.00" y2="10.00" stroke="currentColor" stroke-width="5"/><line x1="126.79" y1="35.33" x2="134.44" y2="16.85" stroke="currentColor" stroke-width="5"/><line x1="149.50" y1="50.50" x2="163.64" y2="36.36" stroke="currentColor" stroke-width="5"/><line x1="164.67" y1="73.21" x2="183.15" y2="65.56" stroke="currentColor" stroke-width="5"/><line x1="170.00" y1="100.00" x2="190.00" y2="100.00" stroke="currentColor" stroke-width="5"/><line x1="164.67" y1="126.79" x2="183.15" y2="134.44" stroke="currentColor" stroke-width="5"/><line x1="149.50" y1="149.50" x2="163.64" y2="163.64" stroke="currentColor" stroke-width="5"/><line x1="126.79" y1="164.67" x2="134.44" y2="183.15" stroke="currentColor" stroke-width="5"/><line x1="100.00" y1="170.00" x2="100.00" y2="190.00" stroke="currentColor" stroke-width="5"/><line x1="73.21" y1="164.67" x2="65.56" y2="183.15" stroke="currentColor" stroke-width="5"/><line x1="50.50" y1="149.50" x2="36.36" y2="163.64" stroke="currentColor" stroke-width="5"/><line x1="35.33" y1="126.79" x2="16.85" y2="134.44" stroke="currentColor" stroke-width="5"/><line x1="30.00" y1="100.00" x2="10.00" y2="100.00" stroke="currentColor" stroke-width="5"/><line x1="35.33" y1="73.21" x2="16.85" y2="65.56" stroke="currentColor" stroke-width="5"/><line x1="50.50" y1="50.50" x2="36.36" y2="36.36" stroke="currentColor" stroke-width="5"/><line x1="73.21" y1="35.33" x2="65.56" y2="16.85" stroke="currentColor" stroke-width="5"/><path d="M87 33 L100 46 L113 33" transform="rotate(0 100 100)" fill="none" stroke="currentColor" stroke-width="5"/><path d="M87 33 L100 46 L113 33" transform="rotate(90 100 100)" fill="none" stroke="currentColor" stroke-width="5"/><path d="M87 33 L100 46 L113 33" transform="rotate(180 100 100)" fill="none" stroke="currentColor" stroke-width="5"/><path d="M87 33 L100 46 L113 33" transform="rotate(270 100 100)" fill="none" stroke="currentColor" stroke-width="5"/><polygon points="100,72 128,100 100,128 72,100" fill="currentColor"/></svg>',
    hpColor: '<svg class="bm" viewBox="0 0 200 200" aria-hidden="true"><polygon points="100.00,8.00 179.67,54.00 179.67,146.00 100.00,192.00 20.33,146.00 20.33,54.00" fill="#0b0e10"/><polygon points="100.00,8.00 179.67,54.00 179.67,146.00 100.00,192.00 20.33,146.00 20.33,54.00" fill="none" stroke="#e9edee" stroke-width="6"/><polygon points="100.00,21.00 168.42,60.50 168.42,139.50 100.00,179.00 31.58,139.50 31.58,60.50" fill="none" stroke="#d0303a" stroke-width="3"/><g transform="translate(46 42) scale(1.1)"><path d="M40 8 L50 29 L61 35 L84 42 L93 47 L90 53 L74 56 L63 60 L55 70 L54 92 L23 95 L28 58 L31 34 L35 24 Z M60 42 L67 43 L61 45.5 Z M41 15 L46.5 29 L38.5 30 Z M73 54.2 L88 51.6 L88.6 52.8 L73.6 55.6 Z" fill="#e9edee" fill-rule="evenodd"/><path d="M60 42 L67 43 L61 45.5 Z" fill="#d0303a"/><path d="M24.8 81 L54.5 80 L54.3 87.5 L24 88.5 Z" fill="#d0303a"/></g></svg>',
    joColor: '<svg class="bm" viewBox="0 0 200 200" aria-hidden="true"><line x1="100.00" y1="30.00" x2="100.00" y2="10.00" stroke="#e9edee" stroke-width="5"/><line x1="126.79" y1="35.33" x2="134.44" y2="16.85" stroke="#e9edee" stroke-width="5"/><line x1="149.50" y1="50.50" x2="163.64" y2="36.36" stroke="#e9edee" stroke-width="5"/><line x1="164.67" y1="73.21" x2="183.15" y2="65.56" stroke="#e9edee" stroke-width="5"/><line x1="170.00" y1="100.00" x2="190.00" y2="100.00" stroke="#e9edee" stroke-width="5"/><line x1="164.67" y1="126.79" x2="183.15" y2="134.44" stroke="#e9edee" stroke-width="5"/><line x1="149.50" y1="149.50" x2="163.64" y2="163.64" stroke="#e9edee" stroke-width="5"/><line x1="126.79" y1="164.67" x2="134.44" y2="183.15" stroke="#e9edee" stroke-width="5"/><line x1="100.00" y1="170.00" x2="100.00" y2="190.00" stroke="#e9edee" stroke-width="5"/><line x1="73.21" y1="164.67" x2="65.56" y2="183.15" stroke="#e9edee" stroke-width="5"/><line x1="50.50" y1="149.50" x2="36.36" y2="163.64" stroke="#e9edee" stroke-width="5"/><line x1="35.33" y1="126.79" x2="16.85" y2="134.44" stroke="#e9edee" stroke-width="5"/><line x1="30.00" y1="100.00" x2="10.00" y2="100.00" stroke="#e9edee" stroke-width="5"/><line x1="35.33" y1="73.21" x2="16.85" y2="65.56" stroke="#e9edee" stroke-width="5"/><line x1="50.50" y1="50.50" x2="36.36" y2="36.36" stroke="#e9edee" stroke-width="5"/><line x1="73.21" y1="35.33" x2="65.56" y2="16.85" stroke="#e9edee" stroke-width="5"/><path d="M87 33 L100 46 L113 33" transform="rotate(0 100 100)" fill="none" stroke="#e9edee" stroke-width="5"/><path d="M87 33 L100 46 L113 33" transform="rotate(90 100 100)" fill="none" stroke="#e9edee" stroke-width="5"/><path d="M87 33 L100 46 L113 33" transform="rotate(180 100 100)" fill="none" stroke="#e9edee" stroke-width="5"/><path d="M87 33 L100 46 L113 33" transform="rotate(270 100 100)" fill="none" stroke="#e9edee" stroke-width="5"/><polygon points="100,72 128,100 100,128 72,100" fill="#f28c28"/></svg>'
  };

  /* ---------------- Menu ---------------- */
  var ITEMS = [
    { id: "briefing", title: "About Joint Operations", desc: "What it is, how it works, and where it stands", tab: "About" },
    { id: "roadmap", title: "Roadmap", desc: "Where we are and what comes next", tab: "Roadmap", tabOnly: true },
    { id: "download", title: "Download", desc: "Get Joint Operations for Windows or Linux", tab: "Download" },
    { id: "sessions", title: "Session Browser", desc: "Browse, Create & Join active Joint Operations", tab: "Sessions" },
    { id: "contribute", title: "Contribute", desc: "Take part in development & Become a Hound Member", tab: "Contribute" },
    { id: "team", title: "Team", desc: "Chain of command and the people behind Hound Protocol", tab: "Team", tabOnly: true },
    { id: "mods", title: "Mods", desc: "Upload, Download & Browse Re-Engineered mods curated to function with Joint Operations", tab: "Mods" },
    { id: "devlog", title: "Dev Log", desc: "News, decisions and releases", tab: "Dev Log" },
    { id: "guides", title: "Guides", desc: "How to play, help, test and run the project", tab: "Guides" },
    { id: "docs", title: "Docs", desc: "Plans, decisions and research", tab: "Docs" },
    { id: "options", title: "Options", desc: "Sound, motion and display settings", tab: "Options" }
  ];
  /* Menu icons: simple line glyphs drawn for this site, on a 24 x 24 grid */
  var MENU_ICONS = {
    briefing: '<path d="M6 3h9l3 3v15H6z"/><path d="M15 3v3h3M9 10h6M9 14h6M9 18h4"/>',
    roadmap: '<path d="M4 18l5-5 4 3 7-8"/><circle cx="4" cy="18" r="1.5"/><circle cx="20" cy="8" r="1.5"/>',
    download: '<path d="M12 3v11M7 10l5 5 5-5M4 17v3h16v-3"/>',
    sessions: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><path d="M12 12l5.5-5.5M12 2v3M12 19v3M2 12h3M19 12h3"/>',
    contribute: '<path d="M8 4h8v3H8z"/><path d="M8 5.5H5V21h14V5.5h-3"/><path d="M8.5 13.5l2.5 2.5 4.5-5"/>',
    team: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6"/><path d="M16 5.5a3 3 0 010 5.5M18 14.5c1.8.9 3 2.9 3 5.5"/>',
    mods: '<path d="M12 2.5l8.5 4.8v9.4L12 21.5l-8.5-4.8V7.3z"/><path d="M3.5 7.3L12 12l8.5-4.7M12 12v9.5"/>',
    devlog: '<path d="M3 5h18v14H3z"/><path d="M6.5 9.5l3 2.5-3 2.5M11.5 15h6"/>',
    guides: '<path d="M12 6.5C10 5 7 4.5 3 5v14c4-.5 7 0 9 1.5 2-1.5 5-2 9-1.5V5c-4-.5-7 0-9 1.5z"/><path d="M12 6.5v14"/>',
    docs: '<path d="M4 6h6l2 2h8v11H4z"/><path d="M4 10h16"/>',
    options: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>'
  };
  function menuIcon(id) { return MENU_ICONS[id] ? '<svg class="mi" viewBox="0 0 24 24" aria-hidden="true">' + MENU_ICONS[id] + "</svg>" : ""; }
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
        if (playableReleases().length) return "Latest " + (playableReleases()[0].tag_name || "") + " · " + fmtDate(playableReleases()[0].published_at);
        return buildLabel() + " · " + cfg.stage + " · No playable release yet";
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
  /* Home side panels: the project on the left, Hound Protocol on the right (config.about) */
  function renderAbout() {
    var a = cfg.about || {};
    [["#aboutProject", a.project, BRAND.joColor], ["#aboutTeam", a.team, BRAND.hpColor]].forEach(function (s) {
      var el = $(s[0]), p = s[1];
      if (!el) return;
      el.hidden = !p;   // the menu renders before config loads, so this must also un-hide
      if (!p) return;
      el.innerHTML = '<div class="s-mark">' + s[2] + '</div><div class="s-label">' + esc(p.label) + "</div>" +
        '<h2 class="s-title">' + esc(p.title) + "</h2>" +
        '<p class="s-text">' + esc(p.text) + "</p>" +
        ((p.facts || []).length ? '<dl class="s-facts">' + p.facts.map(function (f) { return "<div><dt>" + esc(f[0]) + "</dt><dd>" + esc(f[1]) + "</dd></div>"; }).join("") + "</dl>" : "") +
        (p.link ? '<a class="s-link" href="' + esc(p.link[1]) + '">' + esc(p.link[0]) + ' <span aria-hidden="true">→</span></a>' : "");
    });
    // Hound Protocol panel: live Discord count when the widget is available
    loadDiscord().then(function (d) {
      var dl = $("#aboutTeam .s-facts");
      if (!d || !dl || $("#dOnline")) return;
      dl.insertAdjacentHTML("afterbegin", '<div id="dOnline"><dt>Discord</dt><dd><a href="' + esc(cfg.links.discord || d.invite) + '" target="_blank" rel="noopener noreferrer"><i class="live"></i>' + plural(d.online, "member") + " online</a></dd></div>");
    });
  }
  function renderMenu() {
    renderAbout();
    if ($("#hdMark")) $("#hdMark").innerHTML = BRAND.hpColor;
    $("#menu").innerHTML = MENU.map(function (it, n) {
      return '<a href="#/' + it.id + '" class="mi-' + it.id + '" data-n="' + n + '" style="--i:' + n + '" aria-description="' + esc(it.desc) + '"><i class="hl"></i><span class="t">' + menuIcon(it.id) + '<span>' + esc(it.title) + '</span></span><span class="win' + (it.desc.length > 56 ? " long" : "") + '" aria-hidden="true"><span class="d"></span></span></a>';
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
    var now = ITEMS.filter(function (it) { return it.id === currentView; })[0];
    var tabs = '<div class="secwrap"><nav class="secbar" aria-label="Sections">' + ITEMS.map(function (it) {
      return '<a href="#/' + it.id + '" class="tab-' + it.id + '" data-desc="' + esc(it.desc) + '"' + (it.id === currentView ? ' aria-current="page"' : "") + ">" + menuIcon(it.id) + "<span>" + esc(it.tab) + "</span></a>";
    }).join("") + '</nav><div class="secdesc" id="secDesc" aria-hidden="true">' + esc(now ? now.desc : "") + "</div></div>";
    return tabs + '<div class="vh"><div><span class="kicker">' + esc(kicker) + '</span><h2>' + esc(title) + '</h2></div><a class="btn" href="#/">Menu</a></div><div id="vb">' + body + "</div>";
  }
  function milestone(key) { var m = cfg.milestones && cfg.milestones[key]; return m ? '<p class="note">' + esc(m) + "</p>" : ""; }
  function loading(t) { return '<p class="sub"><span class="spin"></span>' + esc(t) + "</p>"; }
  var ICON_CHAT = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/><path d="M8 10h.01M12 10h.01M16 10h.01" stroke-width="2.4" stroke-linecap="round"/></svg>';
  var ICON_WIN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5l8-1v8H3zM13 4l8-1v9h-8zM3 13h8v7l-8-1zM13 13h8v8l-8-1z"/></svg>';
  var ICON_LNX = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="13"/><path d="M8 21h8M12 17v4M7 9l3 2-3 2M12 13h4"/></svg>';

  /* Section bar: the description under the bar follows the tab you point at, and returns to the current section */
  (function () {
    var t = 0;
    function show(a) {
      var d = $("#secDesc"); if (!d) return;
      var txt = a ? a.getAttribute("data-desc") : ((ITEMS.filter(function (it) { return it.id === currentView; })[0] || {}).desc || "");
      if (d.textContent === txt) { d.classList.remove("out"); return; }
      d.classList.add("out"); clearTimeout(t);
      t = setTimeout(function () { d.textContent = txt; d.classList.remove("out"); }, opts.motion ? 140 : 0);
    }
    function find(e) { var el = e.target; while (el && el !== document && !(el.tagName === "A" && el.parentNode && el.parentNode.className === "secbar")) el = el.parentNode; return el && el !== document ? el : null; }
    document.addEventListener("mouseover", function (e) { var a = find(e); if (a) show(a); });
    document.addEventListener("focusin", function (e) { var a = find(e); if (a) show(a); });
    document.addEventListener("mouseout", function (e) { var a = find(e); if (a && !(e.relatedTarget && find({ target: e.relatedTarget }))) show(null); });
  })();

  /* ---------------- Click to copy ----------------
   * Anything players are meant to copy (code in documents, guides, steps and cards) copies to the
   * clipboard with one click. Pointing at it types "click to copy this text" beside the pointer.
   * Works by keyboard too: copyable text is focusable, Enter or Space copies.
   */
  var COPY_SEL = "#view code, #view pre";
  function copyTarget(el) {
    while (el && el !== document) {
      if (el.nodeType === 1 && (el.tagName === "CODE" || el.tagName === "PRE") && el.closest && el.closest("#view")) {
        if (el.tagName === "CODE" && el.parentNode && el.parentNode.tagName === "PRE") return el.parentNode;
        if (el.closest("a, button, .sw, .field")) return null;
        return el;
      }
      el = el.parentNode;
    }
    return null;
  }
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (ok, fail) {
      // Older browsers: copy through a hidden text area
      var t = document.createElement("textarea");
      t.value = text; t.setAttribute("readonly", ""); t.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0";
      document.body.appendChild(t); t.select();
      try { document.execCommand("copy") ? ok() : fail(); } catch (e) { fail(e); }
      document.body.removeChild(t);
    });
  }
  var copyTip = null, copyTipFor = null;
  function tipEl() {
    if (!copyTip) { copyTip = document.createElement("div"); copyTip.className = "copytip"; copyTip.setAttribute("aria-hidden", "true"); document.body.appendChild(copyTip); }
    return copyTip;
  }
  function typeTip(text, cls) {
    var t = tipEl();
    t.className = "copytip on" + (cls ? " " + cls : "");
    t.innerHTML = String(text).split("").map(function (ch, i) {
      return '<span class="ch" style="animation-delay:' + (opts.motion ? i * 18 : 0) + 'ms">' + (ch === " " ? "&nbsp;" : esc(ch)) + "</span>";
    }).join("");
  }
  function placeTip(x, y) {
    var t = tipEl(), w = t.offsetWidth || 180;
    t.style.left = Math.min(window.innerWidth - w - 8, x + 14) + "px";
    t.style.top = Math.max(8, y + 18) + "px";
  }
  function hideTip() { if (copyTip) copyTip.className = "copytip"; copyTipFor = null; }
  function doCopy(el, x, y) {
    var text = (el.innerText || el.textContent || "").replace(/\s+$/, "");
    copyText(text).then(function () {
      el.classList.add("copied"); setTimeout(function () { el.classList.remove("copied"); }, 900);
      typeTip("copied to clipboard", "ok"); if (x != null) placeTip(x, y);
      status("Copied: " + (text.length > 40 ? text.slice(0, 39) + "…" : text));
      if (typeof blip === "function") blip("go");
    }, function () { typeTip("press Ctrl+C to copy", "bad"); });
  }
  // Mark copyable text so it can be reached by keyboard and is announced as a button
  function markCopyable(root) {
    $$(COPY_SEL, root).forEach(function (el) {
      var t = copyTarget(el);
      if (!t || t.getAttribute("data-copy")) return;
      t.setAttribute("data-copy", "");
      t.setAttribute("tabindex", "0");
      t.setAttribute("role", "button");
      t.setAttribute("aria-label", "Copy: " + (t.textContent || "").trim().slice(0, 80));
    });
  }
  if (window.MutationObserver) {
    new MutationObserver(function () { var v = $("#view"); if (v && !v.hidden) markCopyable(v); }).observe(document.getElementById("view") || document.body, { childList: true, subtree: true });
  }
  document.addEventListener("mouseover", function (e) {
    var t = copyTarget(e.target);
    if (t === copyTipFor) return;
    if (!t) { hideTip(); return; }
    copyTipFor = t; typeTip("click to copy this text"); placeTip(e.clientX, e.clientY);
  });
  document.addEventListener("mousemove", function (e) { if (copyTipFor) placeTip(e.clientX, e.clientY); });
  document.addEventListener("click", function (e) {
    var t = copyTarget(e.target);
    if (!t) return;
    var sel = window.getSelection && String(window.getSelection());
    if (sel && sel.length > 0 && t.contains(window.getSelection().anchorNode)) return; // let people select part of it
    doCopy(t, e.clientX, e.clientY);
  });
  document.addEventListener("keydown", function (e) {
    if ((e.key === "Enter" || e.key === " ") && e.target && e.target.hasAttribute && e.target.hasAttribute("data-copy")) {
      e.preventDefault(); var r = e.target.getBoundingClientRect(); doCopy(e.target, r.left, r.bottom - 10);
    }
  });
  document.addEventListener("scroll", hideTip, true);

  /* Briefing */
  function hl(t) { return esc(t).replace(/\{\{([^}]+)\}\}/g, '<mark class="key">$1</mark>'); }
  var ICONS = {
    host: '<svg class="ico-i" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2l8 8-8 8-8-8z"/><path d="M10 7l3 3-3 3-3-3z" class="f"/></svg>',
    client: '<svg class="ico-i" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="6" r="3"/><path d="M4 18c0-4 2.7-6 6-6s6 2 6 6"/></svg>',
    link: '<svg class="ico-i" viewBox="0 0 20 20" aria-hidden="true"><path d="M2 7h13l-3-3M18 13H5l3 3"/></svg>'
  };
  function viewBriefing() {
    var v = $("#view");
    v.innerHTML = shell("Overview", "About Joint Operations", loading("Loading"));
    loadLocal("briefing").then(function () {
      if (currentView !== "briefing") return;
      var b = data.briefing || {};
      $("#vb").innerHTML = '<div class="bf">' +
        '<section class="bf-sec bf-hero"><h3 class="bf-head">' + hl(b.headline || "") + "</h3>" +
        (b.summary || []).map(function (t) { return '<p class="bf-lead">' + hl(t) + "</p>"; }).join("") +
        '<div class="toolbar"><a class="btn primary" href="#/contribute">Join the Hound</a><a class="btn" href="#/roadmap">Roadmap</a><a class="btn" href="#/guides">Guides</a></div></section>' +
        '<section class="bf-sec"><div class="label">How a session works</div>' +
        '<ol class="bf-steps">' + (b.how || []).map(function (h, k) {
          return '<li style="--k:' + k + '"><span class="st-n">' + (ICONS[h[0]] || k + 1) + '</span><div><h4>' + esc(h[1]) + "</h4><p>" + hl(h[2]) + "</p></div></li>";
        }).join("") + "</ol></section>" +
        (b.alert ? '<section class="bf-sec"><div class="label">' + esc(b.alert.title) + '</div><p class="bf-lead">' + hl(b.alert.text) + '</p><div class="alerts">' + (b.alert.states || []).map(function (s, k) {
          return '<div class="al ' + esc(s[0]) + '" style="--k:' + k + '"><b>' + esc(s[1]) + "</b><p>" + hl(s[2]) + "</p></div>";
        }).join("") + '</div><p class="source">' + hl(b.alert.foot || "") + ' · <a href="#/docs/adr-0012">ADR 0012</a></p></section>' : "") +
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
        '<p class="source">' + all[0] + " of " + all[1] + ' tasks done · read live from <a href="' + repoUrl("/blob/" + cfg.branch + "/ROADMAP.md") + '" target="_blank" rel="noopener noreferrer">ROADMAP.md</a> · each phase starts when the one before it is done</p></section>' +
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
  var logFilter = "all", logQ = "";
  function plainExcerpt(md, n) {
    var t = String(md || "").replace(/```[\s\S]*?```/g, " ").replace(/^#+\s.*$/gm, " ").replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/[*_`>#|-]+/g, " ").replace(/\s+/g, " ").trim();
    return t.length > n ? t.slice(0, n - 1).replace(/\s+\S*$/, "") + "…" : t;
  }
  function devlogEntries() {
    var out = [];
    ((data.devlog && data.devlog.entries) || []).forEach(function (e) { out.push(Object.assign({ kind: "note" }, e)); });
    (data.commits || []).forEach(function (c) { out.push(Object.assign({ kind: "commit" }, c)); });
    (data.releases || []).forEach(function (r) {
      out.push({ kind: "release", tag: isPlayable(r) ? "Release" : "Foundation", date: r.published_at, title: (r.name || r.tag_name), url: r.html_url, body: plainExcerpt(r.body, 260), ver: r.tag_name });
    });
    return out.sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });
  }
  function viewDevlog() {
    var v = $("#view");
    v.innerHTML = shell("News", "Dev Log", loading("Loading the dev log"));
    Promise.all([loadLocal("devlog"), loadCommits(), loadReleases(), loadRoadmap()]).then(function () { if (currentView === "devlog") drawDevlog(); refreshInfo(); });
  }
  function markQ(text) {
    var t = esc(text);
    if (!logQ) return t;
    var q = esc(logQ).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return t.replace(new RegExp("(" + q + ")", "ig"), "<mark>$1</mark>");
  }
  function drawDevlog() {
    var all = devlogEntries(), q = logQ.toLowerCase();
    var list = all.filter(function (e) {
      if (logFilter !== "all" && e.kind !== logFilter) return false;
      return !q || [e.title, e.body, e.tag, e.by, e.ver].join(" ").toLowerCase().indexOf(q) > -1;
    });
    var groups = [], by = {};
    list.forEach(function (e) { var d = fmtDate(e.date); if (!by[d]) { by[d] = []; groups.push(d); } by[d].push(e); });
    var count = function (k) { return all.filter(function (e) { return e.kind === k; }).length; };
    var rel = (data.releases || [])[0], ph = currentPhase(), last = all[0];
    var ctx = '<div class="log-ctx">' +
      '<div><span>Current build</span><b>' + esc(cfg.version) + "</b></div>" +
      '<div><span>Latest release</span><b>' + (rel ? esc(rel.tag_name) + " · " + fmtDate(rel.published_at) : "–") + "</b></div>" +
      '<div><span>Roadmap</span><b>' + (ph ? "Phase " + ph.n + " · " + ph.done + " of " + ph.total + " done" : "–") + "</b></div>" +
      '<div><span>Last update</span><b>' + (last ? fmtDate(last.date) : "–") + "</b></div></div>";
    $("#vb").innerHTML = ctx +
      '<div class="toolbar log-tools"><input class="field grow" id="lq" type="search" placeholder="Search notes, releases and commits" value="' + esc(logQ) + '" aria-label="Search the dev log"></div>' +
      '<div class="tabs" role="tablist">' + [["all", "All", all.length], ["note", "Notes", count("note")], ["release", "Releases", count("release")], ["commit", "Commits", count("commit")]].map(function (t) {
        return '<button role="tab" data-lf="' + t[0] + '" aria-selected="' + (logFilter === t[0]) + '">' + t[1] + '<span class="count">' + t[2] + "</span></button>";
      }).join("") + "</div>" +
      (q ? '<p class="sub">' + plural(list.length, "result") + " for “" + esc(logQ) + "”</p>" : "") +
      (groups.length ? groups.map(function (g) {
        return '<section class="day"><div class="day-d">' + esc(g) + "</div>" + by[g].map(function (e) {
          var title = e.url ? '<a href="' + esc(e.url) + '" target="_blank" rel="noopener noreferrer">' + markQ(e.title) + "</a>" : markQ(e.title);
          var kindTxt = { note: "Team note", release: e.tag === "Release" ? "Playable release" : "Foundation release", commit: "Change on " + cfg.branch }[e.kind] || "";
          return '<article class="entry k-' + e.kind + '"><span class="pill ' + (e.kind === "release" ? "ok" : e.kind === "note" ? "hot" : "") + '">' + esc(e.tag || e.kind) + "</span><div><h3>" + title + "</h3>" +
            (e.body ? "<p>" + markQ(e.body) + "</p>" : "") +
            '<div class="meta">' + esc(kindTxt) + (e.by ? " · " + markQ(e.by) : "") + "</div></div></article>";
        }).join("") + "</section>";
      }).join("") : '<div class="empty">No entries<small>' + (q ? "Nothing matches that search." : logFilter === "commit" && data.commits === null ? "GitHub could not be reached." : "Nothing logged here yet.") + "</small></div>") +
      '<p class="source">Sources: data/devlog.json' + (data.commits ? " · commits on " + esc(cfg.branch) : "") + (data.releases && data.releases.length ? " · releases" : "") + (data.commits === null ? " · GitHub unreachable" : "") + "</p>";
    $$("[data-lf]").forEach(function (b) { b.addEventListener("click", function () { logFilter = b.dataset.lf; drawDevlog(); }); });
    var t = 0;
    $("#lq").addEventListener("input", function (e) {
      clearTimeout(t); var val = e.target.value;
      t = setTimeout(function () { logQ = val.trim(); var pos = $("#lq").selectionStart; drawDevlog(); var n = $("#lq"); n.focus(); try { n.setSelectionRange(pos, pos); } catch (x) { /* older browsers */ } }, 160);
    });
  }

  /* Download */
  var dlOS = null;
  function guessOS() {
    var ua = (navigator.userAgent || "") + " " + (navigator.platform || "");
    return /Linux|X11|SteamOS/i.test(ua) && !/Android/i.test(ua) ? "linux" : "windows";
  }
  var DL_STEPS = {
    windows: ["Install Metal Gear Solid V from Steam and start it once.", "Download the latest release.", "Run the installer. It backs up your saves first.", "Start the game, then host a session or join one from the Session Browser."],
    linux: ["Install Metal Gear Solid V in Steam and start it once with Proton.", "Download the same release as Windows and install it into the game folder.", 'In Steam, open MGSV → Properties → Launch Options and paste:<br><code>WINEDLLOVERRIDES="dinput8=n,b" %command%</code>', 'Start the game. Full steps and Bazzite notes: <a href="#/guides/hp-gde-002">Linux and Proton Guide</a>.']
  };
  function viewDownload() {
    var v = $("#view");
    v.innerHTML = shell("Releases", "Download", loading("Checking releases on GitHub"));
    // Everything on this page is about the game mod. Website and foundation updates live in the Dev Log.
    Promise.all([loadReleases(), loadRoadmap()]).then(function (res) {
      var rel = res[0];
      if (currentView !== "download") return;
      dlOS = dlOS || guessOS();
      var latest = playableReleases()[0], ph = currentPhase(), road = data.roadmap || [];
      var done = road.reduce(function (a, p) { return a + p.done; }, 0), total = road.reduce(function (a, p) { return a + p.total; }, 0);
      var files = latest ? (latest.assets || []) : [];
      var hero = latest
        ? '<div class="dl-hero ready"><div class="dl-main"><span class="kicker">Latest release · ' + (latest.prerelease ? "Pre-release" : "Stable") + '</span><h3>Joint Operations ' + esc(latest.tag_name) + '</h3><p>Published ' + fmtDate(latest.published_at) + ". Free and open source.</p>" +
            '<div class="dl-files">' + (files.length ? files.map(function (a) {
              return '<a class="btn primary" href="' + esc(a.browser_download_url) + '">' + esc(a.name) + ' <small>' + fmtBytes(a.size) + "</small></a>";
            }).join("") : '<span class="sub">This release has no attached files yet.</span>') + "</div>" +
            '<div class="toolbar"><a class="btn" href="' + esc(latest.html_url) + '" target="_blank" rel="noopener noreferrer">Release notes</a><a class="btn" href="' + repoUrl("/releases") + '" target="_blank" rel="noopener noreferrer">All releases</a></div></div></div>'
        : '<div class="dl-hero"><div class="dl-main"><span class="kicker">Game release</span><h3>Joint Operations 0.1 is on its way</h3>' +
            "<p>" + (rel === null ? "GitHub could not be reached, so the release status is not shown. Try again later." : "The mod is in development and there is no playable version yet. When 0.1 is released, the download appears here automatically, for Windows and Linux.") + "</p>" +
            '<div class="dl-status"><div><span>Mod status</span><b>In development</b></div><div><span>First playable</span><b>Version 0.1</b></div><div><span>Current phase</span><b>' + (ph ? "Phase " + ph.n + " · " + esc(ph.title) : "–") + "</b></div></div>" +
            (total ? '<div class="dl-progress"><div class="meter"><i style="width:' + Math.round(done / total * 100) + '%"></i></div><small>Road to 0.1: ' + done + " of " + total + " roadmap tasks done</small></div>" : "") +
            '<div class="toolbar"><a class="btn primary" href="#/roadmap">Follow the road to 0.1</a><a class="btn" href="#/contribute">Contribute to Joint Operations</a></div></div></div>';
      var req = [["Game", "Your own copy of MGSV: The Phantom Pain on Steam"], ["Windows", "Windows 10 or 11"], ["Linux", "Through Proton, including Steam Deck and Bazzite"], ["Online", "Steam running. No ports to open"], ["Players", "Up to 16 per session"], ["Price", "Free"]];
      var body = hero +
        '<div class="dl-grid"><section class="panel"><div class="label">Install</div>' +
          '<div class="tabs small" role="tablist">' + [["windows", "Windows"], ["linux", "Linux · Proton"]].map(function (t) {
            return '<button role="tab" data-os="' + t[0] + '" aria-selected="' + (dlOS === t[0]) + '">' + (t[0] === "windows" ? ICON_WIN : ICON_LNX) + t[1] + "</button>";
          }).join("") + "</div>" +
          '<ol class="steps" id="dlSteps">' + DL_STEPS[dlOS].map(function (s) { return "<li>" + s + "</li>"; }).join("") + "</ol>" +
          '<p class="sub">We guessed your system from your browser. Pick the other tab if that is wrong.</p></section>' +
        '<section class="panel"><div class="label">Requirements</div><dl class="dl-req">' + req.map(function (r) { return "<div><dt>" + r[0] + "</dt><dd>" + r[1] + "</dd></div>"; }).join("") + "</dl></section></div>" +
        '<p class="note">You need your own copy of Metal Gear Solid V. Joint Operations never includes game files and never connects to Konami\'s servers. Step-by-step help: <a href="#/guides/hp-gde-001">Player Guide</a>.</p>';
      v.querySelector("#vb").innerHTML = body;
      $$('[data-os]').forEach(function (b) {
        b.addEventListener("click", function () {
          dlOS = b.dataset.os;
          $$('[data-os]').forEach(function (x) { x.setAttribute("aria-selected", String(x === b)); });
          $("#dlSteps").innerHTML = DL_STEPS[dlOS].map(function (s) { return "<li>" + s + "</li>"; }).join("");
        });
      });
      refreshInfo();
    });
  }

  /* Sessions */
  var sessState = { q: "", region: "all", hideFull: false, sort: "ping", dir: 1 };
  function serverList() { return (data.servers && data.servers.servers) || []; }
  function viewSessions() {
    var v = $("#view");
    v.innerHTML = shell("Joint Operations", "Session Browser", loading("Looking for sessions"));
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
      '<button class="btn" id="srf">Refresh</button>' +
        '<span class="btn primary off" aria-disabled="true" title="Hosting arrives with version 0.1">Host a session</span></div>' +
      '<div class="tw"><table><tr>' + th("name", "Session") + th("host", "Host") + "<th>Details</th>" + th("players", "Players") + "<th>Status</th>" + th("ping", "Ping") + "</tr>" +
      rows + "</table></div>" +
      (rows ? "" : all.length ? '<div class="empty" id="noServers">No sessions match<small>Try other filters.</small></div>'
        : '<div class="nolink" id="noServers"><svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 20a23 23 0 0132 0M14 26a15 15 0 0120 0M20 32a7 7 0 018 0"/><circle cx="24" cy="38" r="2"/><path class="x" d="M9 9l30 30"/></svg>' +
            '<b>No sessions online</b><small>Live sessions appear here from version 0.1. Hosts list their game, you pick one and deploy.</small></div>') +
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
  // Contractor ranks, Mother Base style, by completed contracts (docs/departments.md)
  // Contractor grades follow Mother Base staff grades (E to S++). As in MGSV, a contractor holds a grade in every field
  // (like a unit), earned from contract points in that field; the thresholds climb steeply. See docs/departments.md.
  var GRADES = [
    ["E", 1, "Contractor role on Discord, listed on the contributor wall"],
    ["D", 4, ""], ["C", 8, ""],
    ["B", 14, "Hold two contracts at once"],
    ["A", 22, "Review {{easy:Easy}} contracts in this field, as advice to Quality"],
    ["A+", 32, "Review {{medium:Medium}} contracts in this field"],
    ["A++", 50, "Mentor new contractors in this field"],
    ["S", 80, "Review {{hard:Hard}} contracts in this field"],
    ["S+", 125, "Can be invited into a department"],
    ["S++", 200, "Candidate for a lead position"]
  ];
  var CP = { easy: 2, medium: 5, hard: 10 }; // contract points per completed contract
  // Contract difficulty (docs/departments.md): information only, never a gate. Name, short label, and what makes it this hard
  var DIFF = {
    easy: ["Easy", "Good first contract", "Clear steps and a small scope. No game knowledge needed: docs, test runs, small tools."],
    medium: ["Medium", "Some experience", "Some research or design. Touches a few files or systems, or needs the game and a test rig."],
    hard: ["Hard", "Deep skills", "Unknown ground: reverse engineering, networking, core systems. Needs deep skills and careful testing."]
  };
  var DIFF_ORDER = ["easy", "medium", "hard"];
  // Board columns: field, description, modules, icon
  var FIELDS = [
    ["code", "Code", "Networking, session, launcher and the mod API", ["net", "session", "launcher", "modapi"], "devlog"],
    ["re", "Architecture Research", "How the game is built inside, and where we hook in", ["hooks"], "sessions"],
    ["qa", "Testing", "Test rigs, harnesses and bad-network profiles", ["testing"], "contribute"],
    ["design", "Design and web", "Screens, the lobby and the website", ["lobby", "web"], "mods"],
    ["docs", "Docs and legal", "Writing, research summaries and the legal position", ["docs", "legal"], "guides"]
  ];
  var CORE_NOTE = "Core: on the 0.1 critical path. Development Department only.";
  // {{easy:Text}} color-codes a word by difficulty; {{key:Text}} uses the amber accent
  function tint(s) { return esc(s).replace(/\{\{(easy|medium|hard|key):([^}]+)\}\}/g, function (_, k, w) { return '<b class="tint ' + k + '">' + w + "</b>"; }); }
  function diffPill(c) {
    var d = DIFF[c.difficulty];
    return (d ? '<span class="pill diff ' + esc(c.difficulty) + '" title="' + esc(d[0] + ": " + d[2]) + '">' + esc(d[0]) + "</span>" : "") +
      (c.core ? '<span class="pill diff core" title="' + esc(CORE_NOTE) + '">Core</span>' : "");
  }
  var conState = { module: "all", status: "all", diff: "all", q: "" };
  function contractList() {
    if (data.issues && data.issues.length) return data.issues;
    var p = data.contracts && data.contracts.contracts;
    return (p || []).map(function (c) { return Object.assign({ status: "planned", by: [], live: false }, c); });
  }
  function gradeFor(p) { var r = null; GRADES.forEach(function (x) { if (p >= x[1]) r = x; }); return r; }
  function gradeIdx(g) { return g ? GRADES.indexOf(g) : -1; }
  function fieldOf(module) { var f = FIELDS.filter(function (x) { return x[3].indexOf(module) > -1; })[0]; return f ? f[0] : "code"; }
  // items: [{ login, name, difficulty, module }] -> sorted [{ login, name, n, f: {field: points}, best: grade }]
  function tallyGrades(items) {
    var by = {};
    items.forEach(function (it) {
      var u = by[it.login] = by[it.login] || { login: it.login, name: it.name, n: 0, f: {} }, k = fieldOf(it.module);
      u.n++; if (it.name) u.name = it.name;
      u.f[k] = (u.f[k] || 0) + (CP[it.difficulty] || CP.easy);
    });
    return Object.keys(by).map(function (k) {
      var u = by[k], best = null;
      Object.keys(u.f).forEach(function (f) { var g = gradeFor(u.f[f]); if (gradeIdx(g) > gradeIdx(best)) best = g; });
      u.best = best; return u;
    }).sort(function (a, b) { return gradeIdx(b.best) - gradeIdx(a.best) || b.n - a.n || a.login.localeCompare(b.login); });
  }
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
      if (conState.diff !== "all" && c.difficulty !== conState.diff) return false;
      if (conState.q && (c.id + " " + c.title + " " + (c.skills || "") + " " + (c.goal || "")).toLowerCase().indexOf(conState.q.toLowerCase()) < 0) return false;
      return true;
    });
    // Board: one column per field, cards sorted open first (easy to hard), finished work last
    var STATUS = { planned: ["○", "Planned"], open: ["●", "Open"], blocked: ["✕", "Blocked"], claimed: ["◐", "Claimed"], review: ["◑", "In review"], done: ["✓", "Done"] };
    var rank = { open: 0, planned: 1, claimed: 2, review: 3, blocked: 4, done: 5 };
    function card(c, n) {
      var st = c.blocked && c.status === "open" ? "blocked" : c.status, S = STATUS[st] || ["", st];
      var action = "";
      if (c.live) action = (st !== "done" ? '<a class="btn small primary" href="' + esc(c.url) + '#new_comment_field" target="_blank" rel="noopener noreferrer" title="Comment /claim on the issue. Several people can claim the same contract.">' + ((c.by || []).length ? "Join claim" : "Claim") + "</a>" : "") +
        '<a class="btn small" href="' + esc(c.url) + '" target="_blank" rel="noopener noreferrer">View on GitHub</a>';
      else action = '<a class="btn small issuebtn" href="' + esc(newIssueUrl("[" + c.id + "] " + c.title, "Module: " + (MODULES[c.module] || c.module) + "\nDifficulty: " + ((DIFF[c.difficulty] || [c.difficulty])[0]) + (c.core ? " (Core: Development Department only)" : "") + "\nSkills: " + (c.skills || "") + (c.depends && c.depends.length ? "\nDepends on: " + c.depends.join(", ") : "") + "\n\n## Goal\n" + (c.goal || "") + (c.deliverable ? "\n\n## Deliverable\n" + c.deliverable : "") + "\n\n## Definition of done\n" + ((c.acceptance && c.acceptance.length) ? c.acceptance.map(function (a) { return "- [ ] " + a; }).join("\n") : "- ") + "\n", "contract,module:" + c.module + ",difficulty:" + c.difficulty + (c.core ? ",core" : ""))) + '" target="_blank" rel="noopener noreferrer">Open as issue <span aria-hidden="true">↗</span></a>';
      var done = st === "done";
      return '<article class="kc st-' + esc(st) + " d-" + esc(c.difficulty || "none") + '" style="--i:' + n + '">' +
        '<div class="kc-top"><span class="kc-id">' + esc(c.id) + '</span><span class="kc-st">' + S[0] + " " + S[1] + (c.by && c.by.length > 1 && !done ? " · " + c.by.length : "") + "</span></div>" +
        "<h3>" + esc(c.title) + "</h3>" +
        ((c.by || []).length && !done ? '<div class="kc-claims" aria-label="Claimed by">' + c.by.map(function (u) { return '<a class="tok" href="https://github.com/' + encodeURIComponent(u) + '" target="_blank" rel="noopener noreferrer"><i>◆</i>' + esc(u) + "</a>"; }).join("") + "</div>" : "") +
        '<div class="kc-tags">' + diffPill(c) + (c.module ? '<span class="pill mod">' + esc(MODULES[c.module] || c.module) + "</span>" : "") + "</div>" +
        (done
          ? '<div class="kc-stamp">Completed' + (c.by && c.by.length ? " by " + esc(c.by.join(", ")) : "") + "</div>" + (c.live ? '<div class="actions">' + action + "</div>" : "")
          : (c.depends && c.depends.length ? '<div class="meta' + (c.blocked ? " blocked" : "") + '">' + (c.blocked ? "Waiting for " : "After ") + esc(c.depends.join(", ")) + "</div>" : "") +
            (c.goal ? '<p class="goal">' + esc(c.goal) + "</p>" : "") +
            ((c.acceptance && c.acceptance.length) || c.deliverable ? '<details class="spec"><summary><span>Acceptance criteria</span><i aria-hidden="true">' + (c.acceptance ? c.acceptance.length : 0) + "</i></summary>" +
              (c.deliverable ? '<div class="meta">Deliverable: ' + esc(c.deliverable) + "</div>" : "") +
              (c.acceptance && c.acceptance.length ? "<ul>" + c.acceptance.map(function (a) { return "<li>" + esc(a) + "</li>"; }).join("") + "</ul>" : "") + "</details>" : "") +
            (c.skills ? '<div class="meta">Skills: ' + esc(c.skills) + "</div>" : "") +
            '<div class="actions">' + action + "</div>") +
        "</article>";
    }
    var board = FIELDS.map(function (f) {
      var all = list.filter(function (c) { return f[3].indexOf(c.module) > -1; });
      var cs = shown.filter(function (c) { return f[3].indexOf(c.module) > -1; }).sort(function (a, b) {
        var sa = a.blocked && a.status === "open" ? "blocked" : a.status, sb = b.blocked && b.status === "open" ? "blocked" : b.status;
        return (rank[sa] - rank[sb]) || (DIFF_ORDER.indexOf(a.difficulty) - DIFF_ORDER.indexOf(b.difficulty));
      });
      if (!all.length) return "";
      var dn = all.filter(function (c) { return c.status === "done"; }).length;
      return '<section class="kcol f-' + f[0] + '"><header class="kcol-h"><div class="kcol-t">' + menuIcon(f[4]) + "<b>" + esc(f[1]) + "</b><i>" + cs.length + "</i></div>" +
        "<p>" + esc(f[2]) + '</p><div class="kcol-m"><span style="width:' + Math.round(dn / all.length * 100) + '%"></span></div><small>' + dn + " of " + all.length + " done</small></header>" +
        '<div class="kcol-b">' + (cs.length ? cs.map(card).join("") : '<div class="kcol-e">Nothing matches the filters</div>') + "</div></section>";
    }).join("");
    // Module progress
    var mods = Object.keys(MODULES).map(function (k) {
      var l = list.filter(function (c) { return c.module === k; }), d = l.filter(function (c) { return c.status === "done"; }).length;
      return { k: k, n: l.length, d: d };
    }).filter(function (m) { return m.n; });
    // Leaderboard from completed live contracts
    var items = [];
    list.forEach(function (c) { if (c.status === "done") (c.by || []).forEach(function (u) { items.push({ login: u, difficulty: c.difficulty, module: c.module }); }); });
    var ops = tallyGrades(items);
    var opt = function (val, cur, txt) { return '<option value="' + val + '"' + (cur === val ? " selected" : "") + ">" + txt + "</option>"; };
    $("#vb").innerHTML =
      '<div class="conbar"><div class="tabs" role="tablist">' + [["board", "Contract board"], ["ranks", "Contractor ranks"]].map(function (t) {
        return '<button role="tab" data-tab="' + t[0] + '" aria-selected="' + (conTab === t[0]) + '">' + t[1] + "</button>";
      }).join("") + "</div>" +
      '<div class="howbox"><button class="btn howbtn' + (conTab === "how" ? " on" : "") + '" data-tab="how" aria-pressed="' + (conTab === "how") + '">How it works</button><small>Discover how the contribution system works</small></div>' +
      '<div class="conupd">' + conUpdated(live) + "</div></div>" +
      '<div id="ctab"></div>';
    var tabHtml = {
      board:
        (live ? "" : '<p class="note">This is the plan. Version 0.1 is being built by the project lead, and contracts open to the Contractor Department after 0.1. Testers are welcome now: join the Discord.</p>') +
        '<div class="crow-sep"><span>Overview</span></div>' +
        '<div class="stats">' + (live
          ? '<div class="stat"><b>' + counts.open + '</b><span>Open</span></div><div class="stat"><b>' + counts.claimed + '</b><span>Claimed</span></div><div class="stat"><b>' + counts.review + '</b><span>In review</span></div><div class="stat"><b>' + counts.done + "</b><span>Done</span></div>"
          : '<div class="stat"><b>' + counts.planned + '</b><span>Planned</span></div><div class="stat"><b>' + mods.length + '</b><span>Modules</span></div><div class="stat"><b>' + counts.done + '</b><span>Done</span></div>') + "</div>" +
        '<div class="crow-sep"><span>Difficulty</span></div>' +
        '<p class="diffhint">Select your difficulty to apply filters' + (conState.diff !== "all" ? ' · <button class="linkbtn" id="dclr">Show all difficulties</button>' : "") + "</p>" +
        '<div class="diffs' + (conState.diff !== "all" ? " picking" : "") + '">' + DIFF_ORDER.map(function (k) {
          var d = DIFF[k], n2 = list.filter(function (c) { return c.difficulty === k; }).length;
          return '<button class="diffcard ' + k + (conState.diff === k ? " sel" : "") + '" data-diff="' + k + '" aria-pressed="' + (conState.diff === k) + '"><span class="dc-on" aria-hidden="true">✓ Filter on</span><span class="dc-h"><b>' + d[0] + "</b><i>" + plural(n2, "contract") + "</i></span>" +
            '<span class="dc-who">' + d[1] + '</span><span class="dc-what">' + d[2] + "</span></button>";
        }).join("") + "</div>" +
        '<p class="sub diffnote">Difficulty tells you what to expect. It is not a gate: anyone can take any contract. <span class="pill diff core">Core</span> ' + esc(CORE_NOTE) + "</p>" +
        '<div class="crow-sep"><span>Contract board</span></div>' +
        '<div class="toolbar"><input class="field grow" id="cq" type="search" placeholder="Search contracts" value="' + esc(conState.q) + '" aria-label="Search contracts">' +
        '<select class="field" id="cm" aria-label="Module">' + opt("all", conState.module, "All modules") + Object.keys(MODULES).map(function (k) { return opt(k, conState.module, MODULES[k]); }).join("") + "</select>" +
        '<select class="field" id="cs" aria-label="Status">' + opt("all", conState.status, "All statuses") + (live ? opt("open", conState.status, "Open") + opt("claimed", conState.status, "Claimed") + opt("review", conState.status, "In review") + opt("done", conState.status, "Done") : opt("planned", conState.status, "Planned")) + "</select>" +
        '<select class="field" id="cz" aria-label="Difficulty">' + opt("all", conState.diff, "All difficulties") + DIFF_ORDER.map(function (k) { return opt(k, conState.diff, DIFF[k][0]); }).join("") + "</select></div>" +
        (shown.length ? '<div class="kanban' + (cardsAnim ? " anim" : "") + '">' + board + "</div>" : '<div class="empty">No contracts match<small>Change the filters.</small></div>') +
        (live ? '<p class="sub claimnote">To claim, comment <code>/claim</code> on the contract\'s GitHub issue. Several people can claim the same contract, and every claimant shows here with their token. <code>/unclaim</code> leaves it. The board refreshes every 2 minutes.</p>' : "") +
        '<p class="source">Source: ' + (live ? "GitHub issues labeled contract, live" : data.issues === null ? "data/contracts.json · GitHub could not be reached" : "data/contracts.json") + "</p>",
      how:
        '<div class="cols"><div class="panel"><div class="label">Taking a contract</div><ol class="steps">' +
        "<li>Pick any open contract. An <b class=\"tint easy\">Easy</b> one is a good start.</li><li>Comment on the GitHub issue to claim it. A maintainer assigns you.</li><li>Do the work on a branch in your fork. Sign off every commit.</li><li>Open a pull request that says Closes #number.</li><li><b class=\"tint key\">Quality</b> checks it against the acceptance criteria and merges it. You get a <b class=\"tint key\">signed record</b> and move up in rank.</li></ol></div>" +
        '<div class="panel"><div class="label">Rules</div><ol class="steps">' +
        "<li>Pull requests only. Nobody pushes to main.</li><li>No game files and no code copied from other mods.</li><li>AI tools are welcome for code and docs. No generative AI art, music or voices.</li><li>Nothing that touches Konami's servers or anti-cheat.</li><li>Leaving is fine. Post a short handoff note first.</li></ol></div></div>" +
        '<div class="toolbar" style="margin-top:14px"><a class="btn primary" href="#/guides/hp-gde-003">Quick start</a><a class="btn" href="#/guides/hp-pol-002">AI Use Policy</a><a class="btn" href="' + repoUrl("/fork") + '" target="_blank" rel="noopener noreferrer">Fork on GitHub</a><a class="btn" href="' + repoUrl("/issues?q=is%3Aopen+label%3Acontract") + '" target="_blank" rel="noopener noreferrer">Contracts on GitHub</a></div>' +
        '<div class="label">Module progress</div><div class="cols">' + mods.map(function (m) {
          return '<div class="panel"><div class="kv"><span>' + esc(MODULES[m.k]) + "</span><b>" + m.d + " / " + m.n + '</b></div><div class="meter"><i style="width:' + Math.round(m.d / m.n * 100) + '%"></i></div></div>';
        }).join("") + "</div>",
      ranks:
        '<p class="sub">Contractors are graded like Mother Base staff, from <b>E</b> to <b>S++</b>. As in the game, you hold a grade in <b>each field</b>, the way staff hold a grade in each unit. Every completed contract earns points in its field: <b class="tint easy">Easy</b> ' + CP.easy + ', <b class="tint medium">Medium</b> ' + CP.medium + ', <b class="tint hard">Hard</b> ' + CP.hard + '. Each grade needs more points than the last, so the top grades take real work. Your best grade is your rank on Discord.</p>' +
        '<div class="ranks">' + GRADES.map(function (r, k) { return '<div class="rank' + (r[2] ? "" : " quiet") + '" style="--i:' + k + '"><b class="r-grade">' + esc(r[0]) + '</b><span class="r-n">' + r[1] + " point" + (r[1] === 1 ? "" : "s") + '</span><span class="r-u">' + (r[2] ? tint(r[2]) : "Experience in the field") + "</span></div>"; }).join("") + "</div>" +
        '<ul class="notes"><li><b>Commendations</b> work like medals: Administration can award one for exceptional work. It adds ' + CP.medium + ' points to every field and is listed publicly with the reason.</li>' +
        '<li>Grades never go down. Leaving and coming back is normal.</li>' +
        '<li>Grades give no authority over other people. Reviews are advice: Quality and Development still decide. See <a href="#/team">the chain of command</a>.</li></ul>' +
        '<div class="label">Contract difficulty</div>' +
        '<div class="tw"><table><tr><th>Difficulty</th><th>What makes it this hard</th></tr>' + DIFF_ORDER.map(function (k) { return '<tr><td><span class="pill diff ' + k + '">' + DIFF[k][0] + "</span></td><td>" + DIFF[k][2] + "</td></tr>"; }).join("") +
        '<tr><td><span class="pill diff core">Core</span></td><td>On the 0.1 critical path, at any difficulty. Reserved for the Development Department until 0.1.</td></tr></table></div>' +
        '<div class="label">Contractors</div>' +
        (ops.length ? '<div class="tw"><table><tr><th>Contractor</th><th>Contracts</th><th>Rank</th>' + FIELDS.map(function (f) { return "<th>" + esc(f[1]) + "</th>"; }).join("") + "</tr>" + ops.map(function (u) {
          return '<tr><td><a href="https://github.com/' + encodeURIComponent(u.login) + '" target="_blank" rel="noopener noreferrer">' + esc(u.login) + '</a></td><td class="num">' + u.n + "</td><td><b>" + esc(u.best ? u.best[0] : "–") + "</b></td>" +
            FIELDS.map(function (f) { var g = gradeFor(u.f[f[0]] || 0); return '<td class="num">' + (g ? esc(g[0]) : "–") + "</td>"; }).join("") + "</tr>";
        }).join("") + "</table></div>" : '<div class="empty">No completed contracts yet<small>Contractors appear here when contracts are closed on GitHub.</small></div>')
    };
    $("#ctab").innerHTML = tabHtml[conTab];
    cardsAnim = false;
    $$('[data-tab]').forEach(function (b) { b.addEventListener("click", function () { conTab = b.dataset.tab; drawContribute(); }); });
    if (conTab === "board") {
      $("#cq").addEventListener("input", function (e) { conState.q = e.target.value; var p = e.target.selectionStart; drawContribute(); var n = $("#cq"); n.focus(); try { n.setSelectionRange(p, p); } catch (x) { /* ignore */ } });
      $("#cm").addEventListener("change", function (e) { conState.module = e.target.value; drawContribute(); });
      $("#cs").addEventListener("change", function (e) { conState.status = e.target.value; drawContribute(); });
      $("#cz").addEventListener("change", function (e) { conState.diff = e.target.value; drawContribute(); });
      $$("[data-diff]").forEach(function (b) { b.addEventListener("click", function () { conState.diff = conState.diff === b.dataset.diff ? "all" : b.dataset.diff; cardsAnim = true; drawContribute(); status(conState.diff === "all" ? "Showing all difficulties" : DIFF[conState.diff][0] + " contracts only"); }); });
      if ($("#dclr")) $("#dclr").addEventListener("click", function () { conState.diff = "all"; cardsAnim = true; drawContribute(); });
    }
  }
  var conTab = "board", cardsAnim = true;
  function conUpdated(live) {
    var t = live ? data.issuesAt : (data.contracts && data.contracts.updated);
    if (!t) return "";
    var d = new Date(t), ago = live ? Math.max(0, Math.round((Date.now() - d) / 60000)) : -1;
    return '<span class="upd-k">Last update</span><b>' + (live ? (ago < 1 ? "just now" : ago + " min ago") : esc(fmtDate(t))) + "</b><small>" + (live ? "Live from GitHub, every 2 minutes" : "Planned contracts") + "</small>";
  }

  // Keep claims live while the Contribute page is open and visible
  setInterval(function () {
    if (currentView !== "contribute" || document.hidden || !data.issues || !data.issues.length) return;
    session.clear("jo-gh:/repos/" + cfg.repo + "/issues?labels=contract");
    data.issues = undefined;
    loadContracts().then(function () { if (currentView === "contribute" && conTab === "board") { cardsAnim = false; drawContribute(); } });
  }, 120000);

  /* Mods */
  var modState = { tab: "compatible", q: "" };
  function viewMods() {
    var v = $("#view");
    v.innerHTML = shell("Community", "Mods", loading("Loading mods"));
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
      '<p class="sub">' + (modState.tab === "compatible" ? "Re-engineered and tested to work with Joint Operations." : "These work, with known issues. Read the notes before you install.") + "</p>" +
      '<div class="toolbar"><input class="field grow" id="mq" type="search" placeholder="Search mods" value="' + esc(modState.q) + '" aria-label="Search mods">' +
      '<a class="btn primary" href="' + esc(repoUrl("/issues/new?template=mod-submission.md")) + '" target="_blank" rel="noopener noreferrer">Upload a mod</a></div>' +
      (list.length ? '<div class="modgrid">' + list.map(function (m, k) {
        return '<article class="modc ' + (modState.tab === "issues" ? "warn" : "ok") + '" style="--k:' + k + '"><header><h3>' + esc(m.name) + '</h3><span class="pill ' + (modState.tab === "issues" ? "warn" : "ok") + '">' + (modState.tab === "issues" ? "Known issues" : "Compatible") + "</span></header>" +
          '<dl><div><dt>Version</dt><dd>' + esc(m.version || "–") + '</dd></div><div><dt>Author</dt><dd>' + esc(m.author || "–") + '</dd></div><div><dt>Tested on</dt><dd>' + esc(m.tested || "–") + "</dd></div></dl>" +
          (m.notes ? "<p>" + esc(m.notes) + "</p>" : "") +
          (m.url && /^https?:/i.test(m.url) ? '<a class="btn small" href="' + esc(m.url) + '" target="_blank" rel="noopener noreferrer">Get the mod</a>' : "") + "</article>";
      }).join("") + "</div>"
        : '<div class="empty">' + (modState.q ? "No mods match<small>Try another search.</small>" : "No mods listed yet<small>Curated mods appear here after review. Upload yours to be the first.</small>") + "</div>") +
      '<div class="label">How a mod gets listed</div><ol class="modflow"><li><b>Upload</b><span>Open a mod submission on GitHub with a link, version and what it changes.</span></li><li><b>Quality review</b><span>Quality installs it with Joint Operations on Windows and Proton and notes any issues.</span></li><li><b>Listed</b><span>It appears here as Compatible or with Known issues, and is retested on new releases.</span></li></ol>' +
      '<p class="sub">Mods must not contain game files, code copied from other mods without permission, or generative AI art, music or voices (<a href="#/guides/hp-pol-002">AI Use Policy</a>).</p>' +
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
    if (docsMode() === "neural") return viewNeural(id);
    NW = null;
    var v = $("#view");
    if ($("#nw")) v.innerHTML = "";
    if (!$("#docNav")) v.innerHTML = shell("Library", "Docs", loading("Loading the library"));
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
    var html = '<button class="btn small nw-switch" id="toNeural">Neural view</button><button class="btn doc-toggle" id="dtog" aria-expanded="false" aria-controls="docNav">' + esc(cur ? cur.title : "Documents") + '<span aria-hidden="true">▾</span></button>' + '<input class="field" id="dq" type="search" placeholder="Search documents" value="' + esc(docFilter) + '" aria-label="Search documents">';
    groups.forEach(function (g) {
      var items = by[g].filter(function (d) { return !q || q.length >= 3 || d.title.toLowerCase().indexOf(q) > -1; });
      if (!items.length) return;
      html += '<div class="grp">' + esc(g) + "</div>" + items.map(function (d) {
        return '<a href="#/docs/' + esc(d.id) + '"' + (d.id === active ? ' aria-current="true"' : "") + ">" + esc(d.title) + "</a>";
      }).join("");
    });
    var nav = $("#docNav"); nav.innerHTML = html;
    $("#toNeural").addEventListener("click", function () { setDocsMode("neural"); $("#view").innerHTML = ""; viewNeural(); });
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

  /* ---------------- Docs: neural web ----------------
     A force-directed map of the documentation. Hubs are the library groups, neurons are documents,
     synapses are links between documents. Clicking a neuron opens it as an A4 window beside the web;
     windows stack, minimize to a dock (up to 5 documents) and restore. Closing everything rebuilds the web. */
  var NW_COLORS = { Project: "#c9a24a", Technical: "#6fb7c9", Decisions: "#d77a6e", Research: "#8fbf7f", Community: "#a99be0", Legal: "#b7c2c6", Handbook: "#e6dcc0" };
  var NW_BUILD_MS = 1500, NW_MAX_DOCS = 5;
  var NW = null;
  // The neural web needs pointer events and canvas; older browsers get the classic list
  function docsMode() { if (!window.PointerEvent || !document.createElement("canvas").getContext) return "classic"; return store.get("jo-docs-mode", "neural") === "classic" ? "classic" : "neural"; }
  function setDocsMode(m) { store.set("jo-docs-mode", m); }
  function nwColor(g) { return NW_COLORS[g] || "#c9d0d2"; }
  function rgba(hex, a) { var n = parseInt(hex.slice(1), 16); return "rgba(" + (n >> 16) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")"; }

  function viewNeural(id) {
    if (NW && $("#nw")) { if (id) nwOpen(id); return; }
    var v = $("#view");
    v.innerHTML = shell("Library", "Docs", loading("Building the neural web"));
    loadLocal("docs").then(function (man) {
      if (currentView !== "docs") return;
      var docs = (man && man.docs) || [];
      $("#vb").innerHTML =
        '<div class="nw-top"><div class="nw-switchbar"><span>Don\'t like the neural interface?</span><button class="btn small" id="nwClassicTop">Switch back to classic</button></div></div>' +
        '<div class="nw-wrap"><div class="nw" id="nw">' +
          '<div class="nw-graph" id="nwGraph"><canvas id="nwCanvas" role="img" aria-label="Neural web of the documentation. Use the list below or Classic view to browse by keyboard."></canvas>' +
            '<div class="nw-hud"><input class="field" id="nwq" type="search" placeholder="Search the web" aria-label="Search documents">' +
              '<button class="btn small" id="nwClassic">Classic view</button></div>' +
            '<div class="nw-legend" id="nwLegend"></div>' +
            '<div class="nw-hint" id="nwHint">Point at a neuron to see it. Click to open.</div>' +
            '<div class="nw-tip" id="nwTip" aria-hidden="true"></div>' +
            '<ul class="sr-only" id="nwList"></ul></div>' +
          '<div class="nw-stage" id="nwStage" aria-live="polite"></div>' +
          '<div class="nw-dock" id="nwDock" aria-label="Minimized documents"></div>' +
        "</div>" +
        '<aside class="nw-guide" aria-label="How to use the docs"><div class="label">Using the docs</div><ul>' +
          '<li><b>Point</b><span>Hover a neuron to see its title and what it links to.</span></li>' +
          '<li><b>Click</b><span>Open a document. Click a group\'s hub to show only that group.</span></li>' +
          '<li><b>Search</b><span>Type in the search box to light up matching documents. Enter opens the first.</span></li>' +
          '<li><b>Stack</b><span>Keep up to ' + NW_MAX_DOCS + ' documents open. Click a header to bring it to the front.</span></li>' +
          '<li><b>Minimize</b><span>Send a document to the dock at the bottom. Hover a tab to preview it.</span></li>' +
          '<li><b>Drag</b><span>Move neurons around. Links inside documents open the next one.</span></li>' +
          '<li><b>Classic</b><span>Prefer a plain list? Switch above, or set it in Options.</span></li>' +
        '</ul><div class="nw-count">' + plural(docs.length, "document") + " in " + plural(docs.map(function (d) { return d.group; }).filter(function (g, i, a) { return a.indexOf(g) === i; }).length, "group") + "</div></aside></div>";
      $("#nwClassic").addEventListener("click", function () { setDocsMode("classic"); NW = null; viewDocs(id); });
      $("#nwClassicTop").addEventListener("click", function () { $("#nwClassic").click(); });
      nwInit(docs);
      if (id) setTimeout(function () { if (NW) nwOpen(id); }, opts.motion ? NW_BUILD_MS * 0.6 : 0);
    });
  }

  function nwInit(docs) {
    var groups = [];
    docs.forEach(function (d) { if (groups.indexOf(d.group) < 0) groups.push(d.group); });
    var nodes = [{ id: "core", kind: "core", label: cfg.project || "Joint Operations", r: 24, group: null }];
    groups.forEach(function (g) { nodes.push({ id: "hub:" + g, kind: "hub", label: g, r: 15, group: g }); });
    groups.forEach(function (g) {
      docs.forEach(function (d) { if (d.group === g) nodes.push({ id: d.id, kind: "doc", label: d.title, r: 8, group: g, doc: d }); });
    });
    var byId = {}, edges = [];
    nodes.forEach(function (n, i) { n.i = i; n.x = 0; n.y = 0; n.vx = 0; n.vy = 0; n.s = 0; n.on = false; byId[n.id] = n; });
    groups.forEach(function (g) { edges.push({ a: byId.core, b: byId["hub:" + g], kind: "trunk" }); });
    nodes.forEach(function (n) { if (n.kind === "doc") { n.parent = byId["hub:" + n.group]; n.parent.kids = (n.parent.kids || 0) + 1; edges.push({ a: n.parent, b: n, kind: "branch" }); } });
    NW = { ready: false, nodes: nodes, edges: edges, byId: byId, groups: groups, docs: docs, open: [], min: [], html: {}, text: {},
      hover: null, iso: null, q: "", pulses: [], t0: performance.now(), raf: 0, drag: null, w: 0, h: 0 };
    // Legend and keyboard list
    $("#nwLegend").innerHTML = groups.map(function (g) {
      return '<button class="nw-chip" data-g="' + esc(g) + '" style="--c:' + nwColor(g) + '"><i></i>' + esc(g) + "</button>";
    }).join("");
    $$("#nwLegend .nw-chip").forEach(function (b) {
      b.addEventListener("click", function () { NW.iso = NW.iso === b.dataset.g ? null : b.dataset.g; $$("#nwLegend .nw-chip").forEach(function (x) { x.classList.toggle("on", x.dataset.g === NW.iso); }); });
    });
    $("#nwList").innerHTML = docs.map(function (d) { return '<li><button data-open="' + esc(d.id) + '">' + esc(d.group + ": " + d.title) + "</button></li>"; }).join("");
    $$("#nwList [data-open]").forEach(function (b) { b.addEventListener("click", function () { nwOpen(b.dataset.open); }); });
    $("#nwq").addEventListener("input", function (e) { NW.q = e.target.value.trim().toLowerCase(); });
    $("#nwq").addEventListener("keydown", function (e) {
      if (e.key !== "Enter" || !NW.q) return;
      var hit = NW.nodes.filter(function (n) { return n.kind === "doc" && n.label.toLowerCase().indexOf(NW.q) > -1; })[0];
      if (hit) nwOpen(hit.id);
    });
    nwCanvas();
    nwBuild();
    // Synapses: links between documents, discovered from their text
    docs.forEach(function (d) {
      loadDoc(d).then(function (md) {
        if (!NW || NW.docs !== docs) return;
        NW.text[d.id] = md;
        var re = /\]\(([^)\s#]+)(?:#[^)]*)?\)/g, m;
        while ((m = re.exec(md))) {
          if (/^(https?:|mailto:)/.test(m[1])) continue;
          var p = resolvePath(d.path, m[1]), t = docs.filter(function (x) { return x.path === p; })[0];
          if (!t || t.id === d.id) continue;
          var a = NW.byId[d.id], b = NW.byId[t.id];
          if (!NW.edges.some(function (e) { return (e.a === a && e.b === b) || (e.a === b && e.b === a); })) NW.edges.push({ a: a, b: b, kind: "syn", born: performance.now() });
        }
      }, function () { /* a missing document just has no synapses */ });
    });
  }

  function nwCanvas() {
    var c = $("#nwCanvas"), g = $("#nwGraph");
    NW.ctx = c.getContext("2d");
    function size() {
      if (!NW) return;
      var r = g.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
      NW.w = r.width; NW.h = r.height; NW.dpr = dpr; NW.k = Math.max(0.5, Math.min(1.35, Math.min(r.width, r.height) / 720));
      // The canvas is sized by CSS (it fills the graph box), so only its pixel buffer changes here.
      // Setting its CSS size from inside the observer would feed back into layout (ResizeObserver loop).
      var w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
      if (c.width !== w) c.width = w;
      if (c.height !== h) c.height = h;
    }
    size();
    var queued = 0;
    function later() { if (queued) return; queued = requestAnimationFrame(function () { queued = 0; size(); }); }
    if (window.ResizeObserver) { NW.ro = new ResizeObserver(later); NW.ro.observe(g); } else window.addEventListener("resize", later);
    function at(e) { var r = c.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    function pick(p) {
      var best = null, bd = 1e9;
      NW.nodes.forEach(function (n) {
        if (!n.on) return;
        var d = Math.hypot(n.x - p.x, n.y - p.y);
        if (d < n.r * (NW.k || 1) * Math.max(1, n.s) + 6 && d < bd) { best = n; bd = d; }
      });
      return best;
    }
    c.addEventListener("pointermove", function (e) {
      var p = at(e);
      if (NW.drag) {
        var n = NW.drag.n; if (Math.hypot(p.x - NW.drag.x, p.y - NW.drag.y) > 4) NW.drag.moved = true;
        n.x = p.x; n.y = p.y; n.vx = n.vy = 0; return;
      }
      var h = pick(p);
      if (h !== NW.hover) { NW.hover = h; if (h && h.kind === "doc") blip("move"); }
      c.style.cursor = h ? "pointer" : "default";
      nwTip(h);
    });
    c.addEventListener("pointerleave", function () { if (!NW.drag) { NW.hover = null; nwTip(null); } });
    c.addEventListener("pointerdown", function (e) {
      var n = pick(at(e)); if (!n) return;
      NW.drag = { n: n, x: at(e).x, y: at(e).y, moved: false }; c.setPointerCapture(e.pointerId);
    });
    c.addEventListener("pointerup", function () {
      var d = NW.drag; NW.drag = null;
      if (!d || d.moved) return;
      if (d.n.kind === "doc") nwOpen(d.n.id);
      else if (d.n.kind === "hub") { NW.iso = NW.iso === d.n.group ? null : d.n.group; $$("#nwLegend .nw-chip").forEach(function (x) { x.classList.toggle("on", x.dataset.g === NW.iso); }); }
      else nwOpen((NW.docs.filter(function (x) { return x.path === "README.md"; })[0] || NW.docs[0]).id);
    });
  }

  function nwTip(n) {
    var tip = $("#nwTip");
    if (!tip) return;
    if (n === NW.tipN) return;
    NW.tipN = n;
    if (!n || n.kind === "core") { tip.classList.remove("on"); return; }
    var fresh = !tip.classList.contains("on");
    tip.style.setProperty("--c", nwColor(n.group));
    tip.innerHTML = n.kind === "hub"
      ? "<b>" + esc(n.label) + "</b><span>" + plural(NW.nodes.filter(function (x) { return x.group === n.group && x.kind === "doc"; }).length, "document") + " · click to focus</span>"
      : "<b>" + esc(n.label) + "</b><span>" + esc(n.group) + " · click to open</span>";
    if (fresh) { NW.tx = null; nwTipMove(true); }
    tip.classList.add("on");
  }
  // The tip glides after its neuron instead of jumping
  function nwTipMove(snap) {
    var tip = $("#nwTip"), n = NW.tipN;
    if (!tip || !n || n.kind === "core") return;
    var w = tip.offsetWidth || 220, r = n.r * (NW.k || 1) * n.s;
    var right = n.x + r + 18 + w < NW.w - 8;
    var x = right ? n.x + r + 18 : n.x - r - 18 - w, y = Math.max(8, Math.min(NW.h - 60, n.y - 24));
    if (snap || NW.tx == null || !opts.motion) { NW.tx = x; NW.ty = y; }
    else { NW.tx += (x - NW.tx) * 0.18; NW.ty += (y - NW.ty) * 0.18; }
    tip.style.transform = "translate(" + NW.tx.toFixed(1) + "px," + NW.ty.toFixed(1) + "px)";
    NW.tipBox = { x: NW.tx, y: NW.ty, w: w, h: tip.offsetHeight || 44 };
  }

  function nwBuild() {
    var n = NW.nodes.length, cx = NW.w / 2, cy = NW.h / 2;
    NW.t0 = performance.now(); NW.ready = false; NW.pulses = [];
    NW.nodes.forEach(function (nd, i) {
      nd.on = false; nd.s = 0; nd.vx = nd.vy = 0;
      if (nd.kind === "core") { nd.x = cx; nd.y = cy; }
      else if (nd.kind === "hub") { var a = (NW.groups.indexOf(nd.group) / NW.groups.length) * Math.PI * 2 - Math.PI / 2; nd.ax = a; nd.x = cx + Math.cos(a) * 30; nd.y = cy + Math.sin(a) * 30; }
      nd.spawn = opts.motion ? (i / Math.max(1, n - 1)) * (NW_BUILD_MS - 450) : 0;
    });
    if (!opts.motion) { NW.nodes.forEach(function (nd) { nwSpawn(nd); nd.s = 1; }); for (var k = 0; k < 400; k++) nwStep(); NW.ready = true; }
    cancelAnimationFrame(NW.raf);
    NW.raf = requestAnimationFrame(nwFrame);
  }
  function nwSpawn(nd) {
    nd.on = true; nd.born = performance.now();
    if (nd.kind === "doc") { var p = nd.parent; nd.x = p.x + (Math.random() - 0.5) * 30; nd.y = p.y + (Math.random() - 0.5) * 30; }
  }

  function nwStep() {
    var N = NW.nodes, K = NW.k || 1, cx = NW.w / 2, cy = NW.h / 2, R = Math.min(NW.w, NW.h) * 0.36, i, j;
    for (i = 0; i < N.length; i++) {
      var a = N[i]; if (!a.on) continue;
      for (j = i + 1; j < N.length; j++) {
        var b = N[j]; if (!b.on) continue;
        var dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy + 0.01, d = Math.sqrt(d2);
        var gap = ((a.kind === "doc" && b.kind === "doc") ? 14 : 24) * K, min = (a.r + b.r) * K + gap;
        var f = 0;
        if (d < min) f = (min - d) * 0.25;                       // collision: keep space
        else if (d < 260 * K) f = 520 * K * K / d2;               // soft repulsion
        if (f) { var ux = dx / d, uy = dy / d; a.vx -= ux * f; a.vy -= uy * f; b.vx += ux * f; b.vy += uy * f; }
      }
    }
    NW.edges.forEach(function (e) {
      var a = e.a, b = e.b; if (!a.on || !b.on) return;
      var dx = b.x - a.x, dy = b.y - a.y, d = Math.sqrt(dx * dx + dy * dy) + 0.01;
      var L = e.kind === "trunk" ? R : e.kind === "branch" ? (58 + Math.sqrt(a.kids || 1) * 15) * K : 150 * K;
      var k = e.kind === "syn" ? 0.0016 : 0.03, f = (d - L) * k, ux = dx / d, uy = dy / d;
      if (a.kind !== "core") { a.vx += ux * f; a.vy += uy * f; }
      b.vx -= ux * f; b.vy -= uy * f;
    });
    N.forEach(function (n) {
      if (!n.on) return;
      if (n.kind === "core") { n.x += (cx - n.x) * 0.2; n.y += (cy - n.y) * 0.2; n.vx = n.vy = 0; return; }
      if (n.kind === "hub") { n.vx += (cx + Math.cos(n.ax) * R - n.x) * 0.012; n.vy += (cy + Math.sin(n.ax) * R - n.y) * 0.012; }
      n.vx += (cx - n.x) * 0.0009; n.vy += (cy - n.y) * 0.0009;
      if (NW.drag && NW.drag.n === n) return;
      n.vx *= 0.8; n.vy *= 0.8;
      var sp = Math.hypot(n.vx, n.vy); if (sp > 14) { n.vx *= 14 / sp; n.vy *= 14 / sp; }
      n.x += n.vx; n.y += n.vy;
      var rr = n.r * K + 4; n.x = Math.max(rr, Math.min(NW.w - rr, n.x)); n.y = Math.max(rr, Math.min(NW.h - rr, n.y));
    });
  }

  function nwFrame(now) {
    if (!NW || currentView !== "docs" || !$("#nwCanvas")) { if (NW && NW.ro) NW.ro.disconnect(); NW = null; return; }
    var el = now - NW.t0;
    NW.nodes.forEach(function (n) { if (!n.on && el >= n.spawn) nwSpawn(n); });
    if (!NW.ready && el >= NW_BUILD_MS) { NW.ready = true; $("#nwHint") && $("#nwHint").classList.add("done"); }
    nwStep();
    // Neuron scale: grow in on spawn, bump forward by 10% on hover
    NW.nodes.forEach(function (n) {
      if (!n.on) return;
      var target = n === NW.hover ? 1.1 : 1;
      if (!opts.motion) { n.s = target; return; }
      var age = (now - n.born) / 300;
      n.s = age < 1 ? (function (t) { var c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); })(age) * target : n.s + (target - n.s) * 0.1;
    });
    if (opts.motion && NW.ready && Math.random() < 0.18) {
      var live = NW.edges.filter(function (e) { return e.a.on && e.b.on; });
      if (live.length) NW.pulses.push({ e: live[Math.floor(Math.random() * live.length)], t: 0, rev: Math.random() < 0.5 });
    }
    nwDraw(now);
    nwTipMove(false);
    NW.raf = requestAnimationFrame(nwFrame);
  }

  function nwRelated(n) {
    if (!n) return null;
    var set = {}; set[n.id] = 1;
    NW.edges.forEach(function (e) { if (e.a === n) set[e.b.id] = 1; if (e.b === n) set[e.a.id] = 1; });
    return set;
  }
  function nwDraw(now) {
    var c = NW.ctx, dpr = NW.dpr, rel = nwRelated(NW.hover), q = NW.q, iso = NW.iso, ease = opts.motion ? 0.12 : 1;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, NW.w, NW.h);
    function lit(n) {
      if (rel) return !!rel[n.id];
      if (iso) return n.group === iso || n.kind === "core";
      if (q) return n.kind !== "doc" || n.label.toLowerCase().indexOf(q) > -1 || n.group.toLowerCase().indexOf(q) > -1;
      return true;
    }
    // Everything fades towards its state instead of switching: n.a is how lit a neuron is, NW.focus how strong the hover is
    NW.focus = (NW.focus || 0) + ((rel ? 1 : 0) - (NW.focus || 0)) * ease;
    NW.nodes.forEach(function (n) { var t = lit(n) ? 1 : 0; n.a = n.a == null ? t : n.a + (t - n.a) * ease; });
    function curve(e) {
      var a = e.a, b = e.b, mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, dx = b.x - a.x, dy = b.y - a.y, k = e.kind === "syn" ? 0.18 : 0.06;
      return { x: mx - dy * k, y: my + dx * k };
    }
    function mix(a, b, t) { return a + (b - a) * t; }
    // Synapses
    NW.edges.forEach(function (e) {
      if (!e.a.on || !e.b.on) return;
      var on = Math.min(e.a.a, e.b.a), f = NW.focus, col = nwColor(e.b.group || e.a.group), grow = Math.min(1, (now - Math.max(e.b.born || 0, e.born || 0)) / 260);
      if (!opts.motion) grow = 1;
      var ctl = curve(e), ex = e.a.x + (e.b.x - e.a.x) * grow, ey = e.a.y + (e.b.y - e.a.y) * grow;
      c.beginPath(); c.moveTo(e.a.x, e.a.y); c.quadraticCurveTo(e.a.x + (ctl.x - e.a.x) * grow, e.a.y + (ctl.y - e.a.y) * grow, ex, ey);
      c.strokeStyle = e.kind === "syn" ? rgba(col, mix(0.04, mix(0.16, 0.55, f), on)) : rgba(col, mix(0.07, mix(0.42, 0.85, f), on));
      c.lineWidth = e.kind === "trunk" ? 1.6 : e.kind === "branch" ? 1.1 : 0.8;
      if (e.kind === "syn") c.setLineDash([2, 4]); else c.setLineDash([]);
      c.stroke();
    });
    c.setLineDash([]);
    // Signals travelling along synapses
    NW.pulses = NW.pulses.filter(function (p) {
      p.t += 0.018; if (p.t >= 1) return false;
      var e = p.e, t = p.rev ? 1 - p.t : p.t, ctl = curve(e), u = 1 - t;
      var x = u * u * e.a.x + 2 * u * t * ctl.x + t * t * e.b.x, y = u * u * e.a.y + 2 * u * t * ctl.y + t * t * e.b.y;
      var col = nwColor(e.b.group || e.a.group), on = Math.min(e.a.a, e.b.a);
      c.beginPath(); c.arc(x, y, 1.8, 0, Math.PI * 2); c.fillStyle = rgba(col, mix(0.2, 0.95, on));
      c.shadowColor = col; c.shadowBlur = on > 0.5 ? 10 : 0; c.fill(); c.shadowBlur = 0;
      return true;
    });
    // Neurons, drawn back to front so the hovered one sits on top
    NW.nodes.slice().sort(function (a, b) { return (a === NW.hover) - (b === NW.hover); }).forEach(function (n) {
      if (!n.on || n.s <= 0.01) return;
      var col = n.kind === "core" ? "#ffffff" : nwColor(n.group), r = n.r * (NW.k || 1) * n.s, hov = n === NW.hover;
      c.globalAlpha = mix(0.22, 1, n.a);
      if (hov) { c.beginPath(); c.arc(n.x + 3, n.y + 6, r * 1.05, 0, Math.PI * 2); c.fillStyle = "rgba(0,0,0,.45)"; c.shadowColor = "rgba(0,0,0,.6)"; c.shadowBlur = 16; c.fill(); }
      var g = c.createRadialGradient(n.x - r * 0.35, n.y - r * 0.35, r * 0.1, n.x, n.y, r);
      g.addColorStop(0, rgba(col, 0.95)); g.addColorStop(0.6, rgba(col, n.kind === "doc" ? 0.55 : 0.35)); g.addColorStop(1, rgba(col, 0.12));
      c.beginPath(); c.arc(n.x, n.y, r, 0, Math.PI * 2); c.fillStyle = g;
      c.shadowColor = col; c.shadowBlur = hov ? 26 : n.kind === "doc" ? 8 : 16; c.fill(); c.shadowBlur = 0;
      c.lineWidth = hov ? 1.6 : 1; c.strokeStyle = rgba(col, hov ? 1 : 0.8); c.stroke();
      if (n.kind !== "doc") {
        var rot = opts.motion ? now / (n.kind === "core" ? 5200 : 3600) : 0;
        c.beginPath(); c.arc(n.x, n.y, r + 6, rot, rot + Math.PI * 1.4); c.strokeStyle = rgba(col, 0.55); c.lineWidth = 1; c.stroke();
        if (n.kind === "core") { c.beginPath(); c.arc(n.x, n.y, r + 12, -rot, -rot + Math.PI * 0.8); c.strokeStyle = rgba("#c9a24a", 0.6); c.stroke(); }
        c.font = (n.kind === "core" ? "500 13px " : "400 12.5px ") + "'Share Tech Mono', monospace";
        c.textAlign = "center"; c.textBaseline = "alphabetic"; c.fillStyle = rgba(n.kind === "core" ? "#ffffff" : col, 0.95);
        c.fillText(n.label.toUpperCase().split("").join(String.fromCharCode(8202)), n.x, n.y + r + (n.kind === "core" ? 28 : 20));
      }
      c.globalAlpha = 1;
    });
    nwLabels(c, rel, ease);
  }

  // Labels for the neighbours of the hovered neuron. Each label sits on the far side of its neuron,
  // is only shown where it does not overlap another label, a hub name or the tip, and fades in and out.
  function nwLabels(c, rel, ease) {
    var taken = [], h = NW.hover, K = NW.k || 1;
    if (NW.tipBox && NW.tipN) taken.push(NW.tipBox);
    NW.nodes.forEach(function (n) {
      if (n.on && n.kind !== "doc") { var r = n.r * K * n.s; taken.push({ x: n.x - 70, y: n.y - r - 4, w: 140, h: r * 2 + 34 }); }
    });
    c.font = "400 13.5px 'Barlow Semi Condensed', sans-serif"; c.textBaseline = "middle";
    var cand = NW.nodes.filter(function (n) { return n.on && n.kind === "doc" && rel && rel[n.id] && n !== h; });
    // Labels already showing keep their place first, so nothing flickers while the web moves
    cand.sort(function (a, b) { return (b.la || 0) - (a.la || 0) || Math.hypot(a.x - h.x, a.y - h.y) - Math.hypot(b.x - h.x, b.y - h.y); });
    var show = {};
    cand.forEach(function (n) {
      var txt = n.label.length > 30 ? n.label.slice(0, 29) + "…" : n.label, w = c.measureText(txt).width + 12, r = n.r * K * n.s;
      var dx = n.x - h.x, dy = n.y - h.y, d = Math.hypot(dx, dy) || 1, right = dx >= 0;
      var ax = n.x + (dx / d) * (r + 6), ay = n.y + (dy / d) * (r + 6);
      var box = { x: right ? ax : ax - w, y: ay - 10, w: w, h: 20 };
      if (box.x < 4 || box.x + w > NW.w - 4 || box.y < 4 || box.y + 20 > NW.h - 4) return;
      if (taken.some(function (t) { return box.x < t.x + t.w && box.x + box.w > t.x && box.y < t.y + t.h && box.y + box.h > t.y; })) return;
      taken.push(box); show[n.id] = 1; n.lbox = box; n.ltxt = txt;
    });
    NW.nodes.forEach(function (n) {
      if (n.kind !== "doc") return;
      var t = show[n.id] ? 1 : 0; n.la = (n.la || 0) + (t - (n.la || 0)) * ease;
      if (n.la < 0.02 || !n.lbox) return;
      var b = n.lbox, col = nwColor(n.group);
      c.globalAlpha = n.la;
      c.fillStyle = "rgba(7,10,11,.82)"; c.fillRect(b.x, b.y, b.w, b.h);
      c.fillStyle = col; c.fillRect(b.x, b.y, 2, b.h);
      c.fillStyle = "rgba(233,237,238,.92)"; c.textAlign = "left"; c.fillText(n.ltxt, b.x + 7, b.y + b.h / 2 + 0.5);
      c.globalAlpha = 1;
    });
    c.textBaseline = "alphabetic";
  }

  /* ---- Document windows: stack, minimize to dock, restore ---- */
  function nwDoc(id) { return NW.docs.filter(function (d) { return d.id === id; })[0]; }
  function nwOpen(id) {
    if (!NW) return;
    var d = nwDoc(id); if (!d) return;
    var mi = NW.min.indexOf(id);
    if (mi > -1) { nwRestore(id); return; }
    var oi = NW.open.indexOf(id);
    if (oi > -1) NW.open.splice(oi, 1);
    else if (NW.open.length + NW.min.length >= NW_MAX_DOCS) {
      var drop = NW.min.length ? NW.min.shift() : NW.open.shift();
      status(nwDoc(drop).title + " closed · up to " + NW_MAX_DOCS + " documents");
    }
    NW.open.push(id);
    blip("go");
    nwRender(id);
  }
  function nwContent(d) {
    if (NW.html[d.id]) return Promise.resolve(NW.html[d.id]);
    return loadDoc(d).then(function (md) { NW.text[d.id] = md; return (NW.html[d.id] = markdown(md, d.path)); });
  }
  function nwRender(animateId) {
    var stage = $("#nwStage"), wrap = $("#nw");
    if (!stage) return;
    wrap.classList.toggle("reading", NW.open.length > 0);
    if (wrap.parentNode) wrap.parentNode.classList.toggle("reading", NW.open.length > 0);
    var focus = NW.open[NW.open.length - 1];
    stage.innerHTML = NW.open.map(function (id) {
      var d = nwDoc(id), col = nwColor(d.group), f = id === focus;
      return '<section class="dwin' + (f ? " focus" : "") + (f && id === animateId ? " enter" : "") + '" data-id="' + esc(id) + '" style="--c:' + col + '">' +
        '<header class="dwin-h"' + (f ? "" : ' tabindex="0" role="button" aria-label="Bring ' + esc(d.title) + ' to front"') + '><i class="dot"></i><b>' + esc(d.title) + "</b><span>" + esc(d.group) + "</span>" +
        '<button class="wb" data-act="min" aria-label="Minimize ' + esc(d.title) + '">–</button><button class="wb" data-act="close" aria-label="Close ' + esc(d.title) + '">×</button></header>' +
        (f ? '<div class="dwin-b"><article class="doc a4" id="nwBody">' + loading("Opening " + d.title) + "</article></div>" +
          '<footer class="dwin-f"><span>' + esc(d.path) + '</span><button class="lnk nw-classic">Classic view</button><a href="' + esc(repoUrl("/blob/" + cfg.branch + "/" + d.path)) + '" target="_blank" rel="noopener noreferrer">View on GitHub</a></footer>' : "") +
        "</section>";
    }).join("");
    $$("#nwStage .nw-classic").forEach(function (b) { b.addEventListener("click", function () { $("#nwClassic").click(); }); });
    $$("#nwStage .dwin").forEach(function (w) {
      var id = w.dataset.id;
      w.querySelector('[data-act="min"]').addEventListener("click", function (e) { e.stopPropagation(); nwMinimize(id); });
      w.querySelector('[data-act="close"]').addEventListener("click", function (e) { e.stopPropagation(); nwClose(id); });
      if (!w.classList.contains("focus")) {
        var h = w.querySelector(".dwin-h");
        h.addEventListener("click", function () { nwOpen(id); });
        h.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); nwOpen(id); } });
      }
    });
    if (focus) {
      var d = nwDoc(focus);
      nwContent(d).then(function (html) {
        var b = $("#nwBody"); if (!b || !NW || NW.open[NW.open.length - 1] !== focus) return;
        b.innerHTML = html;
        $$("a[href^='#/docs/']", b).forEach(function (a) {
          a.addEventListener("click", function (e) { e.preventDefault(); nwOpen(a.getAttribute("href").slice(7)); });
        });
        led($("#ledInfo"), d.title);
      }, function () { var b = $("#nwBody"); if (b) b.innerHTML = '<div class="empty">Could not load this document<small>Open it on GitHub instead.</small></div>'; });
    }
    nwDock();
  }
  function nwFly(fromEl, toEl, done) {
    if (!opts.motion || !fromEl || !toEl || !fromEl.animate) { done(); return; }
    var a = fromEl.getBoundingClientRect(), b = toEl.getBoundingClientRect();
    var g = document.createElement("div"); g.className = "nw-ghost";
    g.style.cssText = "left:" + a.left + "px;top:" + a.top + "px;width:" + a.width + "px;height:" + a.height + "px";
    g.style.setProperty("--c", getComputedStyle(fromEl).getPropertyValue("--c") || "#c9a24a");
    document.body.appendChild(g);
    var sx = b.width / a.width, sy = b.height / a.height, tx = b.left - a.left, ty = b.top - a.top;
    g.animate([{ transform: "none", opacity: 1 }, { transform: "translate(" + tx + "px," + ty + "px) scale(" + sx + "," + sy + ")", opacity: 0.6 }],
      { duration: 340, easing: "cubic-bezier(.2,.8,.2,1)" }).onfinish = function () { g.remove(); done(); };
  }
  function nwMinimize(id) {
    var w = $('#nwStage .dwin[data-id="' + id + '"]');
    NW.open.splice(NW.open.indexOf(id), 1);
    NW.min.push(id);
    nwDock();
    var tab = $('#nwDock .dtab[data-id="' + id + '"]');
    if (tab) tab.style.visibility = "hidden";
    nwFly(w, tab, function () { if (tab) tab.style.visibility = ""; nwRender(); });
  }
  function nwRestore(id) {
    var tab = $('#nwDock .dtab[data-id="' + id + '"]');
    NW.min.splice(NW.min.indexOf(id), 1);
    NW.open.push(id);
    $("#nw").classList.add("reading"); $("#nw").parentNode.classList.add("reading");
    nwFly(tab, $("#nwStage"), function () { nwRender(id); });
    if (tab) tab.remove();
  }
  function nwClose(id) {
    var i = NW.open.indexOf(id); if (i > -1) NW.open.splice(i, 1);
    if (!NW.open.length && !NW.min.length) {
      // Interface closed: reset and rebuild the web from the first neuron
      nwRender();
      NW.hover = null; NW.iso = null; $$("#nwLegend .nw-chip").forEach(function (x) { x.classList.remove("on"); });
      setTimeout(function () { if (NW && $("#nw")) { $("#nwHint") && $("#nwHint").classList.remove("done"); nwBuild(); } }, opts.motion ? 420 : 0);
      led($("#ledInfo"), "Docs");
      return;
    }
    nwRender();
  }
  function nwDock() {
    var dock = $("#nwDock"); if (!dock) return;
    dock.classList.toggle("on", NW.min.length > 0);
    $("#nw").classList.toggle("docked", NW.min.length > 0);
    dock.innerHTML = NW.min.map(function (id) {
      var d = nwDoc(id), txt = (NW.text[id] || "").replace(/^(#|Code:|Status:|Author:).*$/gm, "").replace(/[#>*`|_\[\]()-]/g, " ").replace(/\s+/g, " ").trim().slice(0, 420);
      return '<button class="dtab" data-id="' + esc(id) + '" style="--c:' + nwColor(d.group) + '" aria-label="Restore ' + esc(d.title) + '">' +
        '<span class="pv" aria-hidden="true"><b>' + esc(d.title) + "</b><i>" + esc(d.group) + "</i><span>" + esc(txt) + "</span></span>" +
        '<i class="dot"></i><span class="tt">' + esc(d.title) + "</span></button>";
    }).join("");
    $$("#nwDock .dtab").forEach(function (t) { t.addEventListener("click", function () { nwRestore(t.dataset.id); }); });
  }

  /* Options */
  var OPT_PRESETS = {
    full: ["Full effects", "Everything on, as designed", { glitch: true, grid: true, motion: true, ledFx: true, emblem: true }],
    calm: ["Calm", "No glitch or flicker, gentle motion", { glitch: false, grid: true, motion: true, ledFx: false, emblem: true }],
    light: ["Performance", "Static and light, for older or slower computers", { glitch: false, grid: false, motion: false, ledFx: false, emblem: false }]
  };
  function presetNow() {
    var hit = "";
    Object.keys(OPT_PRESETS).forEach(function (k) {
      var p = OPT_PRESETS[k][2], same = Object.keys(p).every(function (o) { return !!opts[o] === p[o]; });
      if (same && !hit) hit = k;
    });
    return hit;
  }
  function viewOptions() {
    var v = $("#view");
    function sw(k, label, sub) {
      return '<div class="orow"><span>' + label + "<small>" + sub + '</small></span><button class="sw" role="switch" data-opt="' + k + '" aria-checked="' + !!opts[k] + '" aria-label="' + label + '"></button></div>';
    }
    function seg(id, cur, list, label) {
      return '<div class="seg" role="radiogroup" aria-label="' + label + '" id="' + id + '">' + list.map(function (s) {
        return '<button role="radio" data-v="' + s[0] + '" aria-checked="' + (cur === s[0]) + '">' + s[1] + "</button>";
      }).join("") + "</div>";
    }
    var pre = presetNow();
    v.innerHTML = shell("Settings", "Options",
      '<div class="presets">' + Object.keys(OPT_PRESETS).map(function (k) {
        var p = OPT_PRESETS[k];
        return '<button class="preset' + (pre === k ? " on" : "") + '" data-preset="' + k + '"><b>' + p[0] + "</b><small>" + p[1] + "</small></button>";
      }).join("") + "</div>" +
      '<div class="opt">' +
        '<section class="ogroup"><div class="label">Look</div>' +
          sw("glitch", "Glitch effect", "A light distortion every 5 to 20 seconds") +
          sw("grid", "Background grid", "The tactical grid behind every page") +
          sw("emblem", "Background artwork", "The faint saluting operatives behind every page") +
          sw("ledFx", "LED glow", "Glowing, letter-by-letter status lines") +
          sw("contrast", "High contrast", "Brighter secondary text and lines") +
        "</section>" +
        '<section class="ogroup"><div class="label">Motion and sound</div>' +
          sw("motion", "Animations", "Turn off for a static interface. Off by default if your system asks for reduced motion") +
          sw("sound", "Interface sounds", "Short, quiet tones when selecting and opening sections") +
          '<div class="label">Reading</div>' +
          '<div class="orow"><span>Text size<small>Applies to the whole site</small></span>' + seg("osz", opts.size, [["1", "Normal"], ["1.1", "Large"], ["1.2", "Larger"]], "Text size") + "</div>" +
          '<div class="orow"><span>Docs view<small>How the Docs section opens</small></span>' + seg("odm", docsMode(), [["neural", "Neural web"], ["classic", "Classic list"]], "Docs view") + "</div>" +
        "</section>" +
        '<section class="ogroup"><div class="label">Data</div>' +
          '<div class="orow"><span>GitHub data<small>Releases and contracts are cached for ' + (cfg.cacheMinutes || 10) + ' minutes</small></span><button class="btn small" id="oclr">Refresh now</button></div>' +
          '<div class="orow"><span>Site build<small>' + esc(buildLabel()) + " · " + esc(cfg.stage) + (data.build && data.build.date ? " · " + esc(fmtDate(data.build.date)) : "") + "</small></span><a class=\"btn small\" href=\"#/devlog\">Dev log</a></div>" +
          '<div class="orow"><span>Privacy<small>No cookies, analytics or trackers. Settings stay in this browser</small></span><a class="btn small" href="#/docs/privacy">Read</a></div>' +
          '<div class="orow"><span>Restore defaults<small>Resets every setting on this page</small></span><button class="btn small" id="orst">Reset</button></div>' +
        "</section>" +
      "</div>");
    function changed(msg) { store.set(OPT_KEY, opts); applyOpts(); status(msg); var p = presetNow(); $$("[data-preset]").forEach(function (b) { b.classList.toggle("on", b.dataset.preset === p); }); }
    $$("[data-opt]").forEach(function (b) {
      b.addEventListener("click", function () {
        var k = b.dataset.opt; opts[k] = !opts[k];
        b.setAttribute("aria-checked", String(!!opts[k])); changed(b.getAttribute("aria-label") + (opts[k] ? " on" : " off"));
      });
    });
    $$("[data-preset]").forEach(function (b) {
      b.addEventListener("click", function () {
        var p = OPT_PRESETS[b.dataset.preset];
        Object.keys(p[2]).forEach(function (k) { opts[k] = p[2][k]; });
        $$("[data-opt]").forEach(function (s) { s.setAttribute("aria-checked", String(!!opts[s.dataset.opt])); });
        changed(p[0] + " preset applied");
      });
    });
    function segBind(id, fn) {
      $$("#" + id + " button").forEach(function (b) {
        b.addEventListener("click", function () { $$("#" + id + " button").forEach(function (x) { x.setAttribute("aria-checked", String(x === b)); }); fn(b.dataset.v); });
      });
    }
    segBind("osz", function (val) { opts.size = val; changed("Text size changed"); });
    segBind("odm", function (val) { setDocsMode(val); status("Docs open in " + (val === "classic" ? "the classic list" : "the neural web")); });
    $("#oclr").addEventListener("click", function () { JO.refresh(); status("GitHub data cleared · reloading"); });
    $("#orst").addEventListener("click", function () { opts = Object.assign({}, DEFAULT_OPTS); store.set(OPT_KEY, opts); applyOpts(); setDocsMode("neural"); viewOptions(); status("Settings reset"); });
  }

  /* Team */
  function viewTeam() {
    var v = $("#view");
    v.innerHTML = shell("Hound Protocol", "Team", loading("Loading team"));
    loadLocal("team").then(function (t) {
      if (currentView !== "team") return;
      t = t || { members: [], seats: [], roles: [], departments: [] };
      var still = !opts.motion;
      $("#vb").innerHTML = '<div class="bf">' +
        '<section class="bf-sec team-brand"><div class="tb-mark">' + BRAND.hpColor + '</div><div><div class="tb-name">Hound Protocol</div><p>A community development team, organized like Mother Base. We build <b>Joint Operations</b> in the open.</p></div><div class="tb-mark jo"><img src="assets/brand/joint-operations-emblem.svg" alt="Joint Operations emblem"></div></section>' +
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

  /* Guides: the handbook (guides, policies, procedures) as A4 documents */
  var GUIDE_AUD = ["All", "Players", "Contributors", "Quality", "Administration"];
  var guideAud = "All";
  function viewGuides(id) {
    var v = $("#view");
    v.innerHTML = shell("Handbook", "Guides", loading("Loading the handbook"));
    Promise.all([loadLocal("guides"), loadLocal("docs")]).then(function (res) {
      if (currentView !== "guides") return;
      var list = (res[0] && res[0].guides) || [];
      if (id) return drawGuide(list, id);
      drawGuideList(list);
    });
  }
  function drawGuideList(list) {
    var shown = list.filter(function (g) { return guideAud === "All" || g.audience === guideAud; });
    var byType = { Guide: [], Policy: [], Procedure: [] };
    shown.forEach(function (g) { (byType[g.type] = byType[g.type] || []).push(g); });
    var section = function (type, label, note) {
      var l = byType[type] || [];
      if (!l.length) return "";
      return '<div class="label">' + label + '</div><p class="sub">' + note + '</p><div class="sheets">' + l.map(function (g, n) {
        return '<a class="mini t-' + esc(g.type.toLowerCase()) + '" style="--i:' + n + '" href="#/guides/' + esc(g.id) + '"><span class="m-top"><b>' + esc(g.code) + "</b><i>v" + esc(g.version) + "</i></span>" +
          '<span class="m-title">' + esc(g.title) + '</span><span class="m-sum">' + esc(g.summary) + "</span>" +
          '<span class="m-foot">' + esc(g.type) + " · " + esc(g.owner) + " Dept</span></a>";
      }).join("") + "</div>";
    };
    $("#vb").innerHTML =
      '<p class="sub">Everything you need to play, contribute, test and run Hound Protocol, written down. Every document is versioned, owned by a department and printable on A4.</p>' +
      '<div class="tabs" role="tablist">' + GUIDE_AUD.map(function (a) { return '<button role="tab" data-aud="' + a + '" aria-selected="' + (guideAud === a) + '">' + a + "</button>"; }).join("") + "</div>" +
      section("Guide", "Guides", "How-to help for each audience.") +
      section("Policy", "Policies", "Rules everyone follows.") +
      section("Procedure", "Standard operating procedures", "Step by step, the same way every time.") +
      (shown.length ? "" : '<div class="empty">No documents for this audience yet</div>') +
      '<p class="source">Source: docs/guides/ · index generated by tools/guides_index.py</p>';
    $$("[data-aud]").forEach(function (b) { b.addEventListener("click", function () { guideAud = b.dataset.aud; drawGuideList(list); }); });
  }
  function drawGuide(list, id) {
    var g = list.filter(function (x) { return x.id === id; })[0];
    if (!g) { $("#vb").innerHTML = '<div class="empty">No document ' + esc(id) + '<small><a href="#/guides">Back to the handbook</a></small></div>'; return; }
    $("#vb").innerHTML = loading("Opening " + g.code);
    loadDoc({ path: g.path }).then(function (src) {
      if (currentView !== "guides") return;
      // The sheet header carries the title and metadata, so drop them from the body
      var body = src.replace(/^# .*\n/, "").replace(/^Code: .*\n/, "");
      var html = markdown(body, g.path).replace(/href="#\/docs\/(hp-(?:pol|sop|gde)-\d{3})"/g, 'href="#/guides/$1"');
      var url = (cfg.siteUrl || "https://hound-protocol.github.io/Joint-Operations/") + "#/guides/" + g.id;
      $("#vb").innerHTML =
        '<div class="toolbar sheet-bar"><a class="btn small" href="#/guides">All documents</a><a class="btn small primary" id="gpdf" href="guides/pdf/' + esc(g.code) + '.pdf" download hidden>Download PDF</a><button class="btn small" id="gprint">Print</button>' +
        '<a class="btn small" href="' + esc(repoUrl("/blob/" + cfg.branch + "/" + g.path)) + '" target="_blank" rel="noopener noreferrer">View on GitHub</a></div>' +
        '<article class="sheet t-' + esc(g.type.toLowerCase()) + '" aria-label="' + esc(g.code + " " + g.title) + '">' +
          '<header class="sh-head"><div class="sh-org"><img src="assets/img/emblem.svg" alt="" width="34" height="34"><span><b>Hound Protocol</b><i>MGSV: Joint Operations</i></span></div>' +
          '<div class="sh-code"><b>' + esc(g.code) + "</b><i>" + esc(g.type) + "</i></div></header>" +
          '<h1 class="sh-title">' + esc(g.title) + "</h1>" +
          '<dl class="sh-meta"><div><dt>Version</dt><dd>' + esc(g.version) + "</dd></div><div><dt>Effective</dt><dd>" + esc(g.effective) + "</dd></div>" +
          "<div><dt>Owner</dt><dd>" + esc(g.owner) + " Dept</dd></div><div><dt>For</dt><dd>" + esc(g.for) + "</dd></div><div><dt>Classification</dt><dd>Public</dd></div></dl>" +
          '<div class="sh-body">' + html + "</div>" +
          '<footer class="sh-foot"><span>' + esc(g.code) + " · v" + esc(g.version) + " · " + esc(g.effective) + '</span><span>Uncontrolled when printed. Current version: ' + esc(url) + "</span></footer>" +
        "</article>";
      $("#gprint").addEventListener("click", function () { printSheet(); });
      // The PDF exists on the deployed site (built by tools/guides_pdf.py); show the button only when it is there
      if (typeof fetch === "function") fetch("guides/pdf/" + encodeURIComponent(g.code) + ".pdf", { method: "HEAD" }).then(function (r) { var b = $("#gpdf"); if (b && r.ok) b.hidden = false; }, function () { /* offline or local copy */ });
      document.title = g.code + " " + g.title + " · " + cfg.project;
    }, function () {
      $("#vb").innerHTML = '<div class="empty">Could not load ' + esc(g.code) + '<small><a href="#/guides">Back to the handbook</a></small></div>';
    });
  }

  // Print with a fallback: some browsers (for example Flatpak browsers without a print portal) never open the dialog
  function printSheet() {
    var opened = false;
    function mark() { opened = true; }
    window.addEventListener("beforeprint", mark);
    try { window.focus(); window.print(); } catch (e) { /* handled below */ }
    setTimeout(function () {
      window.removeEventListener("beforeprint", mark);
      if (opened) return;
      var mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || "");
      status("No print dialog? Press " + (mac ? "Cmd+P" : "Ctrl+P") + ($("#gpdf") && !$("#gpdf").hidden ? ", or use Download PDF" : ""), true);
    }, 600);
  }

  /* ---------------- Router ---------------- */
  var VIEWS = { briefing: viewBriefing, roadmap: viewRoadmap, team: viewTeam, devlog: viewDevlog, download: viewDownload, sessions: viewSessions, contribute: viewContribute, verify: viewVerify, guides: viewGuides, mods: viewMods, docs: viewDocs, options: viewOptions };
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
    view.dataset.v = name;
    if (!same || name !== "docs") { view.innerHTML = ""; var ce = $("#center"); ce.style.scrollBehavior = "auto"; ce.scrollTop = 0; ce.style.scrollBehavior = ""; }
    var item = ITEMS.filter(function (i) { return i.id === name; })[0] || ({ verify: { title: "Verify" } })[name];
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
    docsGraph: function () { return NW ? { ready: NW.ready, open: NW.open.slice(), min: NW.min.slice(), nodes: NW.nodes.map(function (n) { return { id: n.id, kind: n.kind, x: n.x, y: n.y, on: n.on, s: n.s }; }) } : null; },
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
