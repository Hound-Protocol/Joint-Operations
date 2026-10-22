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
