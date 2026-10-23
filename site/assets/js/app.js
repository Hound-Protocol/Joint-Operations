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
 *   window.JO.docsView()         which Docs view is open and which file (used by tests)
 */
(function () {
  "use strict";

  /* ---------------- Utilities ---------------- */
  // Browsers too old for the app get the plain page from index.html instead
  if (window.JO_LEGACY) return;
  // Hide the interface until the first screen is ready (20b-ready.js); never longer than 3 s, even if something fails
  document.documentElement.classList.add("booting");
  setTimeout(function () { document.documentElement.classList.remove("booting"); }, 3000);
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
    // One retry after a short pause, for flaky connections
    function get() { return fetchJSON("data/" + name + ".json").then(function (v) { data[name] = v; return v; }); }
    return get().catch(function () { return new Promise(function (ok) { setTimeout(ok, 700); }).then(get); }).catch(function () { return null; });
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
    hpColor: '<svg class="bm" viewBox="0 0 200 200" aria-hidden="true"><polygon points="14.0,176.0 170.0,16.0 198.0,16.0 42.0,176.0" fill="#d0303a"/><g transform="translate(10 8) scale(0.9)"><polygon points="100.0,60.0 117.0,63.0 141.0,16.0 152.0,74.0 140.0,104.0 124.0,128.0 114.0,160.0 100.0,180.0 86.0,160.0 76.0,128.0 60.0,104.0 48.0,74.0 59.0,16.0 83.0,63.0" fill="#e9edee"/><polygon points="139.0,32.0 146.0,68.0 127.0,63.0" fill="#0b0e10"/><polygon points="109.0,93.0 129.0,85.0 121.0,97.0" fill="#d0303a"/><line x1="102" y1="72" x2="119" y2="84" stroke="#0b0e10" stroke-width="2.4" stroke-linecap="square"/><line x1="140" y1="104" x2="116" y2="118" stroke="#0b0e10" stroke-width="2.4" stroke-linecap="square"/><line x1="124" y1="128" x2="108" y2="134" stroke="#0b0e10" stroke-width="2" stroke-linecap="square"/><polygon points="61.0,32.0 54.0,68.0 73.0,63.0" fill="#0b0e10"/><polygon points="91.0,93.0 71.0,85.0 79.0,97.0" fill="#d0303a"/><line x1="98" y1="72" x2="81" y2="84" stroke="#0b0e10" stroke-width="2.4" stroke-linecap="square"/><line x1="60" y1="104" x2="84" y2="118" stroke="#0b0e10" stroke-width="2.4" stroke-linecap="square"/><line x1="76" y1="128" x2="92" y2="134" stroke="#0b0e10" stroke-width="2" stroke-linecap="square"/><line x1="100" y1="104" x2="100" y2="150" stroke="#0b0e10" stroke-width="2.2" stroke-linecap="square"/><polygon points="91.0,164.0 109.0,164.0 100.0,177.0" fill="#0b0e10"/></g></svg>',
    joColor: '<svg class="bm" viewBox="0 0 260 240" aria-hidden="true"><polygon points="30.0,20.0 230.0,20.0 230.0,150.0 130.0,226.0 30.0,150.0" fill="#e9edee"/><polygon points="40.0,30.0 220.0,30.0 220.0,146.0 130.0,214.0 40.0,146.0" fill="#0b0e10"/><polygon points="40.0,30.0 220.0,30.0 220.0,62.0 40.0,62.0" fill="#f28c28"/><path d="M43.290000000000006 51.112V49.162Q43.290000000000006 48.902 43.550000000000004 48.902H45.526Q45.786 48.902 45.786 49.162V51.138Q45.786 52.438 46.579 53.244Q47.372 54.05 48.646 54.05Q49.946000000000005 54.05 50.739000000000004 53.244Q51.532000000000004 52.438 51.532000000000004 51.138V38.06Q51.532000000000004 37.8 51.792 37.8H53.768Q54.028000000000006 37.8 54.028000000000006 38.06V51.112Q54.028000000000006 52.62 53.352000000000004 53.777Q52.676 54.934 51.454 55.571Q50.232 56.208 48.646 56.208Q46.228 56.208 44.759 54.804Q43.290000000000006 53.4 43.290000000000006 51.112Z M65.65 50.722V43.078Q65.65 41.466 66.352 40.218Q67.054 38.97 68.315 38.281Q69.576 37.592 71.24 37.592Q72.904 37.592 74.178 38.281Q75.452 38.97 76.154 40.218Q76.856 41.466 76.856 43.078V50.722Q76.856 52.36 76.154 53.608000000000004Q75.452 54.856 74.178 55.545Q72.904 56.234 71.24 56.234Q69.576 56.234 68.315 55.545Q67.054 54.856 66.352 53.608000000000004Q65.65 52.36 65.65 50.722ZM74.36 50.826V43.025999999999996Q74.36 41.57 73.50200000000001 40.66Q72.644 39.75 71.24 39.75Q69.862 39.75 69.00399999999999 40.66Q68.146 41.57 68.146 43.025999999999996V50.826Q68.146 52.256 69.00399999999999 53.153Q69.862 54.05 71.24 54.05Q72.644 54.05 73.50200000000001 53.166Q74.36 52.282 74.36 50.826Z M88.504 55.74V38.06Q88.504 37.8 88.76400000000001 37.8H90.74000000000001Q91.0 37.8 91.0 38.06V55.74Q91.0 56.0 90.74000000000001 56.0H88.76400000000001Q88.504 56.0 88.504 55.74Z M112.346 37.8H114.322Q114.58200000000001 37.8 114.58200000000001 38.06V55.74Q114.58200000000001 56.0 114.322 56.0H112.242Q112.00800000000001 56.0 111.93 55.818L105.664 43.208Q105.61200000000001 43.156 105.57300000000001 43.156Q105.534 43.156 105.534 43.234L105.56 55.74Q105.56 56.0 105.30000000000001 56.0H103.32400000000001Q103.06400000000001 56.0 103.06400000000001 55.74V38.06Q103.06400000000001 37.8 103.32400000000001 37.8H105.40400000000001Q105.638 37.8 105.71600000000001 37.982L111.956 50.592Q112.00800000000001 50.644 112.04700000000001 50.644Q112.08600000000001 50.644 112.08600000000001 50.566V38.06Q112.08600000000001 37.8 112.346 37.8Z M137.072 38.06V39.724000000000004Q137.072 39.984 136.812 39.984H132.626Q132.522 39.984 132.522 40.088V55.74Q132.522 56.0 132.262 56.0H130.286Q130.026 56.0 130.026 55.74V40.088Q130.026 39.984 129.922 39.984H125.918Q125.658 39.984 125.658 39.724000000000004V38.06Q125.658 37.8 125.918 37.8H136.812Q137.072 37.8 137.072 38.06Z  M161.22600000000003 50.722V43.078Q161.22600000000003 41.466 161.92800000000003 40.218Q162.63000000000002 38.97 163.89100000000002 38.281Q165.15200000000002 37.592 166.81600000000003 37.592Q168.48000000000002 37.592 169.75400000000002 38.281Q171.02800000000002 38.97 171.73000000000002 40.218Q172.43200000000002 41.466 172.43200000000002 43.078V50.722Q172.43200000000002 52.36 171.73000000000002 53.608000000000004Q171.02800000000002 54.856 169.75400000000002 55.545Q168.48000000000002 56.234 166.81600000000003 56.234Q165.15200000000002 56.234 163.89100000000002 55.545Q162.63000000000002 54.856 161.92800000000003 53.608000000000004Q161.22600000000003 52.36 161.22600000000003 50.722ZM169.936 50.826V43.025999999999996Q169.936 41.57 169.07800000000003 40.66Q168.22000000000003 39.75 166.81600000000003 39.75Q165.43800000000002 39.75 164.58 40.66Q163.722 41.57 163.722 43.025999999999996V50.826Q163.722 52.256 164.58 53.153Q165.43800000000002 54.05 166.81600000000003 54.05Q168.22000000000003 54.05 169.07800000000003 53.166Q169.936 52.282 169.936 50.826Z M194.97400000000002 43.025999999999996Q194.97400000000002 45.34 193.63500000000002 46.757000000000005Q192.29600000000002 48.174 190.086 48.174H186.60200000000003Q186.49800000000002 48.174 186.49800000000002 48.278V55.74Q186.49800000000002 56.0 186.23800000000003 56.0H184.26200000000003Q184.00200000000004 56.0 184.00200000000004 55.74V38.034000000000006Q184.00200000000004 37.774 184.26200000000003 37.774H190.086Q192.29600000000002 37.774 193.63500000000002 39.217Q194.97400000000002 40.66 194.97400000000002 43.025999999999996ZM192.50400000000002 43.078Q192.50400000000002 41.648 191.73700000000002 40.790000000000006Q190.97000000000003 39.932 189.72200000000004 39.932H186.60200000000003Q186.49800000000002 39.932 186.49800000000002 40.036V46.068Q186.49800000000002 46.172 186.60200000000003 46.172H189.72200000000004Q190.97000000000003 46.172 191.73700000000002 45.327Q192.50400000000002 44.482 192.50400000000002 43.078Z M205.19200000000004 51.346000000000004V50.644Q205.19200000000004 50.384 205.45200000000003 50.384H207.37600000000003Q207.63600000000002 50.384 207.63600000000002 50.644V51.216Q207.63600000000002 52.49 208.507 53.269999999999996Q209.37800000000001 54.05 210.86 54.05Q212.18600000000004 54.05 212.95300000000003 53.334999999999994Q213.72000000000003 52.62 213.72000000000003 51.45Q213.72000000000003 50.67 213.33000000000004 50.098Q212.94000000000003 49.526 212.199 49.032Q211.45800000000003 48.538 210.05400000000003 47.784Q208.46800000000002 46.952 207.519 46.302Q206.57000000000002 45.652 205.94600000000003 44.664Q205.32200000000003 43.676 205.32200000000003 42.272Q205.32200000000003 40.088 206.752 38.84Q208.18200000000002 37.592 210.54800000000003 37.592Q212.18600000000004 37.592 213.43400000000003 38.216Q214.68200000000002 38.84 215.37100000000004 39.971000000000004Q216.06000000000003 41.102000000000004 216.06000000000003 42.584V43.182Q216.06000000000003 43.442 215.8 43.442H213.85000000000002Q213.59000000000003 43.442 213.59000000000003 43.182V42.636Q213.59000000000003 41.362 212.75800000000004 40.556Q211.92600000000002 39.75 210.496 39.75Q209.22200000000004 39.75 208.50700000000003 40.4Q207.79200000000003 41.05 207.79200000000003 42.246Q207.79200000000003 43.025999999999996 208.14300000000003 43.572Q208.49400000000003 44.118 209.22200000000004 44.599000000000004Q209.95000000000002 45.08 211.38000000000002 45.808Q213.17400000000004 46.822 214.09700000000004 47.472Q215.02 48.122 215.60500000000002 49.058Q216.19000000000003 49.994 216.19000000000003 51.32Q216.19000000000003 53.556 214.721 54.882Q213.252 56.208 210.75600000000003 56.208Q209.092 56.208 207.83100000000002 55.596999999999994Q206.57000000000002 54.986 205.88100000000003 53.894Q205.19200000000004 52.802 205.19200000000004 51.346000000000004Z" fill="#0b0e10" stroke="#0b0e10" stroke-width=".8"/><polygon points="130.0,70.0 133.1,112.3 146.0,89.4 138.9,114.7 171.0,87.0 143.3,119.1 168.6,112.0 145.7,124.9 188.0,128.0 145.7,131.1 168.6,144.0 143.3,136.9 171.0,169.0 138.9,141.3 146.0,166.6 133.1,143.7 130.0,186.0 126.9,143.7 114.0,166.6 121.1,141.3 89.0,169.0 116.7,136.9 91.4,144.0 114.3,131.1 72.0,128.0 114.3,124.9 91.4,112.0 116.7,119.1 89.0,87.0 121.1,114.7 114.0,89.4 126.9,112.3" fill="#e9edee"/><polygon points="130.0,108.0 150.0,128.0 130.0,148.0 110.0,128.0" fill="#f28c28"/></svg>'
  };

  /* ---------------- Menu ---------------- */
  var ITEMS = [
    { id: "briefing", title: "About Joint Operations", desc: "What it is, how it works, and where it stands", tab: "About" },
    { id: "roadmap", title: "Roadmap", desc: "Where we are and what comes next", tab: "Roadmap", tabOnly: true },
    { id: "download", title: "Download", desc: "Get Joint Operations for Windows or Linux", tab: "Download" },
    { id: "sessions", title: "Session Browser", desc: "Find, host and join Joint Operations sessions", tab: "Sessions" },
    { id: "contribute", title: "Contribute", desc: "Take a contract and help build Joint Operations", tab: "Contribute" },
    { id: "team", title: "Team", desc: "Chain of command and the people behind Hound Protocol", tab: "Team", tabOnly: true },
    { id: "mods", title: "Mods", desc: "Mods tested to work with Joint Operations", tab: "Mods" },
    { id: "devlog", title: "Dev Log", desc: "News, decisions and releases", tab: "Dev Log" },
    { id: "docs", title: "Documentation", desc: "The handbook, plans, decisions and research", tab: "Docs" },
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
        (p.link ? '<a class="s-link" href="' + esc(p.link[1]) + '"' + (/^https?:/.test(p.link[1]) ? ' target="_blank" rel="noopener noreferrer"' : "") + ">" + esc(p.link[0]) + ' <span aria-hidden="true">' + (/^https?:/.test(p.link[1]) ? "↗" : "→") + "</span></a>" : "");
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
  /* The handbook (guides) is a zone of Documentation, so it lights the Docs tab */
  function tabOf(v) { return v === "guides" ? "docs" : v; }
  function shell(kicker, title, body) {
    var cv = tabOf(currentView), now = ITEMS.filter(function (it) { return it.id === cv; })[0];
    var tabs = '<div class="secwrap"><nav class="secbar" aria-label="Sections">' + ITEMS.map(function (it) {
      return '<a href="#/' + it.id + '" class="tab-' + it.id + '" data-desc="' + esc(it.desc) + '"' + (it.id === cv ? ' aria-current="page"' : "") + ">" + menuIcon(it.id) + "<span>" + esc(it.tab) + "</span></a>";
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
      var txt = a ? a.getAttribute("data-desc") : ((ITEMS.filter(function (it) { return it.id === tabOf(currentView); })[0] || {}).desc || "");
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
      var stats = [[16, "players in one session"], [1, "host, the authority"], [0, "Konami servers touched"], [100, "% free and open source"]];
      $("#vb").innerHTML = '<div class="bf ab">' +
        '<section class="bf-sec ab-hero"><div class="ab-copy"><span class="ab-kick">MGSV: Joint Operations · by Hound Protocol</span><h3 class="bf-head">' + hl(b.headline || "") + "</h3>" +
          (b.summary || []).map(function (t) { return '<p class="bf-lead">' + hl(t) + "</p>"; }).join("") +
          '<div class="toolbar"><a class="btn primary" href="#/contribute">Join the Hound</a><a class="btn" href="#/roadmap">Roadmap</a><a class="btn" href="#/guides/hp-gde-001">Player Guide</a></div></div></section>' +
        '<section class="bf-sec ab-stats">' + stats.map(function (st, k) { return '<div style="--k:' + k + '"><b data-to="' + st[0] + '">0</b><span>' + esc(st[1]) + "</span></div>"; }).join("") + "</section>" +
        '<section class="bf-sec"><div class="label">How a session works</div><ol class="ab-steps">' + (b.how || []).map(function (h, k) {
          return '<li style="--k:' + k + '"><span class="ab-n">0' + (k + 1) + '</span><span class="st-n">' + (ICONS[h[0]] || k + 1) + "</span><h4>" + esc(h[1]) + "</h4><p>" + hl(h[2]) + "</p></li>";
        }).join("") + "</ol></section>" +
        '<section class="bf-sec ab-more"><div class="label">Read more in the Handbook</div><div class="ab-links">' +
          [["hp-gde-001", "HP-GDE-001", "Player Guide", "Install, host and join, and stay safe."], ["hp-gde-002", "HP-GDE-002", "Linux and Proton", "Play on Linux and Steam Deck."], ["hp-gde-017", "HP-GDE-017", "Can I Contribute?", "Find where you fit in five questions."], ["hp-gde-015", "HP-GDE-015", "Using the Website", "Every section, search and sign-in."]].map(function (g, k) {
            return '<a href="#/guides/' + g[0] + '" style="--k:' + k + '"><small>' + g[1] + "</small><b>" + esc(g[2]) + "</b><span>" + esc(g[3]) + "</span></a>";
          }).join("") + "</div></section>" +
        ((b.faq || []).length ? '<section class="bf-sec"><div class="label">Frequently asked</div><div class="faq ab-faq">' + b.faq.map(function (f, k) {
          return '<details style="--k:' + k + '"><summary>' + esc(f[0]) + "</summary><p>" + hl(f[1]) + "</p></details>";
        }).join("") + "</div></section>" : "") +
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

  /* ---------------- Roadmap: the base under construction ----------------
     Seen from above. Phase 0 is the command platform in the centre, every later phase is a platform on its own bridge,
     named after the phase. The fill inside a platform is the share of that phase's tasks that are done; the hatched part
     above it is still scaffolding. Point at a platform to light it, click it to read its tasks.
     Everything that moves (cargo ships unloading, crews carrying crates, cranes, boats, a helicopter, the comms mast, gulls, channel buoys, helipad lights, a windsock, helicopter lights, a mast beacon)
     is decoration and stops with Options → Animations. The data comes live from ROADMAP.md. */
  var MB_SLOTS = [[-345, -220], [345, -220], [345, 220], [-345, 220], [0, -330], [0, 330]];
  var MB_W = 1600, MB_H = 900, MB_CX = 600, MB_CY = 470;
  var MB = null;
  function mbRng(seed) { var s = (seed >>> 0) || 1; return function () { s = (Math.imul ? Math.imul(s, 1664525) : s * 1664525) + 1013904223 >>> 0; return s / 4294967296; }; }
  function mbRot(p, a) { var c = Math.cos(a), s = Math.sin(a); return [p[0] * c - p[1] * s, p[0] * s + p[1] * c]; }
  function mbF(n) { return (Math.round(n * 10) / 10).toString(); }
  function mbLen(x, y) { return Math.sqrt(x * x + y * y); }
  function mbState(p, now) { return p.total && p.done === p.total ? "done" : (p === now || p.done > 0 ? "now" : "next"); }
  function mbClamp(t) { return t < 0 ? 0 : t > 1 ? 1 : t; }
  function mbEase(t) { t = mbClamp(t); return 1 - Math.pow(1 - t, 3); }

  /* Platform outline in local units: +x points away from the command platform */
  function mbGeom(i, core) {
    var r = mbRng(i * 97 + 13), S = 1.15, R = core ? 94 : 66, sh = [], hex = [], k, zones = [];
    for (k = 0; k < 6; k++) { var a = Math.PI / 3 * k + Math.PI / 6; hex.push([Math.cos(a) * R, Math.sin(a) * R]); }
    sh.push({ t: "poly", p: hex });
    zones.push({ t: "disc", x: 0, y: 0, r: R * 0.62 });
    var flat = R * Math.cos(Math.PI / 6), pad, side = 1;
    if (core) {
      sh.push({ t: "rect", x: -39, y: -R - 39, w: 78, h: 50 });
      sh.push({ t: "rect", x: -39, y: R - 11, w: 78, h: 50 });
      pad = { x: 0, y: -R - 66, r: 30 };
      zones.push({ t: "rect", x: -32, y: R - 2, w: 64, h: 32, gate: [0, R - 6] });
    } else {
      var L = Math.round((58 + r() * 24) * S), off = Math.round((-22 + r() * 14) * S);
      side = r() < 0.5 ? -1 : 1;
      sh.push({ t: "rect", x: flat - 7, y: -25, w: L, h: 50 });
      sh.push({ t: "rect", x: off, y: side > 0 ? R - 14 : -R - 37, w: 62, h: 51 });
      pad = { x: flat + L + 21, y: 0, r: 30 };
      zones.push({ t: "rect", x: flat, y: -17, w: L - 14, h: 34, gate: [flat - 4, 0] });
      zones.push({ t: "rect", x: off + 9, y: side > 0 ? R - 5 : -R - 28, w: 44, h: 32, gate: [0, side > 0 ? R - 8 : -R + 8] });
    }
    sh.push({ t: "circ", x: pad.x, y: pad.y, r: pad.r });
    return { sh: sh, R: R, pad: pad, zones: zones, side: side };
  }
  function mbShapeSvg(s, deg, cls) {
    var tr = ' transform="rotate(' + mbF(deg) + ')"', c = cls ? ' class="' + cls + '"' : "";
    if (s.t === "poly") return "<polygon" + c + tr + ' points="' + s.p.map(function (q) { return mbF(q[0]) + "," + mbF(q[1]); }).join(" ") + '"/>';
    if (s.t === "rect") return "<rect" + c + tr + ' x="' + s.x + '" y="' + s.y + '" width="' + s.w + '" height="' + s.h + '"/>';
    return "<circle" + c + tr + ' cx="' + mbF(s.x) + '" cy="' + mbF(s.y) + '" r="' + s.r + '"/>';
  }
  function mbExtent(sh, a) {
    var e = [1e9, 1e9, -1e9, -1e9];
    function add(p, pad) { var q = mbRot(p, a); e[0] = Math.min(e[0], q[0] - pad); e[1] = Math.min(e[1], q[1] - pad); e[2] = Math.max(e[2], q[0] + pad); e[3] = Math.max(e[3], q[1] + pad); }
    sh.forEach(function (s) {
      if (s.t === "poly") s.p.forEach(function (p) { add(p, 0); });
      else if (s.t === "rect") { add([s.x, s.y], 0); add([s.x + s.w, s.y], 0); add([s.x, s.y + s.h], 0); add([s.x + s.w, s.y + s.h], 0); }
      else add([s.x, s.y], s.r);
    });
    return e;
  }
  function mbWorld(m, lp) { var p = mbRot(lp, m.a); return [m.x + p[0], m.y + p[1]]; }
  /* A random spot on a platform. Walkers only move in straight lines inside one deck area, and change area through
     its gate (a point inside both the deck and the hexagon), so nobody walks over the water */
  function mbPick(m, r, zi) {
    if (zi == null) zi = Math.floor(r() * m.g.zones.length);
    var z = m.g.zones[zi], p;
    if (z.t === "disc") { var a = r() * Math.PI * 2, d = Math.sqrt(r()) * z.r; p = [Math.cos(a) * d, Math.sin(a) * d]; }
    else p = [z.x + 4 + r() * (z.w - 8), z.y + 4 + r() * (z.h - 8)];
    var w = mbWorld(m, p); w.z = zi; return w;
  }
  function mbRoute(m, from, to) {
    var path = [], a = m.g.zones[from], b = m.g.zones[to];
    if (from !== to) { if (a.gate) path.push(mbWorld(m, a.gate)); if (b.gate) path.push(mbWorld(m, b.gate)); }
    return path;
  }

  function mbBuild(r, now) {
    var mods = r.map(function (p, i) {
      var core = i === 0, slot = core ? [0, 0] : MB_SLOTS[(i - 1) % MB_SLOTS.length];
      var a = core ? 0 : Math.atan2(slot[1], slot[0]), g = mbGeom(i, core), ext = mbExtent(g.sh, a);
      return { i: i, p: p, core: core, x: MB_CX + slot[0], y: MB_CY + slot[1], a: a, deg: a * 180 / Math.PI, g: g, ext: ext,
        pct: p.total ? Math.round(p.done / p.total * 100) : 0, st: mbState(p, now), name: p.title };
    });
    var defs = '<defs><filter id="mbGlow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
      '<pattern id="mbHatch" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="9"/></pattern>' +
      '<radialGradient id="mbCloudG"><stop offset="0" stop-color="#000" stop-opacity=".42"/><stop offset=".6" stop-color="#000" stop-opacity=".16"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="mbSea" gradientUnits="userSpaceOnUse" cx="' + MB_CX + '" cy="' + MB_CY + '" r="900"><stop offset="0" stop-color="#18343d" stop-opacity=".9"/><stop offset="1" stop-color="#060a0c" stop-opacity="0"/></radialGradient>' +
      mods.map(function (m) { return '<clipPath id="mbClip' + m.i + '">' + m.g.sh.map(function (s) { return mbShapeSvg(s, m.deg); }).join("") + "</clipPath>"; }).join("") + "</defs>";
    var bridges = mods.filter(function (m) { return !m.core; }).map(function (m) {
      var built = m.st !== "next", x1 = MB_CX, y1 = MB_CY, x2 = m.x, y2 = m.y, len = mbLen(x2 - x1, y2 - y1), ux = (x2 - x1) / len, uy = (y2 - y1) / len, piers = "";
      for (var d = 130; d < len - 80; d += 52) piers += '<rect class="mb-pier" x="' + mbF(x1 + ux * d - 5) + '" y="' + mbF(y1 + uy * d - 5) + '" width="10" height="10"/>';
      var line = 'x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '"';
      return '<g class="mb-bridge ' + (built ? "built" : "plan") + '" data-len="' + mbF(len) + '">' + (built ? piers + '<line class="b-edge" ' + line + "/>" : "") + '<line class="b-deck" ' + line + "/>" +
        (built ? '<line class="b-lane" ' + line + "/>" : "") + "</g>";
    }).join("");
    var plats = mods.map(function (m) {
      var e = m.ext, label = "Phase " + m.p.n + ": " + m.p.title + ", " + m.pct + "% complete", padC = mbRot([m.g.pad.x, m.g.pad.y], m.a);
      return '<g class="mb-mod st-' + m.st + (m.core ? " core" : "") + '" data-i="' + m.i + '" tabindex="0" role="button" aria-pressed="false" aria-label="' + esc(label) + '" transform="translate(' + m.x + " " + m.y + ')">' +
        '<g class="mb-in">' +
        '<g class="mb-edge">' + m.g.sh.map(function (s) { return mbShapeSvg(s, m.deg); }).join("") + "</g>" +
        '<g class="mb-deck">' + m.g.sh.map(function (s) { return mbShapeSvg(s, m.deg); }).join("") + "</g>" +
        '<g clip-path="url(#mbClip' + m.i + ')"><rect class="mb-hatch" x="' + mbF(e[0]) + '" y="' + mbF(e[1]) + '" width="' + mbF(e[2] - e[0]) + '" height="0" fill="url(#mbHatch)"/>' +
        '<path class="mb-fill"/><path class="mb-lvl"/></g>' +
        '<g class="mb-mark">' + mbShapeSvg({ t: "poly", p: m.g.sh[0].p.map(function (q) { return [q[0] * 0.7, q[1] * 0.7]; }) }, m.deg) +
        mbShapeSvg({ t: "circ", x: m.g.pad.x, y: m.g.pad.y, r: 19 }, m.deg) + "</g>" +
        '<text class="mb-h" x="' + mbF(padC[0]) + '" y="' + mbF(padC[1] + 5) + '">H</text>' +
        '<circle class="mb-beacon" cx="' + mbF(padC[0] + 22) + '" cy="' + mbF(padC[1] - 22) + '" r="3"/>' +
        "</g>" +
        '<text class="mb-pct" x="0" y="' + mbF(e[1] - 18) + '">0%</text>' +
        '<text class="mb-name" x="0" y="' + mbF(e[3] + 32) + '">' + esc("P" + m.p.n + " · " + m.name) + "</text>" +
        "</g>";
    }).join("");
    var waves = "";
    for (var w = 0; w < 46; w++) waves += '<line class="mb-wave"/>';
    var svg = '<svg class="mb-svg" viewBox="0 0 ' + MB_W + " " + MB_H + '" role="group" aria-label="Base under construction: one platform per roadmap phase">' + defs +
      '<rect class="mb-sea" x="0" y="0" width="' + MB_W + '" height="' + MB_H + '" fill="url(#mbSea)"/>' +
      '<g class="mb-water">' + waves + '<g id="mbRings"></g><g id="mbBuoys"></g><g id="mbBoats"></g><g id="mbShips"></g></g>' +
      '<g class="mb-bridges">' + bridges + '<g id="mbWalk"></g></g>' +
      '<g class="mb-plats">' + plats + "</g>" +
      '<g class="mb-fx" aria-hidden="true"><g id="mbPile"></g><g id="mbCrew"></g><g id="mbCarry"></g><g id="mbCranes"></g><g id="mbComms" class="mb-comms"><rect x="-6" y="-6" width="12" height="12"/><circle class="mb-beacon" cx="0" cy="0" r="2.4"/><line x1="0" y1="0" x2="18" y2="0"/><circle cx="18" cy="0" r="2.2"/></g><g id="mbPadL"></g><g id="mbBridgeL"></g><g id="mbSock" class="mb-sock"><line x1="0" y1="0" x2="0" y2="-1"/><path d="M0 0 L16 -3 L16 3 Z"/></g><g id="mbSel"><circle class="r1"/><circle class="r2"/></g><g id="mbHeli"></g><g id="mbGulls"></g></g>' +
      '<g class="mb-clouds" aria-hidden="true"><ellipse rx="300" ry="170" fill="url(#mbCloudG)"/><ellipse rx="240" ry="140" fill="url(#mbCloudG)"/><ellipse rx="340" ry="190" fill="url(#mbCloudG)"/></g>' +
      '<g class="mb-hud" aria-hidden="true"><path d="M14 44V14h30M1586 44V14h-30M14 856v30h30M1586 856v30h-30"/>' +
      '<g transform="translate(1080 70)"><circle r="20"/><path d="M0 -15L5 4 0 0-5 4z"/><text y="-28">N</text></g></g>' +
      "</svg>";
    return { mods: mods, svg: svg };
  }

  function mbPanel(m) {
    var p = m.p, word = { now: "Under construction", done: "Complete", next: "Planned" }[m.st], pill = { now: "warn", done: "ok", next: "" }[m.st];
    return '<div class="mb-p st-' + m.st + '"><div class="kicker">Phase ' + p.n + (m.core ? " · command platform" : " · platform") + "</div>" +
      "<h3>" + esc(p.title) + "</h3>" +
      '<div class="mb-big"><b>' + m.pct + '%</b><span class="pill ' + pill + '">' + word + "</span></div>" +
      '<div class="meter"><i style="width:' + m.pct + '%"></i></div>' +
      '<p class="mb-count">' + p.done + " of " + plural(p.total, "task") + " done</p>" +
      '<ul class="rm-items">' + p.items.map(function (it) { return '<li class="' + (it.done ? "done" : "") + '">' + inline(it.text, "ROADMAP.md") + "</li>"; }).join("") + "</ul></div>";
  }

  function mbStop() { if (MB) { if (MB.raf) cancelAnimationFrame(MB.raf); if (MB.onResize) window.removeEventListener("resize", MB.onResize); } MB = null; }

  function viewRoadmap() {
    mbStop();
    var v = $("#view");
    v.innerHTML = shell("Plan", "Roadmap", loading("Loading roadmap"));
    loadRoadmap().then(function () {
      if (currentView !== "roadmap") return;
      var r = data.roadmap || [], now = currentPhase();
      if (!r.length) { $("#vb").innerHTML = '<div class="empty">Roadmap unavailable<small>ROADMAP.md could not be loaded.</small></div>'; return; }
      var all = r.reduce(function (a, p) { return [a[0] + p.done, a[1] + p.total]; }, [0, 0]);
      var b = mbBuild(r, now);
      $("#vb").innerHTML = '<div class="bf"><section class="bf-sec">' +
        '<div class="mb-stage">' + b.svg +
          '<div class="mb-hudtl"><span class="kicker">Joint Operations Motherbase</span><b>' + (all[1] ? Math.round(all[0] / all[1] * 100) : 0) + "%</b><small>" + all[0] + " of " + all[1] + " tasks done</small>" +
          '<ul class="mb-key"><li class="k-done">Complete</li><li class="k-now">Under construction</li><li class="k-next">Planned</li></ul></div>' +
          '<p class="mb-hint">Click a platform for details</p>' +
          '<aside class="mb-panel" id="mbPanel" aria-live="polite"></aside>' +
        "</div>" +
        '<p class="source">Read live from <a href="' + repoUrl("/blob/" + cfg.branch + "/ROADMAP.md") + '" target="_blank" rel="noopener noreferrer">ROADMAP.md</a> · the base grows as tasks are ticked off in each release · each phase starts when the one before it is done</p>' +
        "</section></div>";
      mbStart(b.mods, r.indexOf(now));
      revealSections();
      refreshInfo();
    });
  }

  function mbStart(mods, nowIdx) {
    var svg = $(".mb-svg"), stage = $(".mb-stage"), r = mbRng(7);
    MB = { svg: svg, mods: mods, sel: -1, t: 0, last: 0, raf: 0, cargo: 0 };
    var cur = mods[nowIdx < 0 ? 0 : nowIdx];
    function fit() { var narrow = stage.clientWidth < 760; svg.setAttribute("viewBox", narrow ? "-10 20 1150 870" : "0 0 " + MB_W + " " + MB_H); stage.classList.toggle("narrow", narrow); }
    MB.onResize = fit; window.addEventListener("resize", fit); fit();
    function select(i, quiet) {
      MB.sel = i;
      $$(".mb-mod").forEach(function (g) { var on = +g.getAttribute("data-i") === i; g.classList.toggle("sel", on); g.setAttribute("aria-pressed", String(on)); });
      var pn = $("#mbPanel"); pn.innerHTML = mbPanel(mods[i]); pn.scrollTop = 0;
      if (!quiet) { blip("go"); status("Phase " + mods[i].p.n + " · " + mods[i].p.title); if (stage.classList.contains("narrow") && pn.scrollIntoView) pn.scrollIntoView({ behavior: opts.motion ? "smooth" : "auto", block: "nearest" }); }
    }
    $$(".mb-mod").forEach(function (g) {
      var i = +g.getAttribute("data-i");
      g.addEventListener("click", function () { select(i); });
      g.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(i); } });
      g.addEventListener("mouseenter", function () { blip(); });
    });
    select(cur.i, true);

    /* ---- Cast ---- */
    var crew = [], walk = [], cranes = [], boats = [], ships = [], waves = [], sparks = [], rings = [], clouds = [], carriers = [], pile = [];
    mods.forEach(function (m) {
      var n = m.st === "now" ? (m.core ? 16 : 12) : m.st === "done" ? (m.core ? 7 : 5) : 2;
      for (var k = 0; k < n; k++) { var p = mbPick(m, r); crew.push({ m: m, x: p[0], y: p[1], z: p.z, path: [], wait: r() * 2, sp: m.st === "next" ? 8 : 14 + r() * 9 }); }
      if (m.st === "now") {
        [[-m.g.R * 0.36, -m.g.R * 0.3], [m.g.R * 0.32, m.g.R * 0.34]].forEach(function (lp, k) { var w = mbWorld(m, lp); cranes.push({ x: w[0], y: w[1], base: r() * 360, ph: k * 2.1, sp: 0.25 + r() * 0.2 }); });
        for (var s = 0; s < 5; s++) sparks.push({ m: m, x: 0, y: 0, on: 0, next: r() * 2 });
      }
      if (!m.core && m.st !== "next") for (var q = 0; q < 3; q++) walk.push({ m: m, u: r(), d: r() < 0.5 ? 1 : -1, lane: (q % 2 ? 3 : -3), sp: 0.03 + r() * 0.03 });
    });
    for (var bI = 0; bI < 3; bI++) boats.push({ st: "in", x: 0, y: 0, tx: 0, ty: 0, wait: 0, trail: [], tick: 0, h: 0, delay: 1.5 + bI * 4 });
    /* Cargo ships go to platforms under construction; crews carry the crates to a stockpile; builders use them up */
    var sites = mods.filter(function (m) { return m.st === "now"; }); if (!sites.length) sites = [mods[0]];
    for (var sI = 0; sI < 2; sI++) ships.push({ st: "wait", x: 0, y: 0, h: 0, trail: [], tick: 0, wait: 0.5 + sI * 7, load: 6, site: sites[sI % sites.length], cont: [] });
    for (var wI = 0; wI < 46; wI++) waves.push({ x: r() * MB_W, y: r() * MB_H, l: 10 + r() * 22, sp: 4 + r() * 7, o: 0.04 + r() * 0.1 });
    for (var rI = 0; rI < 14; rI++) rings.push({ x: 0, y: 0, t: 1, dur: 1, r0: 0, r1: 0, hot: false });
    for (var cI = 0; cI < 3; cI++) clouds.push({ x: r() * MB_W, y: 120 + r() * 660, sp: 6 + r() * 5 });
    for (var kI = 0; kI < 6; kI++) carriers.push({ st: "idle", x: 0, y: 0, ship: null, wait: kI * 0.35 });
    for (var pI = 0; pI < 10; pI++) pile.push({ on: false });

    $("#mbCrew").innerHTML = crew.map(function (c) { return '<circle class="mb-man st-' + c.m.st + '" r="2.3"/>'; }).join("") + sparks.map(function () { return '<circle class="mb-spark" r="3"/>'; }).join("");
    $("#mbWalk").innerHTML = walk.map(function () { return '<circle class="mb-man st-done" r="2"/>'; }).join("");
    $("#mbCranes").innerHTML = cranes.map(function () { return '<g class="mb-crane"><rect x="-5" y="-5" width="10" height="10"/><line x1="-11" y1="0" x2="42" y2="0"/><circle cx="42" cy="0" r="2.4"/></g>'; }).join("");
    $("#mbBoats").innerHTML = boats.map(function () { return '<polyline class="mb-wake"/><polygon class="mb-hull" points="14,0 6,-5 -12,-5 -12,5 6,5"/>'; }).join("");
    var CONT = [[-22, -5], [-12, -5], [-2, -5], [-22, 4], [-12, 4], [-2, 4]], COLS = ["#f28c28", "#4f8fa6", "#b8c2c5", "#c9a24a", "#4f8fa6", "#f28c28"];
    $("#mbShips").innerHTML = ships.map(function () {
      return '<polyline class="mb-wake big"/><g class="mb-ship"><polygon class="hull" points="44,0 34,-12 -40,-12 -40,12 34,12"/><rect class="deck" x="-36" y="-9" width="64" height="18"/>' +
        CONT.map(function (c, k) { return '<rect class="cont" x="' + c[0] + '" y="' + c[1] + '" width="9" height="7" fill="' + COLS[k] + '"/>'; }).join("") +
        '<rect class="bridge" x="12" y="-8" width="14" height="16"/><circle class="lamp" cx="40" cy="0" r="1.8"/></g><line class="mb-gang"/>';
    }).join("");
    $("#mbCarry").innerHTML = carriers.map(function () { return '<g class="mb-carrier"><rect class="crate" x="-3.5" y="-9" width="7" height="6"/><circle r="2.4"/></g>'; }).join("");
    $("#mbPile").innerHTML = pile.map(function () { return '<rect class="mb-crate" width="8" height="7"/>'; }).join("");
    $("#mbRings").innerHTML = rings.map(function () { return '<circle class="mb-ring"/>'; }).join("");
    $("#mbHeli").innerHTML = '<ellipse class="mb-hsh" rx="9" ry="4"/><g class="mb-heli"><g class="hb"><ellipse rx="8" ry="3.4"/><line x1="-6" y1="0" x2="-20" y2="0"/><line x1="-20" y1="-4" x2="-20" y2="4"/><circle class="nav-r" cx="2" cy="-3.6" r="1.3"/><circle class="nav-g" cx="2" cy="3.6" r="1.3"/><circle class="nav-w" cx="-20" cy="0" r="1.2"/></g><line class="rotor" x1="-14" y1="0" x2="14" y2="0"/><line class="rotor" x1="0" y1="-14" x2="0" y2="14"/></g>';
    var el = {
      men: $$("#mbCrew .mb-man"), sp: $$("#mbCrew .mb-spark"), walk: $$("#mbWalk circle"), cr: $$("#mbCranes .mb-crane"),
      wake: $$("#mbBoats .mb-wake"), hull: $$("#mbBoats .mb-hull"), swake: $$("#mbShips .mb-wake"), ship: $$("#mbShips .mb-ship"), gang: $$("#mbShips .mb-gang"),
      cont: $$("#mbShips .mb-ship").map(function (g) { return $$(".cont", g); }),
      carry: $$("#mbCarry .mb-carrier"), pile: $$("#mbPile .mb-crate"), rings: $$("#mbRings circle"), waves: $$(".mb-wave"), clouds: $$(".mb-clouds ellipse"),
      fill: $$(".mb-fill"), lvl: $$(".mb-lvl"), hatch: $$(".mb-hatch"), pct: $$(".mb-pct"), mod: $$(".mb-mod"), inner: $$(".mb-mod .mb-in"), name: $$(".mb-mod .mb-name"),
      br: $$(".mb-bridge"), sel: $("#mbSel"), selR: $$("#mbSel circle"),
      hsh: $("#mbHeli .mb-hsh"), heli: $("#mbHeli .mb-heli"), hb: $("#mbHeli .hb"), rot: $$("#mbHeli .rotor"), pat: $("#mbHatch")
    };
    function padOf(m) { return mbWorld(m, [m.g.pad.x, m.g.pad.y]); }
    var hp = padOf(mods[0]), H = { x: hp[0], y: hp[1], to: cur === mods[0] ? (mods[1] || mods[0]) : cur, st: "wait", t: 3.2, alt: 0, h: -40 };
    function edgePoint() { var s = Math.floor(r() * 4), u = r(); return s === 0 ? [u * 1150, -40] : s === 1 ? [MB_W + 40, u * MB_H] : s === 2 ? [u * 1150, MB_H + 40] : [-40, u * MB_H]; }
    function outward(m) { return m.core ? [0, 1] : [Math.cos(m.a), Math.sin(m.a)]; }
    function reach(m) { return m.core ? m.g.R + 50 : Math.max(m.ext[2] - m.ext[0], m.ext[3] - m.ext[1]) / 2 + 14; }
    function dockFor() {
      var pick = r(), m = pick < 0.5 ? cur : pick < 0.75 ? mods[0] : mods[Math.floor(r() * mods.length)], o = outward(m), d = reach(m) + 30, sd = (r() - 0.5) * 90;
      return [Math.max(20, Math.min(1140, m.x + o[0] * d - o[1] * sd)), Math.max(20, Math.min(MB_H - 20, m.y + o[1] * d + o[0] * sd))];
    }
    /* A ship docks alongside the platform's side deck, parallel to it */
    function berth(m) {
      var o = outward(m), n = [-o[1], o[0]], sgn = m.core ? 1 : m.g.side, d = m.core ? m.g.R * 0.866 + 46 : m.g.R + 70, along = m.core ? 0 : 6;
      return { x: m.x + n[0] * d * sgn + o[0] * along, y: m.y + n[1] * d * sgn + o[1] * along, h: Math.atan2(o[1], o[0]) * 180 / Math.PI, n: [n[0] * sgn, n[1] * sgn] };
    }
    function pileSpot(m, k) { var b = berth(m), base = [m.x + b.n[0] * (m.g.R * 0.45), m.y + b.n[1] * (m.g.R * 0.45)], o = outward(m); return [base[0] + o[0] * ((k % 5) - 2) * 10 - b.n[0] * Math.floor(k / 5) * 9, base[1] + o[1] * ((k % 5) - 2) * 10 - b.n[1] * Math.floor(k / 5) * 9]; }
    boats.forEach(function (b) { var e = edgePoint(), d = dockFor(); b.x = e[0]; b.y = e[1]; b.tx = d[0]; b.ty = d[1]; });
    function ring(x, y, r0, r1, dur, hot) { for (var k = 0; k < rings.length; k++) if (rings[k].t >= 1) { var g = rings[k]; g.x = x; g.y = y; g.r0 = r0; g.r1 = r1; g.dur = dur; g.t = 0; g.hot = !!hot; return; } }
    var piled = 0, ringT = 0;
    /* Comms mast on the command platform (v0.0.22): a turning dish that sends a signal ring every few seconds */
    var comms = mbWorld(mods[0], [-mods[0].g.R * 0.45, mods[0].g.R * 0.05]), commsT = 1.2, commsEl = $("#mbComms");
    /* Gulls (v0.0.24): a small flock circling on the wind over the base, flapping now and then, gliding in between */
    var gulls = [];
    for (var gi = 0; gi < 6; gi++) gulls.push({ cx: 260 + r() * 1000, cy: 160 + r() * 560, R: 26 + r() * 46, w: (r() < 0.5 ? -1 : 1) * (0.32 + r() * 0.22), ph: r() * 6.3, fl: r() * 6.3, vx: 6 + r() * 6, vy: (r() - 0.5) * 4 });
    $("#mbGulls").innerHTML = gulls.map(function () { return '<g class="mb-gull"><path class="gs" d="M-10 1.5Q-5 -4.5 0 0Q5 -4.5 10 1.5"/><path class="gb" d="M-10 1.5Q-5 -4.5 0 0Q5 -4.5 10 1.5"/></g>'; }).join("");
    var gullEls = $$("#mbGulls .mb-gull");
    /* Channel buoys (v0.0.25): red and green marks along the shipping lane, bobbing and blinking out of step */
    var buoys = [];
    [[0.18, 0.5], [0.42, 0.28], [0.62, 0.9], [0.86, 0.3], [0.08, 0.86], [0.6, 0.62]].forEach(function (q, k) { buoys.push({ x: q[0] * 1150 + 30, y: q[1] * MB_H, red: k % 2 === 0, ph: r() * 6.3, per: 2.2 + r() * 1.6 }); });
    $("#mbBuoys").innerHTML = buoys.map(function (b) { return '<g class="mb-buoy ' + (b.red ? "red" : "grn") + '" transform="translate(' + mbF(b.x) + " " + mbF(b.y) + ')"><circle class="bw" r="7"/><circle class="bb" r="4.6"/><circle class="bl" r="2.2"/></g>'; }).join("");
    var buoyEls = $$("#mbBuoys .mb-buoy");
    /* Helipad lights (v0.0.26): four lights around every pad chase in turn, faster on the pad the helicopter is heading for */
    var padL = [];
    mods.forEach(function (m) { var c = padOf(m); for (var q = 0; q < 4; q++) { var a = q * Math.PI / 2 + Math.PI / 4; padL.push({ m: m, q: q, x: c[0] + Math.cos(a) * 17, y: c[1] + Math.sin(a) * 17 }); } });
    $("#mbPadL").innerHTML = padL.map(function (l) { return '<circle class="mb-padl" r="2.1" cx="' + mbF(l.x) + '" cy="' + mbF(l.y) + '"/>'; }).join("");
    var padEls = $$("#mbPadL .mb-padl");
    /* Bridge lights (v0.0.33): small lamps along every bridge, a light running out from the command platform */
    var brL = [], core = mods[0];
    mods.forEach(function (m) { if (m === core) return; for (var q = 1; q <= 6; q++) { var t = 0.22 + q * 0.09; brL.push({ m: m, q: q, x: core.x + (m.x - core.x) * t, y: core.y + (m.y - core.y) * t }); } });
    $("#mbBridgeL").innerHTML = brL.map(function (l) { return '<circle class="mb-brl" r="1.6" cx="' + mbF(l.x) + '" cy="' + mbF(l.y) + '"/>'; }).join("");
    var brEls = $$("#mbBridgeL .mb-brl");
    /* Windsock (v0.0.27): beside the command helipad, swinging with the wind and stiffening in gusts */
    var sockP = padOf(mods[0]), sockEl = $("#mbSock"), sock = [sockP[0] + 30, sockP[1] - 18];
    function shipPos(sh, k) { var c = CONT[k], q = mbRot([c[0] + 4.5, c[1] + 3.5], sh.h * Math.PI / 180); return [sh.x + q[0], sh.y + q[1]]; }

    function step(dt) {
      MB.t += dt; var T = MB.t;
      /* Intro: platforms rise in sequence, bridges are laid, then the gauges fill */
      mods.forEach(function (m, i) {
        var a = mbEase((T - 0.15 - i * 0.22) / 0.7), f = mbEase((T - 0.9 - i * 0.22) / 1.7), e = m.ext;
        el.inner[i].setAttribute("transform", a < 1 ? "scale(" + (0.55 + 0.45 * a).toFixed(3) + ")" : "");
        el.mod[i].style.opacity = a < 1 ? a.toFixed(3) : "";
        var H0 = e[3] - e[1], level = e[3] - H0 * m.pct / 100 * f, amp = (m.pct > 0 && m.pct < 100) ? 3 : 0, top = "", pts = [];
        for (var x = e[0] - 4; x <= e[2] + 4; x += 10) pts.push(mbF(x) + "," + mbF(level + amp * Math.sin(x * 0.06 + T * 2.6 + i)));
        top = "M" + pts.join(" L");
        el.fill[i].setAttribute("d", m.pct * f > 0.3 ? top + " L" + mbF(e[2] + 4) + "," + mbF(e[3] + 4) + " L" + mbF(e[0] - 4) + "," + mbF(e[3] + 4) + "Z" : "");
        el.lvl[i].setAttribute("d", amp && f > 0.02 ? top : "");
        el.hatch[i].setAttribute("height", m.st === "done" ? "0" : mbF(Math.max(0, level - e[1] + 3)));
        el.pct[i].textContent = Math.round(m.pct * f) + "%";
      });
      el.br.forEach(function (b, i) {
        var len = +b.getAttribute("data-len"), a = mbEase((T - 0.25 - (i + 1) * 0.22) / 0.8);
        b.style.opacity = a.toFixed(3);
        if (b.classList.contains("built")) $$("line", b).forEach(function (l) { if (a < 1) { l.style.strokeDasharray = len + " " + len; l.style.strokeDashoffset = mbF(len * (1 - a)); } else { l.style.strokeDasharray = ""; l.style.strokeDashoffset = ""; } });
      });
      el.pat.setAttribute("patternTransform", "rotate(45) translate(" + mbF((T * 6) % 9) + " 0)");
      /* Sea and clouds */
      waves.forEach(function (w, i) { w.x += w.sp * dt; if (w.x > MB_W + 30) w.x = -30; var l = el.waves[i]; l.setAttribute("x1", mbF(w.x)); l.setAttribute("x2", mbF(w.x + w.l)); l.setAttribute("y1", mbF(w.y)); l.setAttribute("y2", mbF(w.y)); l.style.opacity = w.o; });
      clouds.forEach(function (c, i) { c.x += c.sp * dt; if (c.x > MB_W + 380) { c.x = -380; c.y = 120 + r() * 660; } el.clouds[i].setAttribute("cx", mbF(c.x)); el.clouds[i].setAttribute("cy", mbF(c.y)); });
      ringT -= dt;
      if (ringT <= 0) { ringT = 0.35 + r() * 0.4; var rm = mods[Math.floor(r() * mods.length)]; if (rm.st !== "next") { var ang = r() * Math.PI * 2, rr = rm.g.R * 1.02; ring(rm.x + Math.cos(ang) * rr, rm.y + Math.sin(ang) * rr, 3, 20, 2.4); } }
      rings.forEach(function (g, i) {
        var c = el.rings[i];
        if (g.t >= 1) { c.style.opacity = "0"; return; }
        g.t = Math.min(1, g.t + dt / g.dur);
        c.setAttribute("cx", mbF(g.x)); c.setAttribute("cy", mbF(g.y)); c.setAttribute("r", mbF(g.r0 + (g.r1 - g.r0) * mbEase(g.t)));
        c.style.opacity = ((1 - g.t) * (g.hot ? 0.9 : 0.35)).toFixed(2); c.classList.toggle("hot", g.hot);
      });
      /* Crews */
      crew.forEach(function (c, i) {
        if (c.wait > 0) c.wait -= dt;
        else if (!c.path.length) { var p = mbPick(c.m, r); c.path = mbRoute(c.m, c.z, p.z); c.path.push(p); c.z = p.z; }
        else {
          var t0 = c.path[0], dx = t0[0] - c.x, dy = t0[1] - c.y, d = mbLen(dx, dy), s = c.sp * dt;
          if (d <= s) { c.x = t0[0]; c.y = t0[1]; c.path.shift(); if (!c.path.length) c.wait = 0.4 + r() * 2.4; }
          else { c.x += dx / d * s; c.y += dy / d * s; }
        }
        el.men[i].setAttribute("cx", mbF(c.x)); el.men[i].setAttribute("cy", mbF(c.y));
      });
      sparks.forEach(function (s, i) {
        s.next -= dt;
        if (s.next <= 0) { var p = mbPick(s.m, r); s.x = p[0]; s.y = p[1]; s.on = 0.25 + r() * 0.35; s.next = s.on + 0.5 + r() * 2; }
        s.on -= dt;
        el.sp[i].setAttribute("cx", mbF(s.x)); el.sp[i].setAttribute("cy", mbF(s.y)); el.sp[i].style.opacity = s.on > 0 ? (0.5 + 0.5 * Math.sin(T * 60 + i)).toFixed(2) : "0";
      });
      walk.forEach(function (w, i) {
        w.u += w.d * w.sp * dt; if (w.u > 1) { w.u = 1; w.d = -1; } if (w.u < 0) { w.u = 0; w.d = 1; }
        var x2 = w.m.x, y2 = w.m.y, len = mbLen(x2 - MB_CX, y2 - MB_CY), ux = (x2 - MB_CX) / len, uy = (y2 - MB_CY) / len, d = 100 + w.u * (len - 180);
        el.walk[i].setAttribute("cx", mbF(MB_CX + ux * d - uy * w.lane)); el.walk[i].setAttribute("cy", mbF(MB_CY + uy * d + ux * w.lane));
      });
      cranes.forEach(function (c, i) { el.cr[i].setAttribute("transform", "translate(" + mbF(c.x) + " " + mbF(c.y) + ") rotate(" + mbF(c.base + 60 * Math.sin(T * c.sp + c.ph)) + ")"); });
      /* Small boats */
      boats.forEach(function (b, i) {
        if (b.delay > 0) { b.delay -= dt; el.hull[i].style.opacity = "0"; el.wake[i].style.opacity = "0"; return; }
        el.hull[i].style.opacity = ""; el.wake[i].style.opacity = "";
        if (b.st === "dock") { b.wait -= dt; if (b.wait <= 0) { var e = edgePoint(); b.tx = e[0]; b.ty = e[1]; b.st = "out"; } }
        else {
          var dx = b.tx - b.x, dy = b.ty - b.y, d = mbLen(dx, dy), s = 40 * (b.st === "in" ? Math.min(1, d / 70) + 0.12 : 1) * dt;
          b.h = Math.atan2(dy, dx) * 180 / Math.PI;
          if (d <= s) { b.x = b.tx; b.y = b.ty; if (b.st === "in") { b.st = "dock"; b.wait = 2.5 + r() * 4; } else { var e2 = edgePoint(), dk = dockFor(); b.x = e2[0]; b.y = e2[1]; b.tx = dk[0]; b.ty = dk[1]; b.st = "in"; b.trail = []; } }
          else { b.x += dx / d * s; b.y += dy / d * s; }
        }
        b.tick += dt; if (b.tick > 0.12) { b.tick = 0; b.trail.push([b.x, b.y]); if (b.trail.length > 18) b.trail.shift(); }
        if (b.st === "dock" && b.trail.length) b.trail.shift();
        el.hull[i].setAttribute("transform", "translate(" + mbF(b.x) + " " + mbF(b.y) + ") rotate(" + mbF(b.h) + ")");
        el.wake[i].setAttribute("points", b.trail.map(function (p) { return mbF(p[0]) + "," + mbF(p[1]); }).join(" ") + " " + mbF(b.x) + "," + mbF(b.y));
      });
      /* Cargo ships: sail in, berth alongside, unload, sail out */
      ships.forEach(function (sh, i) {
        var g = el.ship[i];
        if (sh.st === "wait") {
          sh.wait -= dt; g.style.opacity = "0"; el.swake[i].style.opacity = "0"; el.gang[i].style.opacity = "0";
          if (sh.wait > 0) return;
          var bt = berth(sh.site), o = outward(sh.site), far = 620;
          sh.bx = bt.x; sh.by = bt.y; sh.bh = bt.h; sh.n = bt.n;
          sh.x = bt.x + o[0] * far * 0.9 + bt.n[0] * far * 0.25; sh.y = bt.y + o[1] * far * 0.9 + bt.n[1] * far * 0.25;
          sh.st = "in"; sh.load = 6; sh.trail = []; el.cont[i].forEach(function (c) { c.style.opacity = ""; });
        }
        g.style.opacity = ""; el.swake[i].style.opacity = "";
        if (sh.st === "in") {
          var dx = sh.bx - sh.x, dy = sh.by - sh.y, d = mbLen(dx, dy), s = 44 * (Math.min(1, d / 160) + 0.1) * dt, want = Math.atan2(dy, dx) * 180 / Math.PI;
          if (d < 120) want = sh.bh + 180;
          var diff = ((want - sh.h + 540) % 360) - 180; sh.h += diff * Math.min(1, dt * 1.5);
          if (d <= s) { sh.x = sh.bx; sh.y = sh.by; sh.st = "unload"; } else { sh.x += dx / d * s; sh.y += dy / d * s; }
        } else if (sh.st === "unload") {
          var dh = ((sh.bh + 180 - sh.h + 540) % 360) - 180; sh.h += dh * Math.min(1, dt * 2.5);
          if (sh.load <= 0 && !carriers.some(function (c) { return c.ship === sh; })) { sh.st = "out"; sh.ox = sh.x + outward(sh.site)[0] * 1000; sh.oy = sh.y + outward(sh.site)[1] * 1000 + sh.n[1] * 200; }
        } else if (sh.st === "out") {
          var ox = sh.ox - sh.x, oy = sh.oy - sh.y, od = mbLen(ox, oy), os = 40 * dt;
          var w2 = Math.atan2(oy, ox) * 180 / Math.PI, df = ((w2 - sh.h + 540) % 360) - 180; sh.h += df * Math.min(1, dt * 0.8);
          sh.x += ox / od * os; sh.y += oy / od * os;
          if (sh.x < -120 || sh.x > MB_W + 120 || sh.y < -120 || sh.y > MB_H + 120) { sh.st = "wait"; sh.wait = 4 + r() * 6; sh.site = sites[Math.floor(r() * sites.length)]; }
        }
        sh.tick += dt; if (sh.tick > 0.15) { sh.tick = 0; sh.trail.push([sh.x, sh.y]); if (sh.trail.length > 26) sh.trail.shift(); }
        if (sh.st === "unload" && sh.trail.length) sh.trail.shift();
        g.setAttribute("transform", "translate(" + mbF(sh.x) + " " + mbF(sh.y) + ") rotate(" + mbF(sh.h) + ") scale(1.35)");
        el.swake[i].setAttribute("points", sh.trail.map(function (p) { return mbF(p[0]) + "," + mbF(p[1]); }).join(" ") + " " + mbF(sh.x) + "," + mbF(sh.y));
        var gl = el.gang[i];
        if (sh.st === "unload") { var gp = [sh.x - sh.n[0] * 16, sh.y - sh.n[1] * 16]; gl.setAttribute("x1", mbF(gp[0])); gl.setAttribute("y1", mbF(gp[1])); gl.setAttribute("x2", mbF(sh.x - sh.n[0] * 44)); gl.setAttribute("y2", mbF(sh.y - sh.n[1] * 44)); gl.style.opacity = ""; }
        else gl.style.opacity = "0";
      });
      /* Carriers: from a berthed ship to the stockpile, one crate at a time */
      carriers.forEach(function (c, i) {
        var g = el.carry[i];
        if (c.st === "idle") {
          c.wait -= dt; g.style.opacity = "0";
          if (c.wait > 0) return;
          var sh = ships.filter(function (s) { return s.st === "unload" && s.load > 0; })[0];
          if (!sh) { c.wait = 0.5; return; }
          sh.load--; c.ship = sh; c.k = 5 - sh.load; var gp = [sh.x - sh.n[0] * 52, sh.y - sh.n[1] * 52];
          c.x = gp[0]; c.y = gp[1]; c.st = "toShip"; c.path = [[sh.x - sh.n[0] * 8, sh.y - sh.n[1] * 8]]; c.carry = false;
        }
        g.style.opacity = "";
        var t0 = c.path[0], dx = t0[0] - c.x, dy = t0[1] - c.y, d = mbLen(dx, dy), s = 30 * dt;
        if (d <= s) {
          c.x = t0[0]; c.y = t0[1]; c.path.shift();
          if (c.path.length) { /* next waypoint */ }
          else if (c.st === "toShip") {
            c.st = "toPile"; c.carry = true; var cc = el.cont[ships.indexOf(c.ship)][c.k]; if (cc) cc.style.opacity = "0";
            var slot = piled % pile.length, site = c.ship.site, ps = pileSpot(site, slot), gate = site.core ? null : site.g.zones[site.g.zones.length - 1].gate;
            c.slot = slot; c.path = [[c.ship.x - c.ship.n[0] * 52, c.ship.y - c.ship.n[1] * 52]]; if (gate) c.path.push(mbWorld(site, gate)); c.path.push(ps);
          }
          else if (c.st === "toPile") { pile[c.slot].on = true; pile[c.slot].x = c.x; pile[c.slot].y = c.y; pile[c.slot].age = 0; piled++; MB.cargo++; c.carry = false; c.st = "idle"; c.ship = null; c.wait = 0.2 + r() * 0.5; }
        } else { c.x += dx / d * s; c.y += dy / d * s; }
        g.setAttribute("transform", "translate(" + mbF(c.x) + " " + mbF(c.y) + ")");
        g.firstChild.style.opacity = c.carry ? "" : "0";
      });
      pile.forEach(function (p, i) {
        var e = el.pile[i];
        if (!p.on) { e.style.opacity = "0"; return; }
        p.age += dt;
        if (p.age > 7 + (i % 4)) { p.on = false; ring(p.x, p.y, 2, 14, 0.8, true); }
        e.setAttribute("x", mbF(p.x - 4)); e.setAttribute("y", mbF(p.y - 3.5)); e.style.opacity = "";
      });
      commsEl.setAttribute("transform", "translate(" + mbF(comms[0]) + " " + mbF(comms[1]) + ") rotate(" + mbF((T * 40) % 360) + ")");
      commsT -= dt; if (commsT <= 0) { commsT = 2.6; ring(comms[0], comms[1], 6, 70, 2.4, false); }
      var gust = 0.5 + 0.5 * Math.sin(T * 0.37) * Math.sin(T * 0.11 + 1), wind = 25 + 18 * Math.sin(T * 0.21) + 6 * Math.sin(T * 1.3);
      sockEl.setAttribute("transform", "translate(" + mbF(sock[0]) + " " + mbF(sock[1]) + ") rotate(" + mbF(wind) + ") scale(" + (0.75 + gust * 0.4).toFixed(2) + " " + (1 - gust * 0.25).toFixed(2) + ")");
      brL.forEach(function (l, i) { var k = Math.floor(T * 5) % 9; brEls[i].style.opacity = k === l.q ? "1" : "0.25"; });
      padL.forEach(function (l, i) {
        var fast = H.to === l.m && H.st === "fly", k = Math.floor(T * (fast ? 8 : 2.5)) % 4;
        padEls[i].style.opacity = k === l.q ? "1" : (fast ? "0.25" : "0.12");
      });
      buoys.forEach(function (b, i) {
        var e = buoyEls[i], t = (T + b.ph) % b.per, bob = 1 + 0.08 * Math.sin(T * 1.7 + b.ph);
        e.lastChild.style.opacity = t < 0.35 ? "1" : "0.15";
        e.childNodes[1].setAttribute("r", mbF(4.6 * bob));
        e.firstChild.setAttribute("r", mbF(5 + ((T * 0.6 + b.ph) % 1) * 9)); e.firstChild.style.opacity = (0.35 * (1 - ((T * 0.6 + b.ph) % 1))).toFixed(2);
      });
      gulls.forEach(function (g, i) {
        g.cx += g.vx * dt; g.cy += g.vy * dt;
        if (g.cx > MB_W + 120) { g.cx = -120; g.cy = 160 + r() * 560; }
        var a = T * g.w + g.ph, x = g.cx + Math.cos(a) * g.R, y = g.cy + Math.sin(a) * g.R * 0.8;
        var hd = Math.atan2(Math.cos(a) * g.w * 0.8, -Math.sin(a) * g.w) * 180 / Math.PI;
        var flapping = Math.sin(T * 0.7 + g.fl) > 0.35, f = flapping ? 0.35 + 0.65 * Math.abs(Math.sin(T * 9 + g.fl)) : 0.55;
        gullEls[i].setAttribute("transform", "translate(" + mbF(x) + " " + mbF(y) + ") rotate(" + mbF(hd + 90) + ")");
        gullEls[i].lastChild.setAttribute("transform", "scale(1 " + f.toFixed(2) + ")");
        var so = mbRot([9, 13], -(hd + 90) * Math.PI / 180);
        gullEls[i].firstChild.setAttribute("transform", "translate(" + mbF(so[0]) + " " + mbF(so[1]) + ") scale(0.9 " + f.toFixed(2) + ")");
      });
      /* Selection ring */
      var sm = mods[MB.sel];
      if (sm) {
        var rad = Math.max(sm.ext[2] - sm.ext[0], sm.ext[3] - sm.ext[1]) / 2 + 10;
        el.sel.setAttribute("transform", "translate(" + mbF(sm.x + (sm.ext[0] + sm.ext[2]) / 2) + " " + mbF(sm.y + (sm.ext[1] + sm.ext[3]) / 2) + ") rotate(" + mbF((T * 14) % 360) + ")");
        el.selR[0].setAttribute("r", mbF(rad)); el.selR[1].setAttribute("r", mbF(rad + 7 + 2 * Math.sin(T * 3)));
      }
      /* Helicopter: wait on a pad, lift, fly, settle */
      H.t -= dt;
      if (H.st === "wait") { H.alt = Math.max(0, H.alt - dt * 0.8); if (H.t <= 0) { H.st = "fly"; H.k = 0; var a2 = padOf(H.to); H.sx = H.x; H.sy = H.y; H.ex = a2[0]; H.ey = a2[1]; H.dur = Math.max(2.5, mbLen(H.ex - H.sx, H.ey - H.sy) / 95); H.h = Math.atan2(H.ey - H.sy, H.ex - H.sx) * 180 / Math.PI; } }
      else {
        H.k += dt; var k = Math.min(1, H.k / H.dur), e3 = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        H.x = H.sx + (H.ex - H.sx) * e3; H.y = H.sy + (H.ey - H.sy) * e3; H.alt = Math.min(1, H.alt + dt);
        if (k >= 1) { H.st = "wait"; H.t = 3 + r() * 3; H.to = H.to === mods[0] ? (cur === mods[0] ? mods[1 + Math.floor(r() * (mods.length - 1))] || mods[0] : cur) : mods[0]; }
      }
      var off = 3 + H.alt * 14;
      el.hsh.setAttribute("cx", mbF(H.x + off)); el.hsh.setAttribute("cy", mbF(H.y + off * 1.3)); el.hsh.style.opacity = (0.35 - H.alt * 0.15).toFixed(2);
      el.heli.setAttribute("transform", "translate(" + mbF(H.x) + " " + mbF(H.y) + ") scale(" + (1 + H.alt * 0.2).toFixed(2) + ")");
      el.hb.setAttribute("transform", "rotate(" + mbF(H.h) + ")");
      var spin = (T * (H.st === "wait" && H.alt < 0.05 ? 160 : 1500)) % 360;
      /* Navigation lights (v0.0.30): red and green steady, the white tail light blinks */
      el.hb.lastChild.style.opacity = (T % 1.2) < 0.15 ? "1" : "0.15";
      el.rot[0].setAttribute("transform", "rotate(" + mbF(spin) + ")"); el.rot[1].setAttribute("transform", "rotate(" + mbF(spin) + ")");
    }
    if (!opts.motion) { MB.t = 30; step(0); return; }
    step(0);
    function frame(ts) {
      if (!MB || currentView !== "roadmap" || !document.body.contains(svg)) { mbStop(); return; }
      var dt = MB.last ? Math.min(0.05, (ts - MB.last) / 1000) : 0; MB.last = ts;
      step(dt);
      MB.raf = requestAnimationFrame(frame);
    }
    MB.raf = requestAnimationFrame(frame);
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
    /* Release merges are already listed as releases, so their commits are left out */
    var rel = (data.releases || []).map(function (r) { return r.tag_name; });
    (data.commits || []).forEach(function (c) { var m = /^Release (v[\d.]+)/.exec(c.title || ""); if (m && rel.indexOf(m[1]) > -1) return; out.push(Object.assign({ kind: "commit" }, c)); });
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
      '<div class="stats"><div class="stat"><b>' + all.length + '</b><span>Sessions</span></div><div class="stat"><b>' + online + '</b><span>Online</span></div><div class="stat"><b>' + players + '</b><span>Total players</span></div></div>' +
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
  /* Claims made on the website: the relay keeps them, GitHub vouches for who made each one (tools/signin-relay) */
  var conClaims = {}, conClaimOn = false, conFresh = "";
  function conLoadClaims() {
    if (!siOn() || typeof fetch !== "function") return Promise.resolve();
    return fetch(siRelay() + "/claims", { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) { conClaimOn = !!(j && j.claims); conClaims = (j && j.claims) || {}; }, function () { conClaimOn = false; });
  }
  function conMine(c) { return siIn() && (conClaims[c.id] || []).some(function (x) { return String(x.id) === String(SI.user.id); }); }
  /* Every card lists its contributors: who completed it, who is working on it, and who claimed it on the website */
  function conPeople(c, done) {
    var rows = [], seen = {};
    function add(login, role, at) { var k = String(login).toLowerCase(); if (seen[k]) return; seen[k] = 1; rows.push({ login: login, role: role, at: at }); }
    (done ? (c.by || []) : []).forEach(function (u) { add(u, "Completed"); });
    (c.working || []).forEach(function (u) { add(u, "Working on it"); });
    (conClaims[c.id] || []).forEach(function (x) { add(x.login, "Claimed", x.at); });
    if (!done && c.live) (c.by || []).forEach(function (u) { add(u, "Claimed"); });
    if (!rows.length) return "";
    var fresh = conFresh === c.id;
    return '<details class="kc-contrib ' + (done ? "done" : "wip") + '"' + (fresh ? " open" : "") + '><summary><span class="kp-l">' + (done ? "✓ " : '<i class="kp-dot"></i>') + "Contributors <em class=\"kp-n\">" + rows.length + '</em></span><span class="kp-faces">' +
      rows.slice(0, 5).map(function (r) { return '<img src="https://github.com/' + encodeURIComponent(r.login) + '.png?size=40" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.visibility=\'hidden\'">'; }).join("") + "</span></summary><ul>" +
      rows.map(function (r, k) {
        return '<li class="' + (fresh && SI && SI.user && r.login === SI.user.login ? "new" : "") + '" style="--k:' + k + '"><a href="https://github.com/' + encodeURIComponent(r.login) + '" target="_blank" rel="noopener noreferrer"><img src="https://github.com/' + encodeURIComponent(r.login) + '.png?size=40" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.visibility=\'hidden\'">' + esc(r.login) + "</a><small>" + esc(r.role) + (r.at ? " · " + esc(fmtDate(new Date(r.at).toISOString().slice(0, 10))) : "") + "</small></li>";
      }).join("") + "</ul>" + (c.agents && c.agents.length ? '<p class="kp-agent">With ' + esc(c.agents.join(", ")) + " (credited as the contributors' tool)</p>" : "") + "</details>";
  }
  function conClaimBtn(c) {
    if (!conClaimOn) return "";
    if (!siIn()) return '<button type="button" class="btn small primary" data-claim-in="' + esc(c.id) + '">Sign in to claim</button>';
    return conMine(c) ? '<button type="button" class="btn small" data-unclaim="' + esc(c.id) + '">Unclaim</button>' : '<button type="button" class="btn small primary" data-claim="' + esc(c.id) + '">Claim</button>';
  }
  function conClaimWire() {
    $$("[data-claim-in]").forEach(function (b) { b.addEventListener("click", function () { siStart().then(function () { if (currentView === "contribute") drawContribute(); }); }); });
    $$("[data-claim], [data-unclaim]").forEach(function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-claim") || b.getAttribute("data-unclaim"), un = b.hasAttribute("data-unclaim");
        var go = function () {
          b.disabled = true; b.textContent = un ? "Leaving…" : "Verifying with GitHub…";
          fetch(siRelay() + (un ? "/unclaim" : "/claim") + "?c=" + encodeURIComponent(id), { method: "POST", headers: { Authorization: "Bearer " + SI.token }, cache: "no-store" })
            .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || "HTTP " + r.status); return j; }); })
            .then(function (j) { conClaims[id] = j.claims; conFresh = un ? "" : id; status(un ? "Claim left" : "Claimed " + id); blip("go"); drawContribute(); conFresh = ""; },
              function (e) { b.disabled = false; b.textContent = un ? "Unclaim" : "Claim"; status(e.message); hpModal({ kicker: "Contract " + id, title: "Not claimed", tone: "danger", html: "<p>" + esc(e.message) + "</p>", actions: [{ label: "OK", primary: true }] }); });
        };
        if (un) hpConfirm("Leave contract " + id + "?", "Your name comes off its contributors. Post a short handoff note on the issue if you started work.", "Unclaim", "Keep it", "danger").then(function (y) { if (y) go(); });
        else go();
      });
    });
  }
  function viewContribute() {
    var v = $("#view");
    v.innerHTML = shell("Contract network", "Contribute", loading("Loading the contract board"));
    cardsAnim = true;
    Promise.all([loadContracts(), loadLocal("contracts"), conLoadClaims()]).then(function () { if (currentView === "contribute") drawContribute(); refreshInfo(); });
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
      var st = c.blocked && c.status === "open" ? "blocked" : c.status;
      if ((st === "planned" || st === "open") && (conClaims[c.id] || []).length) st = "claimed";
      var S = STATUS[st] || ["", st];
      var action = "";
      if (c.live) action = (st !== "done" ? conClaimBtn(c) : "") +
        '<a class="btn small" href="' + esc(c.url) + '" target="_blank" rel="noopener noreferrer">View on GitHub</a>';
      else action = conClaimBtn(c);
      var done = st === "done";
      return '<article class="kc st-' + esc(st) + " d-" + esc(c.difficulty || "none") + '" style="--i:' + n + '">' +
        '<div class="kc-top"><span class="kc-id">' + esc(c.id) + '</span><span class="kc-st">' + S[0] + " " + S[1] + (c.by && c.by.length > 1 && !done ? " · " + c.by.length : "") + "</span></div>" +
        "<h3>" + esc(c.title) + "</h3>" +
        conPeople(c, done) +
        '<div class="kc-tags">' + diffPill(c) + (c.module ? '<span class="pill mod">' + esc(MODULES[c.module] || c.module) + "</span>" : "") + "</div>" +
        (done
          ? '<div class="kc-stamp">Completed' + (c.completed ? " · " + esc(fmtDate(c.completed)) : "") + "</div>" + (c.live ? '<div class="actions">' + action + "</div>" : "")
          : (c.depends && c.depends.length ? '<div class="meta' + (c.blocked ? " blocked" : "") + '">' + (c.blocked ? "Waiting for " : "After ") + esc(c.depends.join(", ")) + "</div>" : "") +
            (c.goal ? '<p class="goal">' + esc(c.goal) + "</p>" : "") +
            ((c.acceptance && c.acceptance.length) || c.deliverable ? '<details class="spec"><summary><span>Done when</span><i aria-hidden="true">' + (c.acceptance ? c.acceptance.length : 0) + "</i></summary>" +
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
      '<div class="conbar"><div class="tabs" role="tablist">' + [["board", "Contract board"], ["ranks", "Contractor grades"]].map(function (t) {
        return '<button role="tab" data-tab="' + t[0] + '" aria-selected="' + (conTab === t[0]) + '">' + t[1] + "</button>";
      }).join("") + "</div>" +
      '<div class="howbox"><a class="btn howbtn" href="#/guides/hp-gde-019">How it works</a><small>The contribution guidelines, in the Handbook</small></div>' +
      '<div class="conupd">' + conUpdated(live) + "</div></div>" +
      '<div id="ctab"></div>';
    var tabHtml = {
      board:
        (live ? "" : '<p class="note">This is the plan. Version 0.1 is being built by the project lead, and contracts open to the Contractor Department after 0.1. Testers are welcome now: join the Discord. Not sure you can help? <a href="#/guides/hp-gde-017">Can I Contribute?</a></p>') +
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
        (ops.length ? '<div class="tw"><table><tr><th>Contractor</th><th>Contracts</th><th>Grade</th>' + FIELDS.map(function (f) { return "<th>" + esc(f[1]) + "</th>"; }).join("") + "</tr>" + ops.map(function (u) {
          return '<tr><td><a href="https://github.com/' + encodeURIComponent(u.login) + '" target="_blank" rel="noopener noreferrer">' + esc(u.login) + '</a></td><td class="num">' + u.n + "</td><td><b>" + esc(u.best ? u.best[0] : "–") + "</b></td>" +
            FIELDS.map(function (f) { var g = gradeFor(u.f[f[0]] || 0); return '<td class="num">' + (g ? esc(g[0]) : "–") + "</td>"; }).join("") + "</tr>";
        }).join("") + "</table></div>" : '<div class="empty">No completed contracts yet<small>Contractors appear here when contracts are closed on GitHub.</small></div>')
    };
    if (!tabHtml[conTab]) conTab = "board";
    $("#ctab").innerHTML = tabHtml[conTab];
    cardsAnim = false;
    $$('[data-tab]').forEach(function (b) { b.addEventListener("click", function () { conTab = b.dataset.tab; drawContribute(); }); });
    conClaimWire();
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

  /* ---------------- Documentation ----------------
     The Docs section is the dossier cabinet (17b-cabinet.js). loadDoc reads a document from the bundled copy,
     the deployed site or GitHub. */
  function viewDocs(id) { return viewCabinet(id); }
  /* Documentation has two zones: the Library (plans, decisions, research…) and the Handbook (guides, policies, procedures) */
  function docZones(active) {
    var all = (data.docs && data.docs.docs) || [], hb = ((data.guides && data.guides.guides) || []).length || all.filter(function (d) { return d.group === "Handbook"; }).length;
    var lib = all.filter(function (d) { return d.group !== "Handbook"; }).length;
    function z(id, href, name, sub) {
      return '<a class="zone z-' + id + (active === id ? " on" : "") + '" href="' + href + '"' + (active === id ? ' aria-current="page"' : "") + '><span class="z-ico" aria-hidden="true"></span><b>' + name + "</b><small>" + sub + "</small></a>";
    }
    return '<nav class="zones" aria-label="Documentation zones">' +
      z("lib", "#/docs", "Library", (lib ? lib + " documents · " : "") + "plans, decisions, research, technical and legal") +
      z("hb", "#/guides", "Handbook", (hb ? hb + " documents · " : "") + "guides, policies and procedures, printable on A4") + "</nav>";
  }
  function addZones(active) { var vh = $(".vh"); if (vh && !$(".zones")) vh.insertAdjacentHTML("afterend", docZones(active)); }
  function loadDoc(doc) {
    if (docCache[doc.path]) return Promise.resolve(docCache[doc.path]);
    if (EMBED && EMBED.content && EMBED.content[doc.path] != null) return Promise.resolve(docCache[doc.path] = EMBED.content[doc.path]);
    var raw = "https://raw.githubusercontent.com/" + cfg.repo + "/" + cfg.branch + "/" + doc.path;
    return fetchText("content/" + doc.path).catch(function () { return fetchText(raw); }).then(function (t) { docCache[doc.path] = t; return t; });
  }

  /* ---------------- Docs: dossier cabinet ----------------
     Every library group is a drawer of folders. Opening a folder lays the document on the desk beside the cabinet:
     a typed page clipped into a kraft folder, with paper and colour that show its class (policy, procedure, guide,
     decision record, research, technical, community, project, legal).
     Search (Ctrl+K or /) filters the folders themselves, Library only: every word must match the file number, the title
     or the text. Matching folders stay in their drawers, best first; arrow keys move between them, Enter opens one, and
     the opened page highlights and scrolls to the first match. */
  var CAB_GROUPS = {
    Handbook: ["HB", "#c9a24a", "#7d5f15"], Decisions: ["ADR", "#e0453f", "#a3352b"], Research: ["RES", "#5aa7d6", "#1d6a8a"],
    Technical: ["TEC", "#f28c28", "#a8560f"], Community: ["COM", "#7fbf8a", "#3b7446"], Project: ["PRJ", "#c9d0d2", "#4d5a60"], Legal: ["LEG", "#b07cd6", "#6e4a96"],
    Staff: ["LV3", "#7fbf8a", "#3b7446"], Leads: ["LV5", "#f28c28", "#a8560f"], Administration: ["LV6", "#a77de0", "#5e3d8f"]
  };
  var CAB_CLASS = { Decisions: ["decision", "Decision record"], Research: ["research", "Research"], Technical: ["technical", "Technical"],
    Community: ["community", "Community"], Project: ["project", "Project"], Legal: ["legal", "Legal"],
    Staff: ["restricted", "Restricted"], Leads: ["restricted", "Restricted"], Administration: ["restricted", "Restricted"] };
  var CAB_ORDER = ["Project", "Handbook", "Decisions", "Research", "Technical", "Community", "Legal", "Staff", "Leads", "Administration"];
  /* Clearance. Everything in the public repository is LV1: anyone can read it. Restricted documents live in private
     repositories, one per clearance (config.signin.areas); GitHub itself decides who can read them (ADR 0011, 0017).
     Each restricted area is a drawer: its files when your card and GitHub both allow it, otherwise one locked file. */
  var cabX = {}, cabDocs = [];
  /* Search by name or by content: a small switch under each search box (Library and Handbook) */
  function smSwitch(id, mode) {
    return '<div class="sm" role="group" aria-label="Search by" id="' + id + 'Sm"><span>Search by</span>' +
      [["name", "Name"], ["text", "Content"]].map(function (m) { return '<button type="button" data-sm="' + m[0] + '" aria-pressed="' + (mode === m[0]) + '">' + m[1] + "</button>"; }).join("") + "</div>";
  }
  function smWire(id, on) {
    $$("#" + id + "Sm [data-sm]").forEach(function (b) {
      b.addEventListener("click", function () { $$("#" + id + "Sm [data-sm]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); }); blip(); on(b.getAttribute("data-sm")); });
    });
  }
  function cabLvl() { return siIn() || sgIn() ? siLevel() : 1; }
  function cabSlug(p) { return p.replace(/\.md$/i, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase(); }
  function cabXDocs(onChange) {
    var areas = (cfg.signin && cfg.signin.areas) || [], out = [], lvl = cabLvl(), who = typeof siIn === "function" && siIn() ? SI.user.id : (sgIn() ? "guest" : 0);
    areas.forEach(function (a, i) {
      var need = +String(a.card).slice(2), st = cabX[i];
      if (st && st.who !== who) st = cabX[i] = null;
      var base = { group: a.title, restricted: { area: i, repo: a.repo, card: a.card, need: need } };
      function lock(why) { return [Object.assign({ id: "r" + i + "-restricted", title: a.title + " files", locked: why }, base)]; }
      if (lvl < need) { out = out.concat(lock("level")); return; }
      if (!st) {
        st = cabX[i] = { who: who, state: "loading", docs: [] };
        siArea(a).then(function (paths) {
          st.state = "open";
          st.docs = paths.map(function (pth) { return Object.assign({ id: "r" + i + "-" + cabSlug(pth), title: siTitle(pth), path: pth }, base); });
          if (onChange) onChange();
        }, function () { st.state = "github"; if (onChange) onChange(); });
      }
      if (st.state === "open") out = out.concat(st.docs.length ? st.docs : lock("empty"));
      else if (st.state === "github") out = out.concat(lock("github"));
      else out = out.concat([Object.assign({ id: "r" + i + "-loading", title: "Checking clearance…", locked: "loading" }, base)]);
    });
    return out;
  }
  var cabMode = "name", cabOpen = {}, cabQ = "", cabJump = false, cabHL = null, cabIdx = null, cabIdxP = null, cabSel = 0, cabRes = [];
  function cabGroup(g) { return CAB_GROUPS[g] || ["DOC", "#c9d0d2", "#4d5a60"]; }
  /* File number and plain title: HP-POL-009, ADR-0012, or the group prefix and position */
  function cabCode(d, docs) {
    var m = /^(HP-[A-Z]{3}-\d{3})\s+(.*)$/.exec(d.title);
    if (m) return [m[1], m[2]];
    m = /^(\d{4})\s+(.*)$/.exec(d.title);
    if (m) return ["ADR-" + m[1], m[2]];
    var same = docs.filter(function (x) { return x.group === d.group; }), n = same.indexOf(d) + 1;
    return [cabGroup(d.group)[0] + "-" + (n < 10 ? "0" : "") + n, d.title];
  }
  /* The document's class: the handbook type from its code, otherwise its library group */
  function cabClass(d, code) {
    if (/-POL-/.test(code)) return ["policy", "Policy"];
    if (/-SOP-/.test(code)) return ["procedure", "Procedure"];
    if (/-GDE-/.test(code)) return ["guide", "Guide"];
    return CAB_CLASS[d.group] || ["project", d.group];
  }

  function viewCabinet(id) {
    var v = $("#view");
    if (!$("#cab")) { v.innerHTML = shell("Documentation", "Library", loading("Opening the cabinet")); addZones("lib"); }
    Promise.all([loadLocal("docs"), loadLocal("guides")]).then(function (res) {
      if (currentView !== "docs") return;
      var man = res[0], all = (man && man.docs) || [];
      function xChanged() {
        if (currentView !== "docs" || !$("#cab")) return;
        cabDocs = all.concat(cabXDocs(xChanged)); drawDrawers(cabDocs);
        var want = (location.hash.split("/")[2] || ""), cur = $("#docBody").getAttribute("data-id");
        if (/^r\d+-/.test(want) && cur !== want) { var d2 = cabDocs.filter(function (d) { return d.id === want; })[0]; if (d2) openDossier(d2, cabDocs); else { var ph = cabDocs.filter(function (d) { return d.restricted && d.locked && want.indexOf("r" + d.restricted.area + "-") === 0; })[0]; if (ph) openDossier(ph, cabDocs); } }
      }
      var docs = cabDocs = all.concat(cabXDocs(xChanged));
      var zn = $(".zones"); if (zn) zn.outerHTML = docZones("lib");
      if (!docs.length) { $("#vb").innerHTML = '<div class="empty">No documents<small>data/docs.json could not be loaded.</small></div>'; return; }
      var doc = docs.filter(function (d) { return d.id === id; })[0];
      /* A restricted link before its drawer is read: show that drawer's placeholder until it is */
      if (!doc && /^r\d+-/.test(id || "")) doc = docs.filter(function (d) { return d.restricted && id.indexOf("r" + d.restricted.area + "-") === 0; })[0];
      /* Handbook documents live in the Handbook zone */
      if (doc && doc.group === "Handbook") { location.replace("#/guides/" + doc.id); return; }
      doc = doc || docs.filter(function (d) { return d.group !== "Handbook"; })[0];
      /* One drawer open at a time: the one holding the open document */
      cabOpen = {}; cabOpen[doc.group] = true;
      if (!$("#cab")) {
        $("#vb").innerHTML = '<div class="cab" id="cab"><div class="cab-side">' +
          '<label class="cab-q"><span aria-hidden="true">⌕</span><input id="cq" type="search" placeholder="' + (cabMode === "text" ? "Search inside the Library\'s documents" : "Search the Library: numbers and titles") + '" aria-label="Search the Library" aria-controls="cabDrawers" autocomplete="off" spellcheck="false"><kbd>Ctrl K</kbd><i class="cab-scan" aria-hidden="true"></i></label>' + smSwitch("cab", cabMode) +
          '<div class="cab-count" id="cabCount" aria-live="polite"></div><div class="cab-drawers" id="cabDrawers"></div></div>' +
          '<article class="dossier" id="docBody" tabindex="-1"></article></div>';
        var dw = $("#cabDrawers"); dw.classList.add("first"); setTimeout(function () { dw.classList.remove("first"); }, 1400);
        var q = $("#cq");
        q.value = cabQ;
        q.addEventListener("input", function () { cabQ = q.value; cabSel = 0; cabFind(docs); });
        smWire("cab", function (m) { cabMode = m; cabSel = 0; q.placeholder = m === "text" ? "Search inside the Library's documents" : "Search the Library: numbers and titles"; cabFind(cabDocs); q.focus(); });
        q.addEventListener("keydown", function (e) {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") { if (!cabRes.length) return; e.preventDefault(); cabSel = (cabSel + (e.key === "ArrowDown" ? 1 : -1) + cabRes.length) % cabRes.length; cabMark(true); }
          else if (e.key === "Enter") { var id = cabRes[cabSel]; if (id) { e.preventDefault(); cabGo(id); } }
          else if (e.key === "Escape" && q.value) { e.preventDefault(); e.stopPropagation(); q.value = ""; cabQ = ""; cabFind(docs); }
        });
      }
      drawDrawers(docs, doc.id, true);
      openDossier(doc, docs);
      if (cabQ.trim() && !cabIdx) cabFind(docs);
    });
  }
  /* Query words, lightly stemmed so "appeals" finds "appeal" and "signing" finds "sign" */
  function cabWords() { return cabQ.trim().toLowerCase().split(/\s+/).filter(Boolean).map(function (w) { var s = w.replace(/(ing|ed|es|s)$/, ""); return s.length >= 3 ? s : w; }); }
  function cabRe(words) { return new RegExp("(" + words.map(function (w) { return w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }).join("|") + ")[a-z]*", "ig"); }
  /* A word matches a file number by prefix or by number: "pol 9" finds HP-POL-009, "12" finds ADR-0012 */
  function cabCodeHit(w, code) {
    return code.toLowerCase().split("-").some(function (s) { return s.indexOf(w) === 0 || (/^\d+$/.test(w) && /^\d+$/.test(s) && +s === +w); });
  }
  function cabTitleHit(words, d, code) {
    var t = (code[0] + " " + code[1] + " " + d.group).toLowerCase();
    return words.every(function (w) { return t.indexOf(w) > -1 || cabCodeHit(w, code[0]); });
  }
  /* Which Library folders match the search, with a score: file number and title count most, then headings, then the text.
     Before the text index is ready only numbers and titles are searched; the folders update when it is. */
  function cabMatch(docs) {
    var words = cabWords();
    if (!words.length || cabQ.trim().length < 2) return null;
    var by = {}, whole = cabQ.trim().toLowerCase();
    if (cabIdx && cabMode === "text") cabIdx.forEach(function (e) { by[e.d.id] = e; });
    var out = {};
    docs.forEach(function (d) {
      if (d.group === "Handbook") return;
      var c = cabCode(d, docs), title = (c[0] + " " + c[1] + " " + d.group).toLowerCase(), e = by[d.id], score = 0, inName = true;
      var ok = words.every(function (w) {
        var t = title.indexOf(w) > -1, k = cabCodeHit(w, c[0]), at = e ? e.low.indexOf(w) : -1, n = 0, j = at;
        if (!t && !k) inName = false;
        if (!t && !k && at < 0) return false;
        while (j > -1 && n < 10) { n++; j = e.low.indexOf(w, j + w.length); }
        score += (k ? 30 : 0) + (t ? 20 : 0) + (e && e.hlow.indexOf(w) > -1 ? 6 : 0) + n;
        return true;
      });
      if (!ok) return;
      if (title.indexOf(whole) > -1) score += 25;
      out[d.id] = { score: score, text: !inName };
    });
    return out;
  }
  /* Runs the search: numbers and titles at once, the text as soon as the index is read */
  function cabFind(docs) {
    var cab = $("#cab"), live = !!(cabQ.trim().length >= 2);
    if (!cab) return;
    cab.classList.toggle("searching", live);
    drawDrawers(docs);
    if (live && !cabIdx && cabMode === "text") {
      cab.classList.add("indexing");
      var q = cabQ;
      cabIndex(docs).then(function () { if (currentView !== "docs" || !$("#cab")) return; $("#cab").classList.remove("indexing"); if (cabQ === q) drawDrawers(docs); });
    }
  }
  function drawDrawers(docs, active, follow) {
    var on = $(".fold.on");
    active = active || (on ? on.getAttribute("data-id") : "");
    var words = cabWords(), hits = cabMatch(docs), by = {}, total = 0;
    docs.forEach(function (d) { (by[d.group] = by[d.group] || []).push(d); });
    delete by.Handbook;
    var re = hits ? cabRe(words) : null;
    function hl(t) { return re ? esc(t).replace(re, function (m) { return "<mark>" + m + "</mark>"; }) : esc(t); }
    var groups = CAB_ORDER.filter(function (g) { return by[g]; }).concat(Object.keys(by).filter(function (g) { return CAB_ORDER.indexOf(g) < 0; }));
    /* While searching, the drawer with the best match comes first */
    if (hits) {
      var best = {};
      groups.forEach(function (g) { best[g] = Math.max.apply(null, [0].concat(by[g].map(function (d) { return hits[d.id] ? hits[d.id].score : 0; }))); });
      groups = groups.slice().sort(function (a, b) { return best[b] - best[a]; });
    }
    $("#cabDrawers").innerHTML = groups.map(function (g, gi) {
      var gc = cabGroup(g), list = by[g];
      if (hits) list = list.filter(function (d) { return hits[d.id]; }).sort(function (a, b) { return hits[b.id].score - hits[a.id].score; });
      if (hits && !list.length) return "";
      total += list.length;
      var open = hits ? true : !!cabOpen[g];
      var rx = list[0] && list[0].restricted, rlock = rx && list[0].locked && list[0].locked !== "loading";
      return '<section class="drawer' + (open ? " open" : "") + (rx ? " rx" : "") + (rlock ? " rlock" : "") + '" style="--g:' + gc[1] + "; --d:" + gi + '">' +
        '<button class="dr-head" data-g="' + esc(g) + '" aria-expanded="' + open + '"><span class="dr-handle" aria-hidden="true"></span><b>' + esc(g) + "</b>" + (rx ? '<em class="dr-lv">' + esc(rx.card) + (rlock ? " · locked" : "") + "</em>" : "<small>" + plural(list.length, "file") + "</small>") + '<i aria-hidden="true"></i></button>' +
        '<div class="dr-body"><div class="dr-files">' + list.map(function (d, n) {
          var c = cabCode(d, docs), h = hits && hits[d.id];
          return '<a class="fold' + (d.id === active ? " on" : "") + (h ? " hit" : "") + (d.locked ? " locked" : "") + '" data-id="' + esc(d.id) + '" href="#/docs/' + esc(d.id) + '" style="--k:' + n + "; --tx:" + ((n % 3) * 30) + 'px"><span class="f-tab">' + hl(c[0]) + '</span><span class="f-t">' + hl(c[1]) + "</span>" +
            (h && h.text ? '<span class="f-in">In text</span>' : "") + "</a>";
        }).join("") + "</div></div></section>";
    }).join("") || (hits ? '<div class="cab-none"><b>No match</b>No file in the Library matches every word of “' + esc(cabQ.trim()) + '”.<small>Guides, policies and procedures are searched in the Handbook.</small></div>' : "");
    cabRes = hits ? $$("#cabDrawers .fold").map(function (f) { return f.getAttribute("data-id"); }) : [];
    if (follow && hits && cabRes.indexOf(active) > -1) cabSel = cabRes.indexOf(active);
    if (cabSel >= cabRes.length) cabSel = 0;
    var cnt = $("#cabCount");
    if (cnt) cnt.innerHTML = hits ? '<span class="n">' + plural(total, "file") + '</span> match' + (cabIdx || cabMode !== "text" ? "" : '<span class="cab-wait"> · reading the text…</span>') + '<span class="cab-keys">↑↓ select · ↵ open · Esc clear</span>' : "";
    cabMark(false);
    $$(".fold").forEach(function (f) { f.addEventListener("click", function () { cabJump = true; cabHL = cabWords().length ? cabWords() : null; }); });
    /* Open and close in place, so only that drawer slides */
    $$(".dr-head").forEach(function (b) {
      b.addEventListener("click", function () {
        if (cabRes.length || cabWords().length) return;
        var s = b.parentNode, open = !s.classList.contains("open");
        /* Opening a drawer closes the others */
        if (open) $$("#cabDrawers .drawer.open").forEach(function (o) { o.classList.remove("open"); $(".dr-head", o).setAttribute("aria-expanded", "false"); });
        cabOpen = {}; if (open) cabOpen[b.getAttribute("data-g")] = true;
        s.classList.toggle("open", open); b.setAttribute("aria-expanded", String(open)); blip();
        if (open) { s.classList.add("opening"); setTimeout(function () { s.classList.remove("opening"); }, 1200); }
      });
    });
  }
  /* The clearance line above every document */
  function cabClr(ok, x, need) {
    var card = x ? x.card : "LV1", lv = (typeof KC_LV !== "undefined" && KC_LV[card]) || ["Public", "#8b9599"];
    return '<div class="clr ' + (ok ? "ok" : "no") + '" style="--hk:' + lv[1] + '"><i aria-hidden="true"></i><b>Access ' + (ok ? "granted" : "denied") + "</b><span>" +
      (ok ? esc(card) + " · " + (x ? esc(lv[0]) + " clearance" : "Public") : esc(need || card) + " required") + "</span></div>";
  }
  /* A document you may not open: a greyed-out draft behind an access-denied screen */
  function cabDenied(body, doc, c) {
    var x = doc.restricted, why = doc.locked, signed = typeof siIn === "function" && siIn();
    if (why === "loading") { body.innerHTML = cabClr(true, x).replace("Access granted", "Checking clearance") + loading("Checking your clearance with GitHub"); return; }
    if (why === "empty") { body.innerHTML = cabClr(true, x) + '<div class="empty">No documents here yet<small>' + esc(x.repo) + " is empty.</small></div>"; return; }
    var lines = ""; for (var n = 0; n < 14; n++) lines += '<span style="width:' + (55 + (n * 37) % 40) + '%"></span>';
    var msg = why === "level" ? "LV" + x.need + " clearance required." : why === "github" ? "Your card allows it, but GitHub has not given your account access yet." : "Could not reach GitHub to check your clearance.";
    body.innerHTML = cabClr(false, x, x.card) +
      '<div class="ds-tab"><b>' + esc(c[0]) + "</b>" + esc(doc.group) + '</div><div class="ds-folder denied"><div class="ds-page">' +
      '<header class="ds-head"><span><img src="assets/brand/hound-protocol-mark-light.svg" alt="" width="20" height="20">Hound Protocol</span><span class="ds-class">Restricted · ' + esc(x.card) + "</span></header>" +
      '<div class="ad-draft" aria-hidden="true"><b></b>' + lines + "</div>" +
      '<div class="ad" role="alert"><div class="ad-box"><small>Security</small><strong>Access denied</strong><em>' + esc(msg) + "</em>" +
        "<p>Please contact Administration.</p>" +
        '<div class="ad-act">' + (signed ? "" : '<a class="btn small primary" href="#/profile">Sign in</a>') +
        '<a class="btn small" href="#/guides/hp-gde-009">How clearance works</a><a class="btn small" href="#/team">Contact Administration</a></div></div></div>' +
      "</div></div>";
    body.classList.add("is-denied"); body.classList.remove("in"); void body.offsetWidth; body.classList.add("in");
    blip();
  }
  function openDossier(doc, docs) {
    var body = $("#docBody"), gc = cabGroup(doc.group), c = cabCode(doc, docs), k = cabClass(doc, c[0]);
    $$(".fold").forEach(function (f) { f.classList.toggle("on", f.getAttribute("data-id") === doc.id); });
    body.style.setProperty("--g", gc[1]); body.style.setProperty("--gd", gc[2]);
    body.className = "dossier k-" + k[0];
    body.setAttribute("data-id", doc.id);
    var x = doc.restricted;
    if (x && doc.locked) return cabDenied(body, doc, c);
    body.innerHTML = loading("Opening " + c[0]);
    var src = x ? (docCache["x:" + x.repo + ":" + doc.path] ? Promise.resolve(docCache["x:" + x.repo + ":" + doc.path]) :
      siRead(x.repo, doc.path).then(function (t) { docCache["x:" + x.repo + ":" + doc.path] = t; return t; })) : loadDoc(doc);
    src.then(function (md) {
      if (currentView !== "docs") return;
      var html = markdown(md.replace(/^# .*\n/, "").replace(/^Code: .*\n/, ""), doc.path);
      var url = (cfg.siteUrl || "https://hound-protocol.github.io/Joint-Operations/") + "#/docs/" + doc.id;
      var gh = x ? "https://github.com/" + x.repo + "/blob/HEAD/" + doc.path : repoUrl("/blob/" + cfg.branch + "/" + doc.path);
      var ed = x ? "https://github.com/" + x.repo + "/edit/HEAD/" + doc.path : repoUrl("/edit/" + cfg.branch + "/" + doc.path);
      body.innerHTML = cabClr(true, x) +
        '<div class="ds-tab"><b>' + esc(c[0]) + "</b>" + esc(doc.group) + "</div>" +
        '<div class="ds-folder"><div class="ds-page">' +
          '<span class="ds-clip" aria-hidden="true"></span><span class="ds-holes" aria-hidden="true"></span>' +
          '<header class="ds-head"><span><img src="assets/brand/hound-protocol-mark-light.svg" alt="" width="20" height="20">Hound Protocol</span><span class="ds-class">Class: ' + esc(k[1]) + "</span></header>" +
          '<h1 class="ds-title">' + esc(c[1]) + "</h1>" +
          '<div class="ds-meta"><span>' + esc(c[0]) + " · " + esc(doc.path) + "</span>" +
            '<a href="' + esc(gh) + '" target="_blank" rel="noopener noreferrer">GitHub</a>' +
            '<a href="' + esc(ed) + '" target="_blank" rel="noopener noreferrer">Suggest an edit</a>' +
            (/^HP-/.test(c[0]) ? '<a href="#/guides/' + esc(doc.id) + '">Printable sheet</a>' : "") +
            '<button type="button" class="ds-link" data-url="' + esc(url) + '">Copy link</button></div>' +
          '<div class="sh-body ds-body">' + html + "</div>" +
          '<footer class="ds-foot"><span>' + esc(c[0]) + " · " + esc(k[1]) + " · " + esc(doc.path) + "</span><span>" + (x ? "Restricted to " + esc(x.card) + " and up. Do not copy it to public places." : "Read live from the repository") + "</span></footer>" +
        "</div></div>";
      body.classList.remove("in"); void body.offsetWidth; body.classList.add("in");
      var cl = $(".ds-link", body);
      cl.addEventListener("click", function () {
        var u = cl.getAttribute("data-url");
        (navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(u) : Promise.reject()).then(function () { cl.textContent = "Copied"; status("Link copied"); }, function () { cl.textContent = u; });
      });
      led($("#ledInfo"), doc.title);
      var first = cabHL ? cabHighlight($(".ds-body", body), cabHL) : null;
      cabHL = null;
      if (first && first.scrollIntoView) setTimeout(function () { first.scrollIntoView({ behavior: opts.motion ? "smooth" : "auto", block: "center" }); }, opts.motion ? 260 : 0);
      else if (cabJump && window.innerWidth <= 900 && body.scrollIntoView) body.scrollIntoView({ behavior: opts.motion ? "smooth" : "auto", block: "start" });
      cabJump = false;
    }, function (e) {
      if (currentView !== "docs") return;
      if (x) return cabDenied(body, Object.assign({}, doc, { locked: e && (e.status === 404 || e.status === 403) ? "github" : "offline" }), c);
      body.innerHTML = '<div class="empty">Could not open this document<small><a href="' + repoUrl("/blob/" + cfg.branch + "/" + doc.path) + '" target="_blank" rel="noopener noreferrer">Open it on GitHub</a></small></div>';
    });
  }
  /* Marks every search word in the opened page and returns the first mark */
  function cabHighlight(root, words) {
    /* Only real words: a one- or two-letter word would light up half the page */
    words = (words || []).filter(function (w) { return w.length >= 3; });
    if (!root || !words.length) return null;
    var re = new RegExp("(" + words.map(function (w) { return w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }).join("|") + "[a-z]*)", "ig"), first = null, nodes = [];
    var walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false), n;
    while ((n = walk.nextNode())) if (n.nodeValue.trim() && !/^(SCRIPT|STYLE|MARK)$/.test(n.parentNode.nodeName)) nodes.push(n);
    nodes.forEach(function (t) {
      re.lastIndex = 0;
      if (!re.test(t.nodeValue)) return;
      var frag = document.createDocumentFragment(), parts = t.nodeValue.split(re);
      parts.forEach(function (p, i) {
        if (!p) return;
        if (i % 2) { var m = document.createElement("mark"); m.className = "hl"; m.textContent = p; frag.appendChild(m); if (!first) first = m; }
        else frag.appendChild(document.createTextNode(p));
      });
      t.parentNode.replaceChild(frag, t);
    });
    return first;
  }
  /* The search index: plain text, headings and their positions, built once on the first search */
  function cabIndex(docs) {
    if (cabIdx) return Promise.resolve(cabIdx);
    if (cabIdxP) return cabIdxP;
    return (cabIdxP = Promise.all(docs.filter(function (d) { return d.group !== "Handbook" && !d.restricted; }).map(function (d) { return loadDoc(d).then(function (t) { return [d, t]; }, function () { return [d, ""]; }); })).then(function (all) {
      cabIdx = all.map(function (p) {
        var lines = p[1].split("\n"), heads = [], text = "", pos = [];
        lines.forEach(function (l) {
          var h = /^#{2,4}\s+(.*)$/.exec(l);
          var clean = l.replace(/^#+\s+/, "").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/[*`|>_]+/g, " ").replace(/\s+/g, " ").trim();
          if (h) heads.push({ at: text.length, t: clean });
          if (clean) { pos.push(text.length); text += clean + " "; }
        });
        return { d: p[0], text: text, low: text.toLowerCase(), heads: heads, hlow: heads.map(function (h) { return h.t.toLowerCase(); }).join(" ") };
      });
      return cabIdx;
    }));
  }
  /* The selected result: a ring around that folder */
  function cabMark(scroll) {
    $$("#cabDrawers .fold").forEach(function (f) {
      var on = cabRes.length && f.getAttribute("data-id") === cabRes[cabSel];
      f.classList.toggle("sel", !!on);
      if (on && scroll && f.scrollIntoView) f.scrollIntoView({ block: "nearest", behavior: opts.motion ? "smooth" : "auto" });
    });
  }
  function cabGo(id) {
    if (!id) return;
    cabHL = cabWords(); cabJump = true;
    var to = "#/docs/" + id;
    if (location.hash === to) { route(); return; }
    location.hash = to;
  }
  /* Ctrl+K or / jumps to the search on the Docs page */
  document.addEventListener("keydown", function (e) {
    if (currentView !== "docs") return;
    var tag = (e.target && e.target.tagName) || "", q = $("#cq");
    if (!q) return;
    if (((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) || (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(tag))) { e.preventDefault(); q.focus(); q.select(); }
  });

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
          sw("emblem", "Background logo", "The faint Joint Operations badge behind the menu") +
          sw("ledFx", "LED glow", "Glowing, letter-by-letter status lines") +
          sw("contrast", "High contrast", "Brighter secondary text and lines") +
        "</section>" +
        '<section class="ogroup"><div class="label">Motion and sound</div>' +
          sw("motion", "Animations", "Turn off for a static interface. Off by default if your system asks for reduced motion") +
          sw("sound", "Interface sounds", "Short, quiet tones when selecting and opening sections") +
          '<div class="label">Reading</div>' +
          '<div class="orow"><span>Text size<small>Applies to the whole site</small></span>' + seg("osz", opts.size, [["1", "Normal"], ["1.1", "Large"], ["1.2", "Larger"]], "Text size") + "</div>" +
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
    $("#oclr").addEventListener("click", function () { JO.refresh(); status("GitHub data cleared · reloading"); });
    $("#orst").addEventListener("click", function () { opts = Object.assign({}, DEFAULT_OPTS); store.set(OPT_KEY, opts); applyOpts(); viewOptions(); status("Settings reset"); });
  }

  /* Team */
  function viewTeam() {
    var v = $("#view");
    v.innerHTML = shell("Hound Protocol", "Team", loading("Loading team"));
    Promise.all([loadLocal("team"), loadLocal("records")]).then(function (res) {
      var t = res[0];
      if (currentView !== "team") return;
      t = t || { members: [], seats: [], roles: [], departments: [] };
      var still = !opts.motion;
      $("#vb").innerHTML = '<div class="bf">' +
        '<section class="bf-sec team-brand"><div class="tb-mark">' + BRAND.hpColor + '</div><div><div class="tb-name">Hound Protocol</div><p>A community-focused organization. We build ambitious projects, one of them being <b>Joint Operations</b>.</p></div><div class="tb-mark jo"><img src="assets/brand/joint-operations-mark.svg" alt="Joint Operations"></div></section>' +
        '<section class="bf-sec team-members">' + t.members.map(function (m) {
          return '<article class="member"><div class="portrait"><picture>' +
            (m.still ? '<source srcset="' + esc(m.still) + '" media="(prefers-reduced-motion: reduce)">' : "") +
            '<img src="' + esc(still && m.still ? m.still : m.image) + '" alt="' + esc(m.name) + '" width="168" height="168" loading="lazy"></picture><i class="pc tl"></i><i class="pc br"></i></div>' +
            '<div><div class="m-role">' + esc(m.role) + '</div><h3 class="m-name">' + esc(m.name) + '</h3><p>' + esc(m.bio) + "</p></div></article>";
        }).join("") + "</section>" +
        (t.hierarchy ? teamChain(t) : "") +
        (t.positions ? teamPositions(t.positions) : "") + "</div>";
      revealSections();
      teamRoster();
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
            (n.authority.length ? '<div class="auth">' : '<div class="auth" hidden>') + n.authority.map(function (a) { return '<span class="au ' + a + '" title="' + esc((A[a] || [a, ""])[1]) + '">' + esc((A[a] || [a])[0]) + "</span>"; }).join("") + "</div>" +
            (d && d.units && d.units.length ? '<ul class="chips small">' + d.units.map(function (u) { return "<li>" + esc(u) + "</li>"; }).join("") + "</ul>" : "") +
            '<div class="d-who">' + (n.holders.length ? esc(n.holders.join(" · ")) : "No one yet") + (n.open ? ' <span class="pill warn">' + esc(n.open) + "</span>" : "") + "</div>" + (n.dept === "con" ? activeStrip() : "") + "</article>";
        }).join("") + "</div></div>";
      }).join("") + "</div>" +
      '<div class="auth-key">' + Object.keys(A).map(function (k) { return '<span><i class="au ' + k + '">' + esc(A[k][0]) + "</i>" + esc(A[k][1]) + "</span>"; }).join("") + "</div>" +
      '<p class="source">Authority only flows down, and only in its own kind. Anyone can talk to anyone. See <a href="#/guides/hp-pol-007">HP-POL-007 Chain of Command</a> and <a href="#/docs/departments">departments and grades</a>.</p></section>';
  }

  // Open positions, grouped by department: seats show filled slots; open roles take anyone
  function teamPositions(list) {
    var depts = [];
    list.forEach(function (p) { if (depts.indexOf(p.dept) < 0) depts.push(p.dept); });
    var open = list.reduce(function (n, p) { return n + (p.kind === "seat" && !p.after ? Math.max(0, p.need - p.holders.length) : p.kind === "open" ? 1 : 0); }, 0);
    return '<section class="bf-sec"><div class="label">Positions</div>' +
      '<p class="sub">' + plural(open, "position") + " open now. Seats have a set number of holders; critical seats are filled once there is a playable prototype. Open roles take anyone who wants to help. Ask on Discord or see <a href=\"#/guides/hp-gde-008\">how roles are given</a>.</p>" +
      '<div class="posgrid">' + depts.map(function (d) {
        var rows = list.filter(function (p) { return p.dept === d; });
        return '<section class="posdept"><header><h3>' + esc(d) + "</h3><small>" + plural(rows.length, "position") + "</small></header>" + rows.map(function (p) {
          var state, pips = "";
          if (p.kind === "seat") {
            var free = Math.max(0, p.need - p.holders.length);
            for (var i = 0; i < p.need; i++) pips += '<i class="' + (i < p.holders.length ? "on" : "") + '"></i>';
            state = !free ? '<span class="pill ok">Filled</span>' : p.after === "prototype" ? '<span class="pill" title="Critical seats are filled once there is a playable prototype">After prototype</span>' : '<span class="pill warn">' + free + " open</span>";
          } else state = p.kind === "open" ? '<span class="pill warn">Open</span>' : '<span class="pill">After 0.1</span>';
          return '<div class="pos k-' + esc(p.kind) + '"><div class="pos-main"><b>' + esc(p.title) + "</b><span>" + esc(p.about) + "</span></div>" +
            '<div class="pos-who">' + (p.holders.length ? esc(p.holders.join(", ")) : p.kind === "seat" ? "Vacant" : "Anyone") + (pips ? '<span class="pips" aria-label="' + p.holders.length + " of " + p.need + ' filled">' + pips + "</span>" : "") + "</div>" + state + "</div>";
        }).join("") + "</section>";
      }).join("") + "</div>" +
      '<div class="toolbar" style="margin-top:18px"><a class="btn primary" href="#/contribute">Join the Hound</a><a class="btn" href="#/docs/governance">How seats work</a></div></section>';
  }

  // Contractors active in the last 7 days, from signed contributor records (live from data/records.json)
  function activeStrip() {
    var recs = (data.records && data.records.records) || [], since = Date.now() - 7 * 864e5, seen = {}, list = [];
    recs.slice().reverse().forEach(function (r) {
      var t = Date.parse(r.date); if (isNaN(t) || t < since || seen[r.login]) return;
      seen[r.login] = 1; list.push(r);
    });
    return '<div class="active-strip"><span class="as-k"><i></i>Active this week</span>' + (list.length ? list.map(function (r) {
      return '<a class="as-b" href="#/verify" title="Last delivery ' + esc(r.date) + (r.assisted && r.assisted.length ? ", with " + esc(r.assisted.join(", ")) : "") + '">' + esc(r.name || r.login) + "</a>";
    }).join("") : '<span class="as-none">No deliveries in the last 7 days</span>') + "</div>";
  }

  /* The public roster: every signed card, grouped by clearance, highest first. Cards are checked in the browser
     against the records key; banned accounts (LV0) are kept privately and never listed (docs/guides/HP-SOP-012-bans.md). */
  function teamRoster() {
    Promise.all([loadLocal("staff"), loadLocal("records-key")]).then(function (res) {
      if (currentView !== "team") return;
      var staff = ((res[0] && res[0].staff) || []).filter(function (x) { return x.status === "active"; }), keys = (res[1] && res[1].keys) || [];
      /* The owner holds LV7 by owning the GitHub organization; until a signed card exists, show that card too */
      var oc = (cfg.signin || {}).ownerCard, oid = (cfg.signin || {}).owner;
      if (oc && oid && !staff.some(function (x) { return String(x.github_id) === String(oid); }))
        staff.unshift({ id: "OWNER", login: oc.login, name: oc.name, github_id: oid, card: "LV7", department: oc.department || "Administration", since: "", status: "active", owner: true });
      var by = {}; staff.forEach(function (x) { (by[x.card] = by[x.card] || []).push(x); });
      var lv = ["LV7", "LV6", "LV5", "LV4", "LV3", "LV2"].filter(function (l) { return by[l]; });
      var html = '<section class="bf-sec in roster"><div class="label">Roster</div>' +
        '<p class="sub">Everyone holding a Hound ID card, by clearance. Signed cards are checked against the records key in your browser; the owner holds LV7 by owning the GitHub organization. Prove that someone really holds a card on <a href="#/verify">Verify</a>.</p>' +
        (lv.length ? lv.map(function (l) {
          return '<div class="ro-lv" style="--hk:' + (KC_LV[l] || KC_LV.LV3)[1] + '"><h4><i>' + esc(l) + "</i>" + esc((KC_LV[l] || [""])[0]) + "<small>" + plural(by[l].length, "member") + '</small></h4><div class="hks">' + by[l].map(function (x, n) { return keycard(x, { link: !x.owner, i: n }); }).join("") + "</div></div>";
        }).join("") : '<div class="empty">No signed cards yet<small>The roster fills as the owner issues signed cards (<a href="#/guides/hp-gde-009">how</a>).</small></div>') +
        "</section>";
      $(".bf", $("#vb")).insertAdjacentHTML("beforeend", html);
      var signed = staff.filter(function (x) { return !x.owner; });
      if (keys.length) markVerified(signed, keys);
      $$('.roster [data-rid="OWNER"] .vs').forEach(function (el) { el.innerHTML = '<span class="status done">Owner · GitHub</span>'; });
    });
  }

  /* Verify: signed contributor records and the contributor wall */
  function b64bytes(s) { var b = atob(s), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
  // Same bytes as canonical() in tools/records.py: record without sig, keys sorted, no spaces, UTF-8
  /* The signed bytes: keys sorted at every depth, no spaces, UTF-8, exactly like tools/records.py (json.dumps sort_keys) */
  function canonJSON(v) {
    if (Array.isArray(v)) return "[" + v.map(canonJSON).join(",") + "]";
    if (v && typeof v === "object") return "{" + Object.keys(v).sort().map(function (k) { return JSON.stringify(k) + ":" + canonJSON(v[k]); }).join(",") + "}";
    return JSON.stringify(v);
  }
  function canonicalRecord(r) {
    var body = {}; Object.keys(r).forEach(function (k) { if (k !== "sig") body[k] = r[k]; });
    return new TextEncoder().encode(canonJSON(body));
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
    Promise.all([loadLocal("records"), loadLocal("records-key"), loadLocal("staff"), loadLocal("contracts"), loadLocal("certificates")]).then(function (res) {
      if (currentView !== "verify") return;
      var recs = (res[0] && res[0].records) || [], keys = (res[1] && res[1].keys) || [], staff = (res[2] && res[2].staff) || [];
      var key = keys[keys.length - 1];
      var keyHtml = key
        ? '<div class="tw"><table><tr><th>Key</th><th>Fingerprint</th><th>Owner</th><th>Since</th></tr>' + keys.map(function (k) {
            return "<tr><td>" + esc(k.id) + '</td><td><code>' + esc(k.fingerprint) + "</code>" + "</td><td>" + esc(k.owner) + "</td><td>" + esc(fmtDate(k.added)) + "</td></tr>";
          }).join("") + "</table></div>"
        : '<div class="empty">No signing key published yet<small>The project lead creates it before the first record is issued.</small></div>';
      if (rid && /^HPC-/i.test(rid)) return viewCertificate(rid.toUpperCase(), recs, keys);
      if (rid && /^HND-/i.test(rid)) {
        var sc = staff.filter(function (x) { return x.id.toUpperCase() === rid.toUpperCase(); })[0];
        var specimen = !sc && rid.toUpperCase() === "HND-0000";
        if (!sc && !specimen) { $("#vb").innerHTML = '<div class="empty">No staff card ' + esc(rid) + '<small><a href="#/verify">Back to Verify</a></small></div>'; return; }
        var c = sc || KC_SPECIMEN;
        $("#vb").innerHTML = '<p class="sub"><a href="#/verify">All staff and records</a></p>' +
          '<div class="kc-profile">' + keycard(c, { big: true, specimen: specimen }) +
          '<dl class="kc-facts"><div><dt>GitHub</dt><dd>' + (specimen ? "–" : '<a href="https://github.com/' + encodeURIComponent(c.login) + '" target="_blank" rel="noopener noreferrer">' + esc(c.login) + "</a> · account #" + esc(c.github_id)) + "</dd></div>" +
          (c.discord_id ? "<div><dt>Discord ID</dt><dd>" + esc(c.discord_id) + "</dd></div>" : "") +
          "<div><dt>Owner key</dt><dd>" + (c.ssh_key ? "<code>" + esc(c.ssh_key) + "</code> (pinned)" : "Any SSH signing key on the GitHub account") + "</dd></div>" +
          "<div><dt>Status</dt><dd>" + (c.status === "revoked" ? "Revoked " + esc(fmtDate(c.revoked)) + (c.reason ? " · " + esc(c.reason) : "") : specimen ? "Specimen, not a real card" : "Active") + "</dd></div></dl></div>" +
          '<div class="label">Prove this card</div>' + kcProofHtml(c.id) +
          (specimen ? "" : '<div class="label">Signed data</div><pre class="code">' + esc(JSON.stringify(c, null, 2)) + "</pre>");
        if (sc && sc.status !== "revoked") markVerified([sc], keys);
        kcProofBind(staff, keys);
        return;
      }
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
          return '<a class="op" style="--i:' + n + '" href="https://github.com/' + encodeURIComponent(u.login) + '" target="_blank" rel="noopener noreferrer"><span class="mono">' + esc(grade) + "</span><b>" + esc(u.name || u.login) + "</b><small>Grade " + esc(grade) + " · " + u.n + " contract" + (u.n === 1 ? "" : "s") + (tools[u.login] ? " · with " + esc(tools[u.login].join(", ")) : "") + "</small></a>";
        }).join("") + "</div>" : '<div class="empty">No records yet<small>The wall fills as contracts are completed and signed.</small></div>') +
        (recs.length ? '<div class="label">Records</div><div class="cards">' + recs.slice().reverse().map(recordCard).join("") + "</div>" : "") +
        '<div class="label">Certificates of service</div>' +
        '<p class="sub">A certificate is a signed summary of someone\'s work for the project: every record, grades per field and clearance. Anyone can check it here; the signature breaks if a single line is changed.</p>' +
        (certList().length ? '<div class="cert-list">' + certList().slice().reverse().map(function (c, n) {
          return '<a class="cert-card' + (c.status === "revoked" ? " revoked" : "") + '" style="--i:' + n + "; --hk:" + (KC_LV[c.clearance] || KC_LV.LV3)[1] + '" href="#/verify/' + esc(c.id) + '"><small>' + esc(c.id) + " · " + esc(fmtDate(c.issued)) + "</small><b>" + esc(c.name || c.login) + "</b><span>" + plural(c.records.length, "contract") + " · grade " + esc(c.grade || "–") + " · " + esc(c.clearance) + (c.status === "revoked" ? " · revoked" : "") + "</span></a>";
        }).join("") + "</div>" : '<div class="empty">No certificates issued yet<small>Certificates are issued by the owner from signed records (<a href="#/guides/hp-sop-004">how</a>).</small></div>') +
        '<div class="label">Hound staff</div>' +
        '<p class="sub">Every staff member has a permanent <b class="tint key">Hound ID</b>, tied to their GitHub account number, which never changes even if they rename the account. Check anyone who claims to be staff here.</p>' +
        '<div class="toolbar"><input class="field grow" id="sfind" type="search" placeholder="Hound ID, GitHub name or Discord ID" aria-label="Find staff"><span id="sres"></span></div>' +
        '<div class="hks">' + (staff.length ? staff.map(function (s, n) { return keycard(s, { link: true, i: n }); }).join("") :
          keycard(KC_SPECIMEN, { link: true, specimen: true }) + '<div class="empty">No staff cards issued yet<small>This is a specimen. The owner issues real cards once the signing key exists.</small></div>') + "</div>" +
        '<div class="label">Prove a Hound ID</div>' +
        '<p class="sub">A card can be copied, so it only shows what someone claims. To check that a person really holds a Hound ID, give them a challenge to sign with the SSH key on their GitHub account. You can try it now with any GitHub name.</p>' +
        kcProofHtml("") +
        '<div class="label">Check a record</div>' +
        '<p class="sub">Paste a record someone shared with you.</p>' +
        '<textarea class="field" id="vpaste" rows="5" spellcheck="false" aria-label="Record JSON" placeholder="{&quot;id&quot;: &quot;HP-0001&quot;, ...}"></textarea>' +
        '<div class="toolbar"><button class="btn small primary" id="vcheck">Check</button><span id="vres"></span></div>' +
        '<div class="label">Signing keys</div>' + keyHtml +
        '<p class="source">Source: data/records.json · checked with tools/records.py in CI</p>';
      markVerified(recs, keys);
      markVerified(staff.filter(function (s) { return s.status !== "revoked"; }), keys);
      kcProofBind(staff, keys);
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

  /* ---------------- Certificates of service (ADR 0020) ----------------
     A signed summary of a person's work: every signed record, grades per field, clearance and AI tools credited.
     The page checks the certificate's signature and every record it lists, in the browser, against the records key. */
  var CERT_FIELDS = { code: "Code", re: "Architecture Research", qa: "Testing", design: "Design and web", docs: "Docs and legal" };
  function certList() { return (data.certificates && data.certificates.certificates) || []; }
  function viewCertificate(id, recs, keys) {
    var c = certList().filter(function (x) { return x.id === id; })[0];
    if (!c) { $("#vb").innerHTML = '<div class="empty">No certificate ' + esc(id) + '<small><a href="#/verify">Back to Verify</a></small></div>'; return; }
    var url = (cfg.siteUrl || "https://hound-protocol.github.io/Joint-Operations/") + "#/verify/" + c.id, lv = (KC_LV[c.clearance] || KC_LV.LV3);
    $("#vb").innerHTML = '<p class="sub"><a href="#/verify">All records and certificates</a></p>' +
      '<div class="toolbar sheet-bar"><button class="btn small primary" id="cPrint">Print or save as PDF</button><button class="btn small" id="cLink">Copy link</button></div>' +
      '<article class="cert' + (c.status === "revoked" ? " revoked" : "") + '" style="--hk:' + lv[1] + '" id="cert">' +
        '<header class="cert-head"><img src="assets/brand/hound-protocol-mark-light.svg" alt="" width="54" height="54"><div><b>Hound Protocol</b><span>Certificate of Service</span></div><div class="cert-id"><small>Certificate</small>' + esc(c.id) + "</div></header>" +
        '<p class="cert-lead">This certifies that</p><h2 class="cert-name">' + esc(c.name || c.login) + '</h2><p class="cert-who">GitHub <b>@' + esc(c.login) + "</b> · account #" + esc(c.github_id) + (c.hound_id ? " · Hound ID <b>" + esc(c.hound_id) + "</b>" : "") + "</p>" +
        '<p class="cert-lead">completed the following work for MGSV: Joint Operations, between ' + esc(fmtDate(c.from)) + " and " + esc(fmtDate(c.to)) + ".</p>" +
        '<div class="cert-sum"><div><small>Contracts</small><b>' + c.records.length + "</b></div><div><small>Overall grade</small><b>" + esc(c.grade || "–") + '</b></div><div><small>Clearance</small><b style="color:var(--hk)">' + esc(c.clearance) + "</b></div><div><small>Issued</small><b>" + esc(fmtDate(c.issued)) + "</b></div></div>" +
        '<table class="cert-t"><tr><th>Record</th><th>Contract</th><th>Difficulty</th><th>Date</th><th>Check</th></tr>' + c.records.map(function (r) {
          return '<tr data-cr="' + esc(r.id) + '"><td><a href="#/verify/' + esc(r.id) + '">' + esc(r.id) + "</a></td><td>" + esc(r.contract) + " · " + esc(r.title) + "</td><td>" + esc((DIFF[r.difficulty] || [r.difficulty])[0]) + "</td><td>" + esc(fmtDate(r.date)) + '</td><td class="vs">' + vBadge("wait") + "</td></tr>";
        }).join("") + "</table>" +
        (c.grades ? '<div class="cert-grades">' + Object.keys(c.grades).map(function (f) { return "<span><small>" + esc(CERT_FIELDS[f] || f) + "</small><b>" + esc(c.grades[f]) + "</b><i>" + esc((c.points || {})[f] || 0) + " points</i></span>"; }).join("") + "</div>" : "") +
        (c.assisted && c.assisted.length ? '<p class="cert-note">AI tools credited as the contributor\'s tools: ' + esc(c.assisted.join(", ")) + ".</p>" : "") +
        (c.statement ? '<blockquote class="cert-q">' + esc(c.statement) + "</blockquote>" : "") +
        '<footer class="cert-foot"><div class="cert-seal" aria-hidden="true"><img src="assets/brand/hound-protocol-mark-light.svg" alt=""></div><div><b>Signed with the Hound Protocol records key</b> <code>' + esc(c.key) + '</code><span class="vs" id="cVs">' + vBadge("wait") + "</span>" +
          "<small>Check it at " + esc(url) + ". The signature covers every line above; changing any of it breaks the check.</small></div></footer>" +
        (c.status === "revoked" ? '<span class="hk-void" aria-hidden="true">REVOKED</span>' : "") +
      "</article>";
    verifyRecord(c, keys).then(function (st) { var el = $("#cVs"); if (el) el.innerHTML = c.status === "revoked" ? '<span class="status bad">Revoked ' + esc(fmtDate(c.revoked || "")) + "</span>" : vBadge(st); });
    c.records.forEach(function (x) {
      var r = recs.filter(function (y) { return y.id === x.id; })[0], el = $('[data-cr="' + x.id + '"] .vs');
      if (!r) { if (el) el.innerHTML = vBadge("bad"); return; }
      verifyRecord(r, keys).then(function (st) { if (el) el.innerHTML = vBadge(st); });
    });
    $("#cPrint").addEventListener("click", function () { document.body.classList.add("print-cert"); window.print(); setTimeout(function () { document.body.classList.remove("print-cert"); }, 500); });
    var cl = $("#cLink"); cl.addEventListener("click", function () { (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(function () { cl.textContent = "Copied"; }, function () { window.prompt("Certificate link", url); }); });
    led($("#ledInfo"), c.id);
  }

  /* Guides: the handbook (guides, policies, procedures) as A4 documents */
  /* The type stripe: a band 20% in from the right edge, in the type colour, with the type written along it */
  function typeStripe(type, n) { var w = "<b>" + esc(type) + "</b>", out = ""; for (var k = 0; k < n; k++) out += w; return '<span class="stripe" aria-hidden="true">' + out + "</span>"; }
  var GUIDE_AUD = ["All", "Players", "Contributors", "Quality", "Administration"];
  var guideAud = "All";
  function viewGuides(id) {
    var v = $("#view");
    v.innerHTML = shell("Documentation", "Handbook", loading("Loading the handbook")); addZones("hb");
    Promise.all([loadLocal("guides"), loadLocal("docs")]).then(function (res) {
      if (currentView !== "guides") return;
      var list = (res[0] && res[0].guides) || [];
      if (id) return drawGuide(list, id);
      drawGuideList(list);
    });
  }
  /* Handbook filter: every word must appear (whole or in part) in the code, title, summary, type, audience, owner or text.
     A few everyday words also find their handbook terms, so "ban" finds suspensions and "linux" finds Proton. */
  var guideQ = "", guideMode = "name", guideIdx = null, guideIdxP = null;
  var GUIDE_RELATED = {
    login: ["sign-in", "sign in", "github", "keycard"], signin: ["sign-in", "github"], account: ["security", "two-factor", "github"],
    password: ["security", "two-factor", "passkey"], "2fa": ["two-factor"], hack: ["security", "incident"], leak: ["incident", "secret"],
    ban: ["suspension", "infraction", "moderation"], kick: ["moderation", "suspension"], punish: ["infraction", "suspension"], warn: ["infraction"],
    rule: ["policy", "conduct"], behaviour: ["conduct", "moderation"], behavior: ["conduct", "moderation"], toxic: ["conduct", "moderation"],
    linux: ["proton", "bazzite"], deck: ["proton"], bazzite: ["proton"], install: ["installing", "player guide"], play: ["player"],
    bug: ["report", "triage", "testing"], crash: ["report", "triage"], problem: ["report"], issue: ["report", "issue"],
    test: ["quality", "testing"], qa: ["quality"], pr: ["pull request", "review"], pull: ["pull request"], merge: ["review", "pull request"],
    code: ["contributor", "pull request"], contract: ["contract", "claim"], job: ["contract"], task: ["contract"],
    money: ["funding", "donation"], donate: ["funding", "donation"], pay: ["funding"],
    rank: ["grade"], level: ["grade", "keycard"], clearance: ["keycard"], boss: ["chain of command"], leader: ["chain of command", "lead"],
    join: ["onboarding", "contributor", "discord"], leave: ["offboarding"], quit: ["offboarding"], new: ["quick start", "basics"],
    chat: ["discord"], server: ["discord"], logo: ["brand"], art: ["brand", "media"], license: ["licensing"], copyright: ["licensing", "clean-room"],
    ai: ["ai", "agent"], bot: ["agent"], backup: ["backup", "restore"], version: ["release"], update: ["release"], website: ["website"], site: ["website"]
  };
  function guideWords() {
    return guideQ.trim().toLowerCase().split(/\s+/).filter(Boolean).map(function (w) {
      var stem = w.replace(/(ing|ed|es|s)$/, ""); if (stem.length < 3) stem = w;
      return [w, stem].concat(GUIDE_RELATED[w] || GUIDE_RELATED[stem] || []);
    });
  }
  function guideHay(g) { return [g.code, g.title, g.summary, g.type, g.audience, g.owner, guideIdx && guideMode === "text" ? guideIdx[g.id] || "" : ""].join(" ").toLowerCase(); }
  function guideMatch(g, words) {
    var h = guideHay(g);
    return words.every(function (alts) { return alts.some(function (a) { return h.indexOf(a) > -1 || (a.length > 3 && h.replace(/-/g, " ").indexOf(a) > -1); }); });
  }
  function guideIndex(list) {
    if (guideIdx) return Promise.resolve(guideIdx);
    return guideIdxP || (guideIdxP = Promise.all(list.map(function (g) { return loadDoc({ path: g.path }).then(function (t) { return [g.id, t]; }, function () { return [g.id, ""]; }); })).then(function (all) {
      guideIdx = {}; all.forEach(function (p) { guideIdx[p[0]] = p[1].replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/[*`#|>_]+/g, " ").replace(/\s+/g, " "); }); return guideIdx;
    }));
  }
  function drawGuideList(list) {
    $("#vb").innerHTML =
      '<p class="sub">Everything you need to play, contribute, test and run Hound Protocol, written down. Every document is versioned, owned by a department and printable on A4.</p>' +
      '<div class="hb-tools"><label class="cab-q hb-q"><span aria-hidden="true">⌕</span><input id="hq" type="search" placeholder="' + (guideMode === "text" ? "Filter by what the documents say" : "Filter by name: a word, part of one, or a topic") + '" aria-label="Filter the Handbook" aria-controls="hbList" autocomplete="off" spellcheck="false"><kbd>Ctrl K</kbd><i class="cab-scan" aria-hidden="true"></i></label>' + smSwitch("hb", guideMode) +
      '<div class="tabs" role="tablist">' + GUIDE_AUD.map(function (a) { return '<button role="tab" data-aud="' + a + '" aria-selected="' + (guideAud === a) + '">' + a + "</button>"; }).join("") + "</div></div>" +
      '<div class="cab-count" id="hbCount" aria-live="polite"></div><div class="hb-folders" id="hbFolders"></div><div id="hbList"></div>' +
      '<p class="source">Source: docs/guides/ · index generated by tools/guides_index.py</p>';
    var q = $("#hq");
    q.value = guideQ;
    function needText() { if (guideQ.trim() && !guideIdx && guideMode === "text") { $(".hb-q").classList.add("busy"); var at = guideQ; guideIndex(list).then(function () { var b = $(".hb-q"); if (b) b.classList.remove("busy"); if (currentView === "guides" && guideQ === at && $("#hbList")) drawGuideSheets(list); }); } }
    smWire("hb", function (m) { guideMode = m; q.placeholder = m === "text" ? "Filter by what the documents say" : "Filter by name: a word, part of one, or a topic"; drawGuideSheets(list); needText(); q.focus(); });
    q.addEventListener("input", function () {
      guideQ = q.value; drawGuideSheets(list);
      if (guideQ.trim() && !guideIdx && guideMode === "text") { $(".hb-q").classList.add("busy"); var at = guideQ; guideIndex(list).then(function () { var b = $(".hb-q"); if (b) b.classList.remove("busy"); if (currentView === "guides" && guideQ === at && $("#hbList")) drawGuideSheets(list); }); }
    });
    q.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && q.value) { e.preventDefault(); e.stopPropagation(); q.value = ""; guideQ = ""; drawGuideSheets(list); }
      else if (e.key === "Enter") { var a = $("#hbList .mini"); if (a) { e.preventDefault(); a.click(); } }
    });
    $$("[data-aud]").forEach(function (b) { b.addEventListener("click", function () { guideAud = b.dataset.aud; $$("[data-aud]").forEach(function (x) { x.setAttribute("aria-selected", String(x === b)); }); drawGuideSheets(list); }); });
    drawGuideSheets(list, true);
    if (guideQ.trim() && !guideIdx && guideMode === "text") guideIndex(list).then(function () { if (currentView === "guides" && $("#hbList")) drawGuideSheets(list); });
  }
  function drawGuideSheets(list, fly) {
    var words = guideWords(), filtering = !!words.length;
    var shown = list.filter(function (g) { return (guideAud === "All" || g.audience === guideAud) && (!filtering || guideMatch(g, words)); });
    var re = filtering ? new RegExp("(" + words.map(function (a) { return a[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }).join("|") + ")", "ig") : null;
    function hl(t) { return re ? esc(t).replace(re, "<mark>$1</mark>") : esc(t); }
    var byType = { Guide: [], Policy: [], Procedure: [] };
    shown.forEach(function (g) { (byType[g.type] = byType[g.type] || []).push(g); });
    /* Folders: one per type. The open folder lays its sheets out below; switching folders sends the sheets back in first */
    if (!(byType[guideOpen] || []).length) { var first = HB_FOLDERS.filter(function (f) { return byType[f[0]].length; })[0]; if (first) guideOpen = first[0]; }
    var bar = $("#hbFolders");
    bar.innerHTML = HB_FOLDERS.map(function (f, k) {
      var n = byType[f[0]].length;
      return '<button type="button" class="hbf t-' + f[0].toLowerCase() + (f[0] === guideOpen ? " open" : "") + (n ? "" : " empty") + '" data-t="' + f[0] + '" style="--k:' + k + '" aria-expanded="' + (f[0] === guideOpen) + '"' + (n ? "" : " disabled") + '>' +
        '<span class="hbf-tab">' + esc(f[1]) + '</span><span class="hbf-body"><b>' + n + "</b><small>" + esc(f[2]) + '</small></span><span class="hbf-papers" aria-hidden="true"><i></i><i></i><i></i></span></button>';
    }).join("");
    $$("#hbFolders .hbf").forEach(function (b) { b.addEventListener("click", function () { var t = b.getAttribute("data-t"); if (t !== guideOpen) hbSwitch(list, t); }); });
    var l = byType[guideOpen] || [];
    $("#hbList").innerHTML = (l.length ? '<div class="sheets">' + l.map(function (g, n) {
        return '<a class="mini t-' + esc(g.type.toLowerCase()) + '" style="--i:' + n + '" href="#/guides/' + esc(g.id) + '"><span class="m-top"><b>' + hl(g.code) + "</b><i>v" + esc(g.version) + "</i></span>" +
          '<span class="m-title">' + hl(g.title) + '</span><span class="m-sum">' + hl(g.summary) + "</span>" +
          '<span class="m-foot">' + esc(g.owner) + " Dept</span>" + typeStripe(g.type, 3) + "</a>";
      }).join("") + "</div>" : "") +
      (shown.length ? "" : filtering ? '<div class="cab-none"><b>No match</b>No handbook document matches “' + esc(guideQ.trim()) + '”' + (guideAud !== "All" ? " for " + esc(guideAud) : "") + '.<small>Try fewer words, part of a word, or the All tab.</small></div>' : '<div class="empty">No documents for this audience yet</div>');
    if (fly) hbFly(true);
    $("#hbCount").innerHTML = filtering ? '<span class="n">' + plural(shown.length, "document") + "</span> match" + (guideIdx || guideMode !== "text" ? "" : '<span class="cab-wait"> · reading the text…</span>') + '<span class="cab-keys">↵ open the first · Esc clear</span>' : "";
    $("#hbList").classList.toggle("filtering", filtering);
    $$("#hbList .mini").forEach(function (a) { a.addEventListener("click", function (e) { if (e.ctrlKey || e.metaKey || e.shiftKey || e.button) return; if (hbZoom(a)) e.preventDefault(); }); });
  }
  var HB_FOLDERS = [["Guide", "Guides", "All guides relevant to the Joint Operations Platform"], ["Policy", "Policies", "Rules & Standards"], ["Procedure", "Procedures", "How Joint Operations handles the process"]];
  var guideOpen = "Guide", hbBusy = false;
  /* Sheets fly between the open folder and the grid (Web Animations; without it, they simply appear) */
  function hbFly(out, done) {
    var f = $("#hbFolders .hbf.open"), sheets = $$("#hbList .mini");
    if (!f || !sheets.length || !opts.motion || !sheets[0].animate) { if (done) done(); return; }
    var fr = f.getBoundingClientRect(), fx = fr.left + fr.width / 2, fy = fr.top + fr.height / 2, left = sheets.length;
    sheets.forEach(function (m, i) {
      var r = m.getBoundingClientRect(), dx = fx - (r.left + r.width / 2), dy = fy - (r.top + r.height / 2);
      var away = { transform: "translate(" + dx + "px," + dy + "px) scale(.18) rotate(" + (i % 2 ? 8 : -8) + "deg)", opacity: 0 }, home = { transform: "none", opacity: 1 };
      var a = m.animate(out ? [away, home] : [home, away], { duration: out ? 520 : 320, delay: out ? i * 40 : (sheets.length - 1 - i) * 22, easing: out ? "cubic-bezier(.2,.8,.2,1)" : "cubic-bezier(.5,0,.8,.4)", fill: "both" });
      a.onfinish = function () { if (out) a.cancel(); if (--left === 0 && done) done(); };
    });
  }
  /* Opening a sheet: the others fade, the chosen sheet glides to the middle, the Handbook controls fade, a short pause,
     then the sheet zooms up into the reading view, which grows in from the same spot. */
  var hbZoomIn = false;
  function hbZoom(a) {
    if (!opts.motion || !a.animate || hbBusy) return false;
    hbBusy = true; if (typeof hbpHide === "function") hbpHide(true);
    var href = a.getAttribute("href"), fade = { duration: 320, fill: "forwards", easing: "ease-out" };
    $$("#hbList .mini").forEach(function (m) { if (m !== a) m.animate([{ opacity: 1 }, { opacity: 0, transform: "scale(.96)" }], fade); });
    [".zones", ".hb-tools", "#hbCount", "#hbFolders", "#vb > p.sub", ".vh"].forEach(function (sel) { $$(sel).forEach(function (el) { el.animate([{ opacity: 1 }, { opacity: 0 }], fade); }); });
    var r = a.getBoundingClientRect(), dx = window.innerWidth / 2 - (r.left + r.width / 2), dy = window.innerHeight / 2 - (r.top + r.height / 2);
    a.style.position = "relative"; a.style.zIndex = 5;
    var center = a.animate([{ transform: "none" }, { transform: "translate(" + dx + "px," + dy + "px) scale(1.3)" }], { duration: 560, delay: 120, fill: "forwards", easing: "cubic-bezier(.2,.8,.2,1)" });
    center.onfinish = function () {
      setTimeout(function () {
        var z = a.animate([{ transform: "translate(" + dx + "px," + dy + "px) scale(1.3)", opacity: 1 }, { transform: "translate(" + dx + "px," + dy + "px) scale(3.2)", opacity: 0 }], { duration: 420, fill: "forwards", easing: "cubic-bezier(.5,0,.75,0)" });
        z.onfinish = function () { hbZoomIn = true; hbBusy = false; location.hash = href; };
      }, 500);
    };
    blip();
    return true;
  }
  function hbSwitch(list, t) {
    if (hbBusy) return; hbBusy = true; blip();
    hbFly(false, function () { guideOpen = t; drawGuideSheets(list, true); hbBusy = false; });
  }
  /* Ctrl+K or / jumps to the Handbook filter */
  document.addEventListener("keydown", function (e) {
    if (currentView !== "guides") return;
    var tag = (e.target && e.target.tagName) || "", q = $("#hq");
    if (!q) return;
    if (((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) || (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(tag))) { e.preventDefault(); q.focus(); q.select(); }
  });
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
        cabClr(true, null).replace('class="clr ok"', 'class="clr ok hb-clr"') +
        '<div class="toolbar sheet-bar"><a class="btn small" href="#/guides">Handbook</a><a class="btn small primary" id="gpdf" href="guides/pdf/' + esc(g.code) + '.pdf" download hidden>Download PDF</a><button class="btn small" id="gprint">Print</button>' +
        '<a class="btn small" href="' + esc(repoUrl("/blob/" + cfg.branch + "/" + g.path)) + '" target="_blank" rel="noopener noreferrer">View on GitHub</a></div>' +
        '<article class="sheet t-' + esc(g.type.toLowerCase()) + '" aria-label="' + esc(g.code + " " + g.title) + '">' +
          typeStripe(g.type, 6) +
          '<header class="sh-head"><div class="sh-org"><img src="assets/brand/hound-protocol-mark-light.svg" alt="" width="34" height="34"><span><b>Hound Protocol</b><i>MGSV: Joint Operations</i></span></div>' +
          '<div class="sh-code"><b>' + esc(g.code) + "</b><i>" + esc(g.type) + "</i></div></header>" +
          '<h1 class="sh-title">' + esc(g.title) + "</h1>" +
          '<dl class="sh-meta"><div><dt>Version</dt><dd>' + esc(g.version) + "</dd></div><div><dt>Effective</dt><dd>" + esc(g.effective) + "</dd></div>" +
          "<div><dt>Owner</dt><dd>" + esc(g.owner) + " Dept</dd></div><div><dt>For</dt><dd>" + esc(g.for) + "</dd></div><div><dt>Classification</dt><dd>Public</dd></div></dl>" +
          '<div class="sh-body">' + html + "</div>" +
          '<footer class="sh-foot"><span>' + esc(g.code) + " · v" + esc(g.version) + " · " + esc(g.effective) + '</span><span>Uncontrolled when printed. Current version: ' + esc(url) + "</span></footer>" +
        "</article>";
      $("#gprint").addEventListener("click", function () { printSheet(); });
      if (hbZoomIn) {
        hbZoomIn = false;
        var sh = $("#vb .sheet"), bar = $("#vb .sheet-bar");
        if (sh && sh.animate) sh.animate([{ transform: "scale(.55)", opacity: 0, filter: "blur(3px)" }, { transform: "none", opacity: 1, filter: "none" }], { duration: 520, easing: "cubic-bezier(.2,.8,.2,1)" });
        if (bar && bar.animate) bar.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400, delay: 300, fill: "backwards" });
      }
      /* Opened from a Documentation search: mark the words and scroll to the first */
      if (cabHL) { var hit = cabHighlight($(".sh-body"), cabHL); cabHL = null; if (hit && hit.scrollIntoView) setTimeout(function () { hit.scrollIntoView({ behavior: opts.motion ? "smooth" : "auto", block: "center" }); }, opts.motion ? 260 : 0); }
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

  /* ---------------- Keycards and Hound ID proof ----------------
     A staff card is shown as a keycard: level, department, Hound ID, grade. The card itself is public and can be copied,
     so it proves nothing about who is holding it. The proof is a fresh challenge signed with the holder's SSH signing key:
     the key must be one of the signing keys on the GitHub account the card is tied to (by account number), and if the card
     pins a key fingerprint, it must be that key. Everything is checked in this browser (ADR 0017). */
  var KC_LV = {
    LV0: ["Banned", "#5d6468"], LV1: ["Visitor", "#7d93a6"], LV2: ["Member", "#dfe5e7"], LV3: ["Contractor", "#7fbf8a"], LV4: ["Quality", "#4fb3d9"],
    LV5: ["Development", "#f28c28"], LV6: ["Administration", "#a77de0"], LV7: ["Owner", "#c0141f"]
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
  /* s: a staff card (or a member card from sign-in). o.specimen marks a sample card, o.big the profile size, o.link wraps it
     in a link to the profile. The holder's GitHub picture is shown when the card knows their account; the chip stays if it fails. */
  function kcPhoto(s) { return s.avatar || (s.github_id ? "https://avatars.githubusercontent.com/u/" + encodeURIComponent(s.github_id) + "?s=176&v=4" : ""); }
  function keycard(s, o) {
    o = o || {};
    var lv = KC_LV[s.card] || KC_LV.LV3, n = String(s.card || "LV3").slice(2), revoked = s.status === "revoked", photo = o.specimen ? "" : kcPhoto(s);
    var tag = o.link ? 'a href="#/verify/' + encodeURIComponent(s.id) + '"' : "div";
    return "<" + tag + ' class="hk' + (o.big ? " big" : "") + " hk-l" + esc(n) + (s.guest ? " guest" : "") + (revoked ? " revoked" : "") + (o.specimen ? " specimen" : "") + (photo ? " has-photo" : "") + '" style="--hk:' + lv[1] + "; --i:" + (o.i || 0) + '" data-rid="' + esc(s.id) + '">' +
      '<span class="hk-pat" aria-hidden="true"></span>' + (n === "4" ? '<span class="hk-seal" aria-hidden="true">QA</span>' : "") +
      (photo ? '<span class="hk-photo"><img src="' + esc(photo) + '" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="var c=this.parentNode.parentNode;c.classList.remove(\'has-photo\');this.parentNode.remove()"></span>' : "") +
      '<span class="hk-band"><img src="assets/brand/hound-protocol-mark-light.svg" alt="" width="22" height="22"><span>Hound Protocol<small>Security card · ' + esc(lv[0]) + '</small></span></span>' +
      '<span class="hk-lv" aria-label="Keycard level ' + n + '"><small>LV</small><b class="hk-n">' + esc(n) + "</b></span>" +
      '<span class="hk-chip" aria-hidden="true"></span><img class="hk-wm" src="assets/brand/hound-protocol-mark-light.svg" alt="" aria-hidden="true">' +
      '<span class="hk-who"><b class="hk-v">' + esc(s.name || s.login) + '</b><small class="hk-v">' + esc(s.name ? "@" + s.login : "GitHub #" + s.github_id) + "</small></span>" +
      '<span class="hk-meta"><span><i>Hound ID</i><em class="hk-v">' + esc(s.member ? "Member" : s.id) + '</em></span><span><i>Clearance</i><em class="hk-v">Level ' + esc(n) + '</em></span><span><i>Dept</i><em class="hk-v">' + esc(s.department) + '</em></span><span><i>Grade</i><em class="hk-v">' + esc(o.specimen ? "B" : kcGrade(s.login)) + "</em></span>" + (s.since ? '<span class="k-since"><i>Since</i><em class="hk-v">' + esc(fmtDate(s.since)) + "</em></span>" : "") + "</span>" +
      '<span class="hk-foot">' + kcBars(s.id) + '<span class="vs">' + (o.specimen ? '<span class="status planned">Specimen</span>' : revoked ? '<span class="status bad">Revoked</span>' : s.member ? '<span class="status claimed">Signed in</span>' : vBadge("wait")) + "</span>" + (s.ssh_key ? '<span class="hk-key" title="SSH signing key pinned to this card">KEY</span>' : "") + "</span>" +
      (revoked ? '<span class="hk-void" aria-hidden="true">VOID</span>' : "") +
      (s.guest ? '<span class="hk-guest" aria-hidden="true">Guest pass · 24 h</span>' : "") +
      "</" + (o.link ? "a" : "div") + ">";
  }
  /* The sign-in reveal: the card rises and fades in from below, every credential is scrambled and clears left to right
     into the real text, and the level counts up to the holder's. Played once, right after signing in or opening a pass. */
  var KC_GLYPHS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&@$/<>[]";
  function kcReveal(card) {
    if (!card || !opts.motion || !window.requestAnimationFrame) return;
    card.classList.add("hk-reveal");
    $$(".hk-v", card).forEach(function (el, i) {
      var target = el.textContent, t0 = null, delay = 380 + i * 110, dur = 620;
      el.textContent = target.replace(/\S/g, function () { return KC_GLYPHS[Math.floor(Math.random() * KC_GLYPHS.length)]; });
      el.classList.add("scr");
      (function frame(ts) {
        if (!t0) t0 = ts;
        var p = Math.max(0, (ts - t0 - delay) / dur), out = "";
        for (var k = 0; k < target.length; k++) out += target[k] === " " || k / target.length < p ? target[k] : KC_GLYPHS[Math.floor(Math.random() * KC_GLYPHS.length)];
        el.textContent = out;
        if (p < 1) requestAnimationFrame(frame); else { el.textContent = target; el.classList.remove("scr"); }
      })(0);
    });
    var nEl = $(".hk-n", card), to = nEl ? +nEl.textContent : 0, t1 = null;
    if (nEl && to > 1) (function count(ts) {
      if (!t1) t1 = ts || 0;
      var p = Math.min(1, Math.max(0, ((ts || 0) - t1 - 300) / (180 * to)));
      nEl.textContent = Math.max(1, Math.round(p * to));
      if (p < 1) requestAnimationFrame(count);
    })(0);
    setTimeout(function () { card.classList.remove("hk-reveal"); }, 2200);
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

  /* ---------------- Sign-in with GitHub and the profile (ADR 0017, docs/signin.md) ----------------
     The relay (tools/signin-relay/worker.js) swaps GitHub's one-time sign-in code for a short-lived user token and posts it
     back to this window. The token stays in this tab only (sessionStorage) and can read nothing but the restricted document
     repositories the person's GitHub teams already allow. The keycard comes from the person's signed staff card, matched by
     GitHub account number; anyone else signed in holds a member card (LV2). While config.signin.relay is empty, sign-in is off. */
  var SI_KEY = "hp.signin";
  var SI = null;
  try { SI = JSON.parse(sessionStorage.getItem(SI_KEY) || "null"); } catch (e) { SI = null; }
  function siCfg() { return cfg.signin || {}; }
  function siOn() { return !!siCfg().relay; }
  function siSave() { try { if (SI) sessionStorage.setItem(SI_KEY, JSON.stringify(SI)); else sessionStorage.removeItem(SI_KEY); } catch (e) { /* private mode: the session lives in this page only */ } }
  function siIn() { return !!(SI && SI.token && SI.user && (!SI.exp || SI.exp > Date.now())); }
  /* Guest passes: the owner grants a link that opens LV3 (Staff) for 24 hours. The relay signs and checks the pass and
     reads the Staff documents for the guest; the pass lives in this tab only and cannot be extended here. */
  var SG_KEY = "hp.guest", SG = null;
  try { SG = JSON.parse(sessionStorage.getItem(SG_KEY) || "null"); } catch (e) { SG = null; }
  function sgSave() { try { if (SG) sessionStorage.setItem(SG_KEY, JSON.stringify(SG)); else sessionStorage.removeItem(SG_KEY); } catch (e) { /* this page only */ } }
  function sgIn() { return !!(SG && SG.pass && SG.exp > Date.now()); }
  function siRelay() { return String(siCfg().relay || "").replace(/\/$/, ""); }
  function sgApi(path, raw, pass) {
    if (typeof fetch !== "function") return Promise.reject(new Error("This browser cannot open guest passes"));
    return fetch(siRelay() + path, { headers: { Authorization: "Guest " + (pass || SG.pass) }, cache: "no-store" }).then(function (r) {
      if (r.status === 401 && !pass) { SG = null; sgSave(); siBadge(); }
      if (!r.ok) return r.json().catch(function () { return {}; }).then(function (j) { var e = new Error(j.error || "HTTP " + r.status); e.status = r.status; e.code = j.code; if (j.code === "revoked" && !pass) sgRevoked(); throw e; });
      return raw ? r.text() : r.json();
    });
  }
  /* A revoked pass: tell the guest in a small window, then return them to the signed-out profile */
  function sgRevoked() {
    if ($("#hpModal.revoked")) return;
    SG = null; sgSave(); siBadge();
    var m = hpModal({ kicker: "Hound ID · Guest pass", title: "Your guest pass has been revoked", tone: "danger",
      html: "<p>The owner has ended this guest pass. Restricted documents are closed to you now.</p><p class=\"hm-note\">If you think this is a mistake, ask the person who sent you the link.</p>", actions: [{ label: "OK", primary: true, value: true }] });
    m.el.classList.add("revoked");
    m.result.then(function () { if (currentView === "profile" || currentView === "docs") route(); });
  }
  /* While a guest pass is open, check it now and then, so a revoked pass closes within a minute */
  setInterval(function () { if (sgIn() && !document.hidden) sgApi("/guest/check").catch(function () { /* handled in sgApi */ }); }, 60 * 1000);
  document.addEventListener("visibilitychange", function () { if (!document.hidden && sgIn()) sgApi("/guest/check").catch(function () { /* handled in sgApi */ }); });
  /* LV7 holders (the owner, and any organization owner GitHub confirms) manage guest passes; the relay checks again */
  function siOwner() { if (!siIn()) return false; if (String(SI.user.id) === String(siCfg().owner || "")) return true; var c = siCard(); return !!(c && c.card === "LV7"); }
  /* Reads one restricted file, with the person's own sign-in or, for a guest, through the relay */
  function siRead(repo, path) {
    if (siIn()) return siApi("/repos/" + repo + "/contents/" + path.split("/").map(encodeURIComponent).join("/"), true);
    if (sgIn() && repo === (siCfg().guestRepo || "Hound-Protocol/hp-staff")) return sgApi("/guest/file?path=" + encodeURIComponent(path), true);
    var e = new Error("No access"); e.status = 403; return Promise.reject(e);
  }
  function siApi(path, raw) {
    var h = { Authorization: "Bearer " + SI.token, Accept: raw ? "application/vnd.github.raw+json" : "application/vnd.github+json" };
    if (typeof fetch !== "function") return Promise.reject(new Error("This browser cannot sign in"));
    return fetch("https://api.github.com" + path, { headers: h, cache: "no-store" }).then(function (r) {
      if (r.status === 401) { SI = null; siSave(); siBadge(); }
      if (!r.ok) { var e = new Error("HTTP " + r.status); e.status = r.status; throw e; }
      return raw ? r.text() : r.json();
    });
  }
  function signIn() {
    if (!siOn()) return Promise.reject(new Error("Sign-in is not switched on yet."));
    var relay = siCfg().relay.replace(/\/$/, ""), origin;
    try { origin = new URL(relay).origin; } catch (e) { return Promise.reject(new Error("The sign-in relay address is not valid.")); }
    /* GitHub cannot be shown inside another page, so it opens in the smallest window its sign-in fits in, centered over this one.
       Browsers do not allow a window to be hidden or minimized; once authorized, GitHub answers at once and the window closes by itself. */
    var W = 400, H = 540, L = Math.round((window.screenX || window.screenLeft || 0) + ((window.outerWidth || screen.width) - W) / 2), T = Math.round((window.screenY || window.screenTop || 0) + ((window.outerHeight || screen.height) - H) / 2);
    var w = window.open(relay + "/login", "hpsignin", "width=" + W + ",height=" + H + ",left=" + L + ",top=" + T + ",menubar=no,toolbar=no,location=no,status=no,scrollbars=yes");
    if (!w) return Promise.reject(new Error("Allow pop-ups for this site to sign in."));
    return new Promise(function (ok, fail) {
      var done = false, t;
      function on(e) {
        if (e.origin !== origin || !e.data || !e.data.houndSignin) return;
        done = true; clearInterval(t); window.removeEventListener("message", on);
        var m = e.data.houndSignin;
        if (m.error || !m.token) { var er = new Error(m.error || "Sign-in failed."); er.code = m.code; fail(er); return; }
        SI = { token: m.token, exp: m.expires_in ? Date.now() + m.expires_in * 1000 : 0 };
        siApi("/user").then(function (u) {
          SI.user = { id: u.id, login: u.login, name: u.name || "", avatar: u.avatar_url };
          siSave(); siBadge(); siOrg(); siFresh = Date.now(); ok(SI.user);
        }, function () { SI = null; siSave(); fail(new Error("Could not read your GitHub account.")); });
      }
      window.addEventListener("message", on);
      t = setInterval(function () { if (w.closed && !done) { clearInterval(t); window.removeEventListener("message", on); fail(new Error("The sign-in window was closed.")); } }, 500);
    });
  }
  var siFresh = 0;
  /* The sign-in window: explains the three steps, opens GitHub, waits, and reports back in the site's own design */
  function siStart() {
    var m = hpModal({ kicker: "Hound ID · Sign in", title: "Sign in with GitHub",
      html: '<ol class="hm-steps"><li><b>GitHub opens</b> in a small window in the middle of your screen.</li><li><b>Authorize Hound ID Sign-in</b> the first time. It can only read what your GitHub teams already allow.</li><li><b>Your keycard</b> appears here, at your clearance.</li></ol><p class="hm-note">We never see your password, and nothing about you is stored on a server.</p>',
      actions: [{ label: "Cancel", value: null }, { label: "Continue with GitHub", primary: true, run: go }] });
    function go() {
      m.body('<div class="hm-wait"><span class="spin"></span><b>Waiting for GitHub…</b><small>Finish signing in in the GitHub window. If nothing opened, allow pop-ups for this site.</small></div>');
      m.actions([{ label: "Cancel", value: null }]);
      signIn().then(function () {
        status("Signed in"); blip("go");
        m.body('<div class="hm-ok"><b>Access granted</b><small>Opening your keycard…</small></div>'); m.actions([]);
        setTimeout(function () { m.close(true); if (currentView === "profile") viewProfile(); else location.hash = "#/profile"; }, opts.motion ? 700 : 0);
      }, function (e) {
        if (e.code === "banned") {
          m.el.querySelector(".hm-win").classList.add("hm-danger");
          m.body('<div class="hm-lv0"><span>LV0</span><b>Access revoked</b><small>This GitHub account is banned from Hound Protocol. It cannot sign in, take contracts or join sessions, on any linked account.</small><small>Appeals: <a href="#/guides/hp-sop-011">HP-SOP-011</a>.</small></div>');
          m.actions([{ label: "Close", value: null }]);
          return;
        }
        m.body('<div class="hm-err"><b>Not signed in</b><small>' + esc(e.message) + "</small></div>");
        m.actions([{ label: "Close", value: null }, { label: "Try again", primary: true, run: go }]);
      });
    }
    return m.result;
  }
  function signOut() { SI = null; siSave(); siBadge(); }
  /* Organization owners hold LV7, as GitHub itself reports it (ADR 0011: keycards come from the organization). This needs
     the sign-in app's read-only "Members" permission; without it the check fails quietly and nothing changes. */
  function siOrg() {
    if (!siIn() || (SI.org && SI.org.at > Date.now() - 10 * 60 * 1000)) return;
    var org = siCfg().org || "Hound-Protocol";
    SI.org = { at: Date.now(), role: "" };
    siApi("/user/memberships/orgs/" + encodeURIComponent(org)).then(function (m) {
      SI.org = { at: Date.now(), role: m && m.state === "active" ? m.role : "" }; siSave(); siBadge();
      if (SI.org.role === "admin" && (currentView === "profile" || currentView === "docs")) route();
    }, function () { /* no Members permission yet, or not a member */ });
  }
  /* The person's card: their active staff card, or a member card (LV2) */
  function siCard() {
    if (!siIn()) return sgIn() ? { id: "GUEST", login: "guest", name: "Guest", github_id: 0, avatar: "", card: "LV3", department: "Guest", since: "", status: "active", guest: true, exp: SG.exp } : null;
    var staff = (data.staff && data.staff.staff) || [];
    var s = staff.filter(function (x) { return x.github_id === SI.user.id && x.status === "active"; })[0];
    /* A staff card counts only once its signature checks out against the published records key, so an edited
       staff.json can never raise anyone's clearance. Until then (or if it fails) the holder is a member. */
    if (!s && SI.org && SI.org.role === "admin")
      return { id: "OWNER", login: SI.user.login, name: SI.user.name, github_id: SI.user.id, avatar: SI.user.avatar, card: "LV7", department: "Administration", since: "", status: "active", owner: true };
    if (s) {
      var v = siV[s.id];
      if (!v) siVerify(s);
      else if (v === "ok" || v === "unsupported") return Object.assign({}, s, { avatar: SI.user.avatar, name: s.name || SI.user.name, unchecked: v === "unsupported" });
    }
    return { id: "MEMBER", login: SI.user.login, name: SI.user.name, github_id: SI.user.id, avatar: SI.user.avatar, card: "LV2", department: "Member", since: "", status: "active", member: true };
  }
  var siV = {};
  function siVerify(card) {
    siV[card.id] = "wait";
    loadLocal("records-key").then(function (k) { return verifyRecord(card, (k && k.keys) || []); }).then(function (r) {
      siV[card.id] = r; siBadge();
      if (r === "ok" || r === "unsupported") { if (currentView === "profile" || currentView === "docs") route(); }
    });
  }
  function siLevel() { var c = siCard(); return c ? +String(c.card).slice(2) : 1; }
  /* The badge in the top bar: "Sign in", or the person's level and name */
  function siBadge() {
    var b = $("#siBadge");
    if (!siOn()) { if (b) b.remove(); return; }
    if (!b) {
      var keys = $("#keys"); if (!keys) return;
      keys.insertAdjacentHTML("beforebegin", '<a class="si-badge" id="siBadge" href="#/profile"></a>');
      b = $("#siBadge");
    }
    var c = siCard();
    b.innerHTML = c ? '<i style="--hk:' + (KC_LV[c.card] || KC_LV.LV2)[1] + '">' + esc(c.card) + "</i><span>" + esc(c.guest ? "Guest pass" : c.name || c.login) + "</span>" : "<i>ID</i><span>Sign in</span>";
    b.classList.toggle("guest", !!(c && c.guest));
    b.classList.toggle("in", !!c);
    b.setAttribute("aria-label", c ? "Your profile, " + c.card : "Sign in with GitHub");
  }

  /* ---- Restricted document areas: one private repository per clearance ---- */
  var siTrees = {};
  function siArea(a) {
    if (!siIn()) {
      if (!sgIn() || a.repo !== (siCfg().guestRepo || "Hound-Protocol/hp-staff")) { var e = new Error("No access"); e.status = 403; return Promise.reject(e); }
      var gk = "guest:" + a.repo;
      return siTrees[gk] || (siTrees[gk] = sgApi("/guest/tree").then(function (j) { return j.paths || []; }, function (er) { delete siTrees[gk]; throw er; }));
    }
    if (siTrees[a.repo]) return siTrees[a.repo];
    return (siTrees[a.repo] = siApi("/repos/" + a.repo).then(function (r) {
      return siApi("/repos/" + a.repo + "/git/trees/" + encodeURIComponent(r.default_branch) + "?recursive=1");
    }).then(function (t) {
      return (t.tree || []).filter(function (n) { return n.type === "blob" && /\.md$/i.test(n.path) && !/(^|\/)README\.md$/i.test(n.path); }).map(function (n) { return n.path; });
    }, function (e) { delete siTrees[a.repo]; throw e; }));
  }
  function siTitle(path) { return path.replace(/\.md$/i, "").split("/").pop().replace(/[-_]+/g, " ").replace(/^\w/, function (c) { return c.toUpperCase(); }); }

  function viewProfile() {
    var v = $("#view");
    v.innerHTML = shell("Hound ID", "Profile", loading("Opening your profile"));
    Promise.all([loadLocal("staff"), loadLocal("records"), loadLocal("records-key"), loadLocal("contracts"), loadLocal("certificates")]).then(function (res) {
      if (currentView !== "profile") return;
      var keys = (res[2] && res[2].keys) || [];
      if (!siIn() && !sgIn()) return drawSignedOut();
      var c = siCard(), lvl = siLevel(), areas = siCfg().areas || [];
      $("#vb").innerHTML =
        '<div class="kc-profile">' + keycard(c, { big: true }) +
        '<div class="kc-side">' + (c.guest ? '<dl class="kc-facts"><div><dt>Pass</dt><dd>Guest pass with <b>LV3</b> (Staff) clearance, granted by the owner.</dd></div>' +
          "<div><dt>Expires</dt><dd>" + esc(fmtDate(new Date(c.exp).toISOString().slice(0, 10))) + " at " + esc(new Date(c.exp).toTimeString().slice(0, 5)) + " · " + esc(sgLeft(c.exp)) + " left. It cannot be extended.</dd></div>" +
          "<div><dt>Session</dt><dd>This tab only. Nothing is stored on a server.</dd></div>" +
          '</dl><button type="button" class="si-out" id="siOut"><i aria-hidden="true"></i><span>End guest pass<small>You will need the link again to come back</small></span></button></div></div>' :
        '<dl class="kc-facts"><div><dt>GitHub</dt><dd><a href="https://github.com/' + encodeURIComponent(c.login) + '" target="_blank" rel="noopener noreferrer">' + esc(c.login) + "</a> · account #" + esc(c.github_id) + "</dd></div>" +
          "<div><dt>Card</dt><dd>" + (c.owner ? "Owner card: GitHub confirms you own the Hound-Protocol organization." : c.member ? 'Member card. Staff cards are issued by Administration (<a href="#/guides/hp-gde-009">how</a>).' : '<a href="#/verify/' + esc(c.id) + '">Signed staff card ' + esc(c.id) + "</a>") + "</dd></div>" +
          "<div><dt>Session</dt><dd>" + (SI.exp ? "Signed in until " + esc(new Date(SI.exp).toTimeString().slice(0, 5)) + " in this tab" : "Signed in, in this tab") + "</dd></div>" +
          '</dl><button type="button" class="si-out" id="siOut"><i aria-hidden="true"></i><span>Sign out<small>Ends your Hound ID session in this tab</small></span></button></div></div>') +
        siCerts(c) +
        (siOwner() ? sgPanel() : "") +
        siAccess(lvl, areas) +
        "";
      $("#siOut").addEventListener("click", function () {
        (c.guest ? hpConfirm("End your guest pass?", "You will need the link again to come back, while it is still valid.", "End guest pass", "Stay", "danger")
          : hpConfirm("Are you sure you want to log out?", "Your Hound ID session in this tab ends. You can sign in again at any time.", "Log out", "Stay signed in", "danger")).then(function (yes) {
          if (!yes) return;
          if (c.guest) { SG = null; sgSave(); siBadge(); status("Guest pass ended"); } else { signOut(); status("Signed out"); }
          viewProfile();
        });
      });
      if (siOwner()) sgPanelWire();
      /* Right after signing in (the owner check may redraw the card once, so allow a few seconds) */
      if (siFresh && Date.now() - siFresh < 5000) kcReveal($(".kc-profile .hk")); else siFresh = 0;
      if (keys.length && !c.member && !c.guest && !c.owner) markVerified([c], keys);
      else $$('.kc-profile [data-rid] .vs').forEach(function (el) { el.innerHTML = c.owner ? '<span class="status done">Confirmed by GitHub</span>' : c.guest ? '<span class="status planned">Guest · until ' + esc(new Date(c.exp).toTimeString().slice(0, 5)) + "</span>" : '<span class="status claimed">Signed in</span>'; });
    });
  }
  /* Access granted and access restricted: every level's rights from ADR 0011 (config.signin.access), split at the
     holder's clearance. Restricted document areas show their files inside the level that opens them. */
  function siAccess(lvl, areas) {
    var levels = siCfg().access || [], got = [], not = [];
    levels.forEach(function (L) { (+String(L.card).slice(2) <= lvl ? got : not).push(L); });
    function item(it, open) {
      if (it.area != null) {
        var a = areas[it.area]; if (!a) return "";
        /* Information only: the documents themselves open from the Library */
        return '<li class="ax-doc"><span class="ax-t">' + esc(a.title) + " documents</span></li>";
      }
      return '<li><span class="ax-t">' + esc(it.t) + "</span>" + (it.s ? '<em class="ax-s">' + esc(it.s) + "</em>" : "") + "</li>";
    }
    function group(L, open, n) {
      var lv = KC_LV[L.card] || KC_LV.LV2;
      return '<section class="ax-lv" style="--hk:' + lv[1] + "; --n:" + n + '"><header><i>' + esc(L.card) + "</i><b>" + esc(lv[0]) + "</b>" +
        (open ? "" : "<small>Needs " + esc(L.card) + "</small>") + "</header><ul>" + L.items.map(function (it) { return item(it, open); }).join("") + "</ul></section>";
    }
    var next = not[0];
    return '<div class="ax">' +
      '<div class="ax-col ax-ok"><div class="ax-head"><span class="ax-ico" aria-hidden="true"></span><b>Access granted</b><small>Level ' + lvl + " clearance · " + plural(got.reduce(function (n, L) { return n + L.items.length; }, 0), "right") + "</small></div>" +
        got.slice().reverse().map(function (L, n) { return group(L, true, n); }).join("") + "</div>" +
      '<div class="ax-col ax-no"><div class="ax-head"><span class="ax-ico" aria-hidden="true"></span><b>Access restricted</b><small>' + (not.length ? "Opens with a higher card" : "Nothing: you hold the highest card") + "</small></div>" +
        (not.length ? not.map(function (L, n) { return group(L, false, n); }).join("") : '<p class="sub">Every level is open to you.</p>') +
        (next ? '<p class="ax-how">' + (lvl < 3 ? "A completed contract earns <b>LV3</b>; higher cards come with a department. " : "Higher cards come with a department role. ") + 'How cards are issued: <a href="#/guides/hp-gde-009">Grades, Records and Hound IDs</a>. Not sure where you fit? <a href="#/guides/hp-gde-017">Can I Contribute?</a></p>' : "") + "</div>" +
      "</div>" +
      '<p class="sub ax-note">GitHub decides what you can read in the restricted areas, through your teams; your card shows what your clearance should open. Restricted documents open from the <a href="#/docs">Library</a>. Items marked with a date or <em>Planned</em> arrive with the session browser and the API server (<a href="#/docs/adr-0011">ADR 0011</a>).</p>';
  }
  /* The holder's certificates of service, if any */
  function siCerts(c) {
    var mine = ((data.certificates && data.certificates.certificates) || []).filter(function (x) { return !c.guest && x.github_id === c.github_id; });
    if (!mine.length) return "";
    return '<section class="si-certs"><div class="label">Your certificates</div><div class="cert-list">' + mine.slice().reverse().map(function (x, n) {
      return '<a class="cert-card' + (x.status === "revoked" ? " revoked" : "") + '" style="--i:' + n + "; --hk:" + (KC_LV[x.clearance] || KC_LV.LV3)[1] + '" href="#/verify/' + esc(x.id) + '"><small>' + esc(x.id) + " · " + esc(fmtDate(x.issued)) + "</small><b>Certificate of Service</b><span>" + plural(x.records.length, "contract") + " · grade " + esc(x.grade || "–") + "</span></a>";
    }).join("") + "</div></section>";
  }
  function sgLeft(exp) { var m = Math.max(0, Math.round((exp - Date.now()) / 60000)); return m >= 60 ? Math.floor(m / 60) + " h " + (m % 60) + " min" : m + " min"; }
  /* The owner's guest pass desk: grant a 24-hour LV3 pass and copy its link. The relay checks that the request comes
     from the owner's own GitHub account; this panel only shows for the owner. */
  var SG_ISSUED = "hp.guest.issued";
  function sgIssued() { try { return (JSON.parse(sessionStorage.getItem(SG_ISSUED) || "[]") || []).filter(function (x) { return x.exp > Date.now(); }); } catch (e) { return []; } }
  function sgLink(pass) { return (cfg.siteUrl || "https://hound-protocol.github.io/Joint-Operations/") + "#/guest/" + pass; }
  function sgPanel() {
    var list = sgIssued();
    return '<section class="gp"><header><span class="gp-ico" aria-hidden="true"></span><div><b>Guest passes</b><small>LV7 only · LV3 (Staff) access for 24 hours to whoever has the link. A pass cannot be extended.</small></div>' +
      '<button class="btn primary" id="gpGrant">Grant Guest Pass</button></header><p class="sub" id="gpMsg" aria-live="polite"></p><ul class="gp-list" id="gpList">' + list.map(sgItem).join("") + "</ul></section>";
  }
  function sgItem(x) {
    return '<li><code>' + esc(x.pass.slice(0, 10)) + '…</code><span>Expires ' + esc(new Date(x.exp).toTimeString().slice(0, 5)) + " · " + esc(sgLeft(x.exp)) + ' left</span><button class="btn small" data-gp="' + esc(x.pass) + '">Copy link</button></li>';
  }
  function sgOwnerApi(path, method) {
    return fetch(siRelay() + path, { method: method || "GET", headers: { Authorization: "Bearer " + SI.token }, cache: "no-store" }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) { var e = new Error(j.error || "HTTP " + r.status); e.code = j.code; throw e; } return j; });
    });
  }
  /* The live passes, from the relay: number, expiry, status, and Revoke */
  function sgLoad() {
    var ul = $("#gpList"); if (!ul) return;
    sgOwnerApi("/guest/list").then(function (j) {
      var local = {}; sgIssued().forEach(function (x) { try { local[JSON.parse(atob(x.pass.split(".")[0].replace(/-/g, "+").replace(/_/g, "/"))).n] = x.pass; } catch (e) { /* older pass */ } });
      var ps = j.passes || [], live = ps.filter(function (x) { return !x.expired && !x.revoked; }), old = ps.filter(function (x) { return x.expired || x.revoked; });
      function row(x) {
        var stc = x.revoked ? "rv" : x.expired ? "ex" : "ok", stl = x.revoked ? "Revoked" : x.expired ? "Expired" : "Active";
        return '<li class="' + stc + '"><span class="gp-st">' + stl + '</span><code>Pass ' + esc(x.n) + "</code><span>" +
          (x.expired ? "Ended " + esc(fmtDate(new Date(x.exp).toISOString().slice(0, 10))) + " " + esc(new Date(x.exp).toTimeString().slice(0, 5)) : x.revoked ? "Closed early · would have run until " + esc(new Date(x.exp).toTimeString().slice(0, 5)) : "Expires " + esc(new Date(x.exp).toTimeString().slice(0, 5)) + " · " + esc(sgLeft(x.exp)) + " left") +
          (x.by ? " · by " + esc(x.by) : "") + "</span>" +
          (local[x.n] && stc === "ok" ? '<button class="btn small" data-gp="' + esc(local[x.n]) + '">Copy link</button>' : "") +
          (stc === "ok" ? '<button class="btn small danger" data-rv="' + esc(x.n) + '">Revoke pass</button>' : '<button class="btn small" data-del="' + esc(x.n) + '">Delete</button>') + "</li>";
      }
      ul.innerHTML = '<li class="gp-h"><b>Active</b><span>' + live.length + "</span></li>" + (live.map(row).join("") || '<li class="none"><span>No live guest passes.</span></li>') +
        (old.length ? '<li class="gp-h"><b>Expired and revoked</b><span>' + old.length + ' · records are kept ' + (j.keepDays || 30) + ' days</span><button class="btn small" id="gpPurge">Delete expired</button></li>' + old.map(row).join("") : "");
      sgWireList();
    }, function (e) {
      if (e.code === "no_kv") { $("#gpMsg").textContent = "Passes can be granted. To revoke them instantly, add the GUEST_KV storage to the relay (sign-in setup, section 6)."; ul.innerHTML = sgIssued().map(sgItem).join(""); sgWireList(); }
      else $("#gpMsg").textContent = e instanceof TypeError ? "Could not reach the sign-in relay." : e.message;
    });
  }
  function sgWireList() {
    $$("[data-del]").forEach(function (b) {
      b.onclick = function () {
        var n = b.getAttribute("data-del"); b.disabled = true;
        sgOwnerApi("/guest/delete?n=" + encodeURIComponent(n), "POST").then(function () { status("Pass record deleted"); sgLoad(); }, function (e) { b.disabled = false; $("#gpMsg").textContent = e.message; });
      };
    });
    var pg = $("#gpPurge");
    if (pg) pg.onclick = function () {
      hpConfirm("Delete every expired pass?", "Their records disappear from this list. Live passes are not touched.", "Delete expired", "Cancel", "danger").then(function (y) {
        if (!y) return; pg.disabled = true;
        sgOwnerApi("/guest/purge", "POST").then(function (j) { status(plural(j.deleted || 0, "expired pass") + " deleted"); sgLoad(); }, function (e) { pg.disabled = false; $("#gpMsg").textContent = e.message; });
      });
    };
    $$("[data-gp]").forEach(function (b) { b.onclick = function () { var u = sgLink(b.getAttribute("data-gp")); (navigator.clipboard ? navigator.clipboard.writeText(u) : Promise.reject()).then(function () { b.textContent = "Copied"; status("Guest link copied"); }, function () { window.prompt("Copy the guest link", u); }); }; });
    $$("[data-rv]").forEach(function (b) {
      b.onclick = function () {
        var n = b.getAttribute("data-rv");
        hpConfirm("Revoke guest pass " + n + "?", "Whoever holds this link loses access at once. This cannot be undone.", "Revoke pass", "Keep it", "danger").then(function (yes) {
          if (!yes) return;
          b.disabled = true;
          sgOwnerApi("/guest/revoke?n=" + encodeURIComponent(n), "POST").then(function () { status("Guest pass revoked"); blip("go"); sgLoad(); }, function (e) { b.disabled = false; $("#gpMsg").textContent = e.message; });
        });
      };
    });
  }
  function sgPanelWire() {
    sgLoad();
    var g = $("#gpGrant"); if (!g) return;
    g.addEventListener("click", function () {
      g.disabled = true; $("#gpMsg").textContent = "Asking the relay…";
      fetch(siRelay() + "/guest/grant", { method: "POST", headers: { Authorization: "Bearer " + SI.token }, cache: "no-store" }).then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || "HTTP " + r.status); return j; }); }).then(function (j) {
        var list = sgIssued(); list.unshift({ pass: j.pass, exp: j.exp });
        try { sessionStorage.setItem(SG_ISSUED, JSON.stringify(list.slice(0, 10))); } catch (e) { /* this page only */ }
        $("#gpMsg").textContent = "Pass granted and its link copied. Send it privately; anyone with the link has LV3 until it expires or you revoke it.";
        var u = sgLink(j.pass); if (navigator.clipboard) navigator.clipboard.writeText(u).catch(function () { window.prompt("Copy the guest link", u); }); else window.prompt("Copy the guest link", u);
        sgLoad();
        blip("go");
      }, function (e) { $("#gpMsg").textContent = e instanceof TypeError ? "Could not reach the sign-in relay. If guest passes were just set up, check that the relay runs the current code (sign-in setup, section 6)." : e.message; }).then(function () { g.disabled = false; });
    });
  }
  /* #/guest/PASS: check the pass with the relay, keep it in this tab, then open the profile */
  function viewGuest(pass) {
    var v = $("#view");
    v.innerHTML = shell("Hound ID", "Guest pass", loading("Checking your guest pass"));
    if (!pass || !siOn()) { $("#vb").innerHTML = '<div class="empty">No guest pass in this link</div>'; return; }
    sgApi("/guest/check", false, pass).then(function (j) {
      SG = { pass: pass, exp: j.exp }; sgSave(); siBadge(); siFresh = Date.now(); status("Guest pass accepted"); blip("go");
      location.replace("#/profile");
    }, function (e) {
      if (currentView !== "guest") return;
      $("#vb").innerHTML = '<div class="ad gp-bad"><div class="ad-box"><small>Security</small><strong>Access denied</strong><em>' + esc(e.status === 401 ? "This guest pass is not valid or has expired." : e.message) + "</em><p>Ask the person who sent it for a new one, or contact Administration.</p>" +
        '<div class="ad-act"><a class="btn small" href="#/briefing">About Joint Operations</a><a class="btn small" href="#/guides/hp-gde-015">Using the website</a></div></div></div>';
    });
  }
  function siOpen(a, path) {
    var d = $("#siDoc"); if (!d) return;
    d.hidden = false; d.className = "dossier si-reader k-project"; d.innerHTML = loading("Opening " + path);
    siRead(a.repo, path).then(function (md) {
      d.style.setProperty("--g", (KC_LV[a.card] || KC_LV.LV3)[1]); d.style.setProperty("--gd", "#4d5a60");
      d.innerHTML = '<div class="ds-tab"><b>' + esc(a.card) + "</b>" + esc(a.title) + '</div><div class="ds-folder"><div class="ds-page">' +
        '<header class="ds-head"><span><img src="assets/brand/hound-protocol-mark-light.svg" alt="" width="20" height="20">Hound Protocol</span><span class="ds-class">Restricted · ' + esc(a.card) + "</span></header>" +
        '<h1 class="ds-title">' + esc(siTitle(path)) + '</h1><div class="ds-meta"><span>' + esc(a.repo) + " · " + esc(path) + '</span><a href="https://github.com/' + esc(a.repo) + "/blob/HEAD/" + esc(path) + '" target="_blank" rel="noopener noreferrer">GitHub</a></div>' +
        '<div class="sh-body ds-body">' + markdown(md.replace(/^# .*\n/, ""), path) + '</div><footer class="ds-foot"><span>Restricted to ' + esc(a.card) + " and up. Do not copy it to public places.</span></footer></div></div>";
      d.classList.remove("in"); void d.offsetWidth; d.classList.add("in");
      if (d.scrollIntoView) d.scrollIntoView({ behavior: opts.motion ? "smooth" : "auto", block: "start" });
    }, function () { d.innerHTML = '<div class="empty">Could not open this document</div>'; });
  }
  /* For visitors: every card lined up, with one line on how clearance works */
  var SI_LV_INFO = {
    LV0: "Banned: refused at sign-in, on every linked account.", LV1: "Anyone reading the public website.", LV2: "Signed in with GitHub: your profile and keycard.", LV3: "Contractors: Staff documents, claiming contracts.",
    LV4: "Quality: reviews and testing.", LV5: "Development: Leads documents, site and contract data.", LV6: "Administration: moderation, Administration documents.", LV7: "The owner: everything."
  };
  function siLevelsIntro() {
    var lv = ["LV0", "LV1", "LV2", "LV3", "LV4", "LV5", "LV6", "LV7"];
    return '<section class="si-levels"><div class="label">Clearance levels</div>' +
      '<ol class="si-how"><li><b>Sign in with GitHub</b> and you hold a member card, <b>LV2</b>.</li><li><b>Higher cards are earned:</b> a completed contract brings LV3; LV4 to LV6 come with a department. Each staff card is signed, so it cannot be faked.</li>' +
      '<li><b>GitHub guards the doors:</b> restricted documents live in private repositories that open at their level. A <b>guest pass</b> opens LV3 for 24 hours; banned accounts are <b>LV0</b>.</li></ol>' +
      '<div class="si-lvrow">' + lv.map(function (l, k) {
        var n = +l.slice(2), spec = { id: n > 2 ? "HND-000" + n : ["REVOKED", "VISITOR", "MEMBER"][n], login: "agent", name: "Agent", github_id: 0, card: l, department: (KC_LV[l] || [""])[0], since: "", status: n === 0 ? "revoked" : "active" };
        return '<figure style="--k:' + k + '">' + keycard(spec, { specimen: true }) + "<figcaption><b>" + esc(l) + " · " + esc((KC_LV[l] || [""])[0]) + "</b>" + esc(SI_LV_INFO[l]) + "</figcaption></figure>";
      }).join("") + "</div>" +
      '<p class="sub">Full details: <a href="#/guides/hp-gde-009">Grades, Records and Hound IDs</a> · <a href="#/docs/adr-0011">ADR 0011</a></p></section>';
  }
  function drawSignedOut() {
    var on = siOn();
    $("#vb").innerHTML =
      '<div class="kc-profile">' + keycard(KC_SPECIMEN, { big: true, specimen: true }) +
      '<div class="si-intro"><h3>Sign in with your Hound ID</h3>' +
        "<p>Sign in with GitHub to see your keycard and the documents your clearance opens. Staff get their signed staff card; everyone else gets a member card.</p>" +
        (on ? '<button class="btn primary" id="siGo">Sign in with GitHub</button><p class="sub" id="siMsg">A small GitHub window opens. We never see your password, and nothing is stored on a server.</p>'
            : '<p class="note">Sign-in is not switched on yet.</p>') +
        '<p class="sub">How it works and what is kept: <a href="#/docs/signin">sign-in</a> · <a href="#/docs/privacy">privacy</a></p></div></div>' + siLevelsIntro();
    var go = $("#siGo");
    if (go) go.addEventListener("click", function () {
      siStart();
    });
  }

  /* ---------------- Handbook previews ----------------
     Hovering or focusing any button that links to a Handbook document shows a small preview of that sheet, as wide
     as the button: its code, type, title and summary. The Handbook is the source of truth, so buttons point there. */
  var hbpT = null, HBP_SEL = 'a.btn[href^="#/' + 'guides/hp-"], a.hb-link';
  function hbpFor(el) {
    var m = /#\/guides\/(hp-(?:gde|pol|sop)-\d{3})/.exec(el.getAttribute("href") || "");
    var list = (data.guides && data.guides.guides) || [];
    return m && list.filter(function (g) { return g.id === m[1]; })[0];
  }
  function hbpShow(el) {
    var g = hbpFor(el); if (!g) return;
    hbpHide(true);
    var r = el.getBoundingClientRect(), w = Math.max(r.width, 200);
    document.body.insertAdjacentHTML("beforeend", '<div class="hbp t-' + esc(g.type.toLowerCase()) + '" id="hbp" role="tooltip"><span class="hbp-top"><b>' + esc(g.code) + "</b><i>" + esc(g.type) + " · v" + esc(g.version) + '</i></span><span class="hbp-t">' + esc(g.title) + '</span><span class="hbp-s">' + esc(g.summary) + '</span><span class="hbp-go">Open in the Handbook →</span></div>');
    var p = $("#hbp"), left = Math.min(Math.max(8, r.left + r.width / 2 - w / 2), window.innerWidth - w - 8), below = r.bottom + 10 + 170 < window.innerHeight;
    p.style.width = w + "px"; p.style.left = left + "px";
    if (below) p.style.top = (r.bottom + 8) + "px"; else { p.style.top = (r.top - 8) + "px"; p.classList.add("up"); }
  }
  function hbpHide(now) { clearTimeout(hbpT); var p = $("#hbp"); if (!p) return; if (now || !opts.motion) { p.remove(); return; } p.classList.add("out"); setTimeout(function () { if (p.parentNode) p.remove(); }, 160); }
  function hbpTarget(e) { var t = e.target && e.target.closest ? e.target.closest(HBP_SEL) : null; return t && hbpFor(t) ? t : null; }
  document.addEventListener("mouseover", function (e) { var t = hbpTarget(e); if (!t) return; clearTimeout(hbpT); hbpT = setTimeout(function () { hbpShow(t); }, 180); });
  document.addEventListener("mouseout", function (e) { if (hbpTarget(e)) { clearTimeout(hbpT); hbpHide(); } });
  document.addEventListener("focusin", function (e) { var t = hbpTarget(e); if (t) hbpShow(t); });
  document.addEventListener("focusout", function (e) { if (hbpTarget(e)) hbpHide(); });
  window.addEventListener("hashchange", function () { hbpHide(true); });
  document.addEventListener("scroll", function () { hbpHide(true); }, true);

  /* ---------------- Router ---------------- */
  var VIEWS = { briefing: viewBriefing, roadmap: viewRoadmap, team: viewTeam, devlog: viewDevlog, download: viewDownload, sessions: viewSessions, contribute: viewContribute, verify: viewVerify, profile: viewProfile, guest: viewGuest, guides: viewGuides, mods: viewMods, docs: viewDocs, options: viewOptions };
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
      bootDone();
      return;
    }
    var same = currentView === name;
    currentView = name; lastView = name;
    menu.hidden = true; view.hidden = false; document.body.classList.add("in-view");
    view.dataset.v = name;
    if (!same || name !== "docs") { view.innerHTML = ""; var ce = $("#center"); ce.style.scrollBehavior = "auto"; ce.scrollTop = 0; ce.style.scrollBehavior = ""; }
    var item = ITEMS.filter(function (i) { return i.id === name; })[0] || ({ verify: { title: "Verify" }, guides: { title: "Handbook" }, profile: { title: "Profile" } })[name];
    led($("#ledInfo"), item ? item.title : "");
    document.title = (item ? item.title + " · " : "") + cfg.project;
    VIEWS[name](parts[1]);
    if (!same) readyView();
    var tab = $('.secbar a[aria-current="page"]');
    if (tab) { var bar = tab.parentNode; bar.scrollLeft = Math.max(0, tab.offsetLeft - (bar.clientWidth - tab.offsetWidth) / 2); }
  }
  var lastView = "";

  /* ---------------- Ready, then reveal ----------------
     A page stays hidden behind a thin loading line until its content is in place: the loading placeholder has been
     replaced, web fonts are ready and the images inside have loaded (or 2.5 s have passed). Then it fades in at once,
     so nothing pops in piece by piece. The first screen after a cold start is revealed the same way. */
  var readyObs = null, readyTimer = 0;
  function waitAssets(root) {
    var imgs = Array.prototype.slice.call(root.querySelectorAll("img")).filter(function (i) { return !i.complete && i.loading !== "lazy"; });
    var fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    var all = Promise.all([fonts].concat(imgs.map(function (i) { return new Promise(function (ok) { i.addEventListener("load", ok); i.addEventListener("error", ok); }); })));
    return Promise.race([all, new Promise(function (ok) { setTimeout(ok, 2500); })]);
  }
  function readyView() {
    var view = $("#view");
    if (!view) return;
    if (readyObs) { readyObs.disconnect(); readyObs = null; }
    clearTimeout(readyTimer);
    view.classList.remove("vw-ready"); view.classList.add("vw-wait");
    var done = false, waiting = false;
    function reveal() {
      if (done) return; done = true;
      if (readyObs) { readyObs.disconnect(); readyObs = null; }
      clearTimeout(readyTimer);
      requestAnimationFrame(function () { view.classList.remove("vw-wait"); view.classList.add("vw-ready"); bootDone(); });
    }
    function check() {
      if (done || waiting) return;
      var vb = $("#vb");
      if (!vb || !vb.children.length || $(".spin", vb)) return;
      waiting = true;
      waitAssets(vb).then(reveal);
    }
    if (window.MutationObserver) { readyObs = new MutationObserver(check); readyObs.observe(view, { childList: true, subtree: true }); }
    readyTimer = setTimeout(reveal, 4000);
    check();
  }
  /* The whole interface fades in once, after the config, the first screen and the fonts are ready */
  var booting = true;
  function bootDone() {
    if (!booting) return;
    booting = false;
    var fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    Promise.race([fonts, new Promise(function (ok) { setTimeout(ok, 1500); })]).then(function () {
      requestAnimationFrame(function () { document.documentElement.classList.remove("booting"); });
    });
  }

  /* ---------------- New version announcement ----------------
     Every few minutes, and when the tab comes back into view, the site asks the server for its build number. When a newer
     release is live, a small notice slides in at the top and offers to reload. "Later" hides it until the next release. */
  var upSeen = "", upLast = 0;
  function upCheck() {
    if (EMBED || location.protocol === "file:" || !data.build || !data.build.sha || typeof fetch !== "function") return;
    upLast = Date.now();
    fetch("data/build.json?t=" + Date.now(), { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : null; }).then(function (b) {
      if (!b || !b.sha || b.sha === data.build.sha || b.sha === upSeen) return;
      return fetch("data/config.json?t=" + Date.now(), { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : {}; }, function () { return {}; }).then(function (c) { upShow(b, c.version); });
    }, function () { /* offline: try again later */ });
  }
  function upShow(b, version) {
    if ($("#upNote")) return;
    document.body.insertAdjacentHTML("beforeend", '<div class="up-note" id="upNote" role="status"><i aria-hidden="true"></i><b>Update available</b><span>' +
      esc("Build " + (version || "") + (b.build ? "." + b.build : "")) + ' is live</span>' +
      '<button class="up-go" id="upGo">Reload</button><button class="up-x" id="upLater" aria-label="Later">✕</button></div>');
    blip();
    $("#upGo").addEventListener("click", function () { location.reload(); });
    $("#upLater").addEventListener("click", function () { upSeen = b.sha; var n = $("#upNote"); n.classList.add("out"); setTimeout(function () { n.remove(); }, 400); });
  }
  setInterval(upCheck, 5 * 60 * 1000);
  document.addEventListener("visibilitychange", function () { if (!document.hidden && Date.now() - upLast > 60 * 1000) upCheck(); });

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

  /* ---------------- Hooks ---------------- */
  window.JO = {
    env: ENV,
    setServers: function (list) { data.servers = { servers: Array.isArray(list) ? list : [] }; data.serversHooked = true; if (currentView === "sessions") drawSessions(); refreshInfo(); },
    setMods: function (m) { data.mods = { compatible: (m && m.compatible) || [], issues: (m && m.issues) || [] }; if (currentView === "mods") drawMods(); refreshInfo(); },
    setDevlog: function (list) { data.devlog = { entries: Array.isArray(list) ? list : [] }; if (currentView === "devlog") drawDevlog(); refreshInfo(); },
    docsView: function () { var f = document.querySelector(".fold.on"); return { mode: "cabinet", open: f ? f.getAttribute("data-id") : "", drawers: document.querySelectorAll(".drawer").length }; },
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
    loadLocal("staff").then(function () { siBadge(); });
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
    loadLocal("build").then(function () { applyConfig(); siBadge(); siOrg(); renderMenu(); select(cur, false); route(); preload(); });
  });
  window.addEventListener("hashchange", route);
})();
