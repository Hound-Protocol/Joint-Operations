/* Hound Protocol sign-in relay (Cloudflare Worker). See docs/signin.md.
   1. Sign-in: swaps GitHub's one-time sign-in code for a user token, using the app secret that only it holds, and hands
      the token to the website window that asked for it.
   2. Guest passes: LV7 (checked against GitHub on every request) mints a pass that lasts
      24 hours. Whoever holds the pass can read the Staff documents (LV3) through this relay, which reads them with the
      GitHub App's own short-lived token, limited to that one repository and to reading. The pass is signed here and
      checked here; the browser cannot forge or extend it.
   No storage, no logging of tokens or passes.
   Settings (Worker → Settings → Variables and Secrets):
     GITHUB_CLIENT_ID (text), GITHUB_CLIENT_SECRET (secret), SITE_ORIGIN (text, https://hound-protocol.github.io)
     For guest passes: OWNER_GITHUB_ID (text), GUEST_SECRET (secret, a long random string), GITHUB_APP_ID (text),
     GITHUB_APP_PRIVATE_KEY (secret, the app's .pem file), GUEST_REPO (text, Hound-Protocol/hp-staff)
     For revoking passes: a KV namespace bound as GUEST_KV (Worker → Settings → Bindings → KV namespace). It holds the
     list of live passes (number and expiry only) and the revoked ones, each deleted automatically when the pass expires.
     Guest pass requests: a visitor (LV1) asks for a pass with their name; LV7 approves or declines it on the Profile, and
     the visitor's browser collects the pass by itself. Requests live in one KV record ("asks"), at most 25 open at once,
     and are removed 2 days after they were made. No IP addresses or other details are kept.
     Bans (LV0): BANNED_GITHUB_IDS (secret), the banned GitHub account numbers separated by commas. A banned account is
     refused at sign-in and never receives a token. The list is private; see docs/guides/HP-SOP-012-bans.md. */
/* The relay's version: the website compares it with site/data/config.json signin.relayVersion and tells LV7 when the
   relay is behind (3 = guest pass requests, short passes, clearing live passes, /health) */
const RELAY_VERSION = 3;
const PASS_HOURS = 24, KEEP_DAYS = 30, ASK_MAX_OPEN = 25, ASK_KEEP_MS = 2 * 86400 * 1000;
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const site = env.SITE_ORIGIN;
    /* Health: the relay's version and which storage and settings are present (yes or no only, never their values) */
    if (url.pathname === "/health") {
      return json(site, { ok: true, relay: RELAY_VERSION, kv: !!(env.HP_KV || env.GUEST_KV), guest: !!(env.GUEST_SECRET && env.OWNER_GITHUB_ID), app: !!(env.GITHUB_APP_ID && env.GITHUB_APP_PRIVATE_KEY) });
    }
    if (url.pathname === "/claims" || url.pathname === "/claim" || url.pathname === "/unclaim") {
      if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(site) });
      try { return await claims(req, env, url); }
      catch (e) { return json(site, { error: "The relay could not finish that (" + (e && e.message || "error") + ")." }, 500); }
    }
    if (url.pathname.startsWith("/guest/")) {
      if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(site) });
      try { return await guest(req, env, url); }
      catch (e) { return json(site, { error: "The relay could not finish that (" + (e && e.message || "error") + ")." }, 500); }
    }
    if (url.pathname === "/login") {
      const state = crypto.randomUUID();
      const gh = new URL("https://github.com/login/oauth/authorize");
      gh.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
      gh.searchParams.set("redirect_uri", url.origin + "/callback");
      gh.searchParams.set("state", state);
      return new Response(null, { status: 302, headers: {
        Location: gh.toString(),
        "Set-Cookie": `hp_state=${state}; Path=/callback; Max-Age=600; HttpOnly; Secure; SameSite=Lax`,
        "Cache-Control": "no-store" } });
    }
    if (url.pathname === "/callback") {
      const code = url.searchParams.get("code"), state = url.searchParams.get("state");
      const cookie = (req.headers.get("Cookie") || "").match(/(?:^|;\s*)hp_state=([^;]+)/);
      if (!code || !state || !cookie || cookie[1] !== state) return page(site, { error: "Sign-in expired or was not started here. Try again." });
      const r = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json", "User-Agent": "hound-protocol-signin" },
        body: JSON.stringify({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET, code, redirect_uri: url.origin + "/callback" })
      });
      const j = await r.json().catch(() => ({}));
      if (!j.access_token) {
        /* GitHub's error code is not secret; showing it makes setup problems easy to diagnose */
        const why = { incorrect_client_credentials: "the relay's client ID or client secret does not match the GitHub App",
          bad_verification_code: "the sign-in code expired or was already used", redirect_uri_mismatch: "the GitHub App's callback URL does not match this relay" }[j.error];
        if (!env.GITHUB_CLIENT_SECRET) return page(site, { error: "The relay has no GITHUB_CLIENT_SECRET setting (code: missing_secret)." });
        return page(site, { error: "GitHub did not accept the sign-in" + (why ? ": " + why : "") + ". (code: " + (j.error || "http_" + r.status) + ")" });
      }
      /* LV0: refuse banned GitHub accounts before they ever get a token. GitHub account numbers survive renames. */
      if (env.BANNED_GITHUB_IDS) {
        const u = await fetch("https://api.github.com/user", { headers: { Authorization: "Bearer " + j.access_token, Accept: "application/vnd.github+json", "User-Agent": "hound-protocol-signin" } });
        const who = u.ok ? await u.json() : null;
        const banned = String(env.BANNED_GITHUB_IDS).split(/[\s,]+/).filter(Boolean);
        if (!who || banned.indexOf(String(who.id)) > -1) return page(site, { error: who ? "This GitHub account is banned from Hound Protocol." : "Could not check your GitHub account. Try again.", code: who ? "banned" : "check_failed" });
      }
      return page(site, { token: j.access_token, expires_in: j.expires_in || 0 });
    }
    return new Response("Hound Protocol sign-in relay", { status: 200, headers: { "Content-Type": "text/plain" } });
  }
};

/* ---------------- Contract claims ----------------
   Anyone signed in with GitHub (and not banned) can claim a contract from the website. GitHub tells the relay who is
   asking, so a claim always carries the real account. Claims are public: contract, GitHub name and number, time. */
async function claims(req, env, url) {
  const site = env.SITE_ORIGIN, kv = env.HP_KV || env.GUEST_KV;
  if (!kv) return json(site, { error: "Claims need the KV storage on the relay (sign-in setup, section 6).", code: "no_kv" }, 503);
  if (url.pathname === "/claims") {
    const keys = (await kv.list({ prefix: "claim:" })).keys, out = {};
    for (const k of keys) { const v = await kv.get(k.name, "json"); if (v && v.length) out[k.name.slice(6)] = v; }
    return json(site, { claims: out });
  }
  if (req.method !== "POST") return json(site, { error: "Use POST." }, 405);
  const m = /^Bearer\s+(\S+)$/.exec(req.headers.get("Authorization") || "");
  if (!m) return json(site, { error: "Sign in first." }, 401);
  const c = String(url.searchParams.get("c") || "").toUpperCase();
  if (!/^[CF]\d{2,3}$/.test(c)) return json(site, { error: "Unknown contract." }, 400);
  const u = await fetch("https://api.github.com/user", { headers: { Authorization: "Bearer " + m[1], Accept: "application/vnd.github+json", "User-Agent": "hound-protocol-signin" } });
  if (!u.ok) return json(site, { error: "GitHub did not recognise your sign-in. Sign in again." }, 401);
  const who = await u.json();
  if (String(env.BANNED_GITHUB_IDS || "").split(/[\s,]+/).indexOf(String(who.id)) > -1) return json(site, { error: "This GitHub account is banned from Hound Protocol.", code: "banned" }, 403);
  const key = "claim:" + c, list = (await kv.get(key, "json")) || [];
  const rest = list.filter(x => String(x.id) !== String(who.id));
  const next = url.pathname === "/claim" ? rest.concat([{ login: who.login, id: who.id, at: Date.now() }]) : rest;
  if (next.length) await kv.put(key, JSON.stringify(next)); else await kv.delete(key);
  return json(site, { ok: true, contract: c, claims: next });
}

/* ---------------- Guest passes ---------------- */
/* Signs a new 24-hour LV3 pass and records it (number, expiry, who granted it, and for whom when it answers a request) */
async function mint(env, kv, by, forName) {
  const exp = Date.now() + PASS_HOURS * 3600 * 1000, n = crypto.randomUUID().slice(0, 8);
  /* Short pass (v2): expiry in base 36, pass number, and 16 characters of the relay's signature over both, about 32 characters */
  const e36 = Math.floor(exp / 1000).toString(36);
  /* The record stays 30 days after the pass expires, so LV7 can see expired passes and delete them */
  if (kv) await kv.put("pass:" + n, JSON.stringify(Object.assign({ n, exp, at: Date.now(), by }, forName ? { for: forName } : {})), { expiration: Math.ceil(exp / 1000) + KEEP_DAYS * 86400 });
  return { pass: e36 + "." + n + "." + (await hmac(env.GUEST_SECRET, "v2|" + e36 + "|" + n)).slice(0, 16), exp: Math.floor(exp / 1000) * 1000, n };
}
async function sha(s) { return b64u(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)))); }
async function asksGet(kv) { const a = (await kv.get("asks", "json")) || []; const now = Date.now(); return a.filter(x => now - x.at < ASK_KEEP_MS); }
async function asksPut(kv, a) { await kv.put("asks", JSON.stringify(a)); }
async function guest(req, env, url) {
  const site = env.SITE_ORIGIN, auth = req.headers.get("Authorization") || "";
  if (!env.GUEST_SECRET || !env.OWNER_GITHUB_ID) return json(site, { error: "Guest passes are not set up on the relay yet (code: guest_off)." }, 503);
  /* Visitors (LV1) ask for a pass with their name, then check on it with the key only they received */
  if (url.pathname === "/guest/ask" || url.pathname === "/guest/ask/status") {
    const kv = env.HP_KV || env.GUEST_KV;
    if (!kv) return json(site, { error: "Guest pass requests need the KV storage on the relay (sign-in setup, section 6).", code: "no_kv" }, 503);
    const asks = await asksGet(kv);
    if (url.pathname === "/guest/ask") {
      if (req.method !== "POST") return json(site, { error: "Use POST." }, 405);
      const b = await req.json().catch(() => ({}));
      const name = String(b.name || "").replace(/[\u0000-\u001f\u007f<>]/g, "").replace(/\s+/g, " ").trim();
      if (name.length < 2 || name.length > 40) return json(site, { error: "Write your name (2 to 40 characters), so the owner knows who is asking.", code: "name" }, 400);
      if (asks.filter(x => x.state === "pending").length >= ASK_MAX_OPEN) return json(site, { error: "Too many requests are waiting right now. Try again later.", code: "busy" }, 429);
      const last = asks.reduce((m, x) => Math.max(m, x.at), 0);
      if (Date.now() - last < 3000) return json(site, { error: "Someone just asked. Try again in a few seconds.", code: "busy" }, 429);
      const id = crypto.randomUUID().slice(0, 8), key = crypto.randomUUID();
      asks.push({ id, name, at: Date.now(), kh: await sha(key), state: "pending" });
      await asksPut(kv, asks);
      return json(site, { ok: true, id, key });
    }
    const id = String(url.searchParams.get("id") || ""), key = String(url.searchParams.get("key") || "");
    const a = asks.find(x => x.id === id);
    if (!a || a.kh !== await sha(key)) return json(site, { state: "gone" });
    return json(site, a.state === "approved" ? { state: a.state, pass: a.pass, exp: a.exp } : { state: a.state });
  }
  /* LV7 actions. GitHub tells us who holds the token: the owner's account, or any owner of the organization. */
  if (/^\/guest\/(grant|list|revoke|delete|purge|asks|approve|decline)$/.test(url.pathname)) {
    const m = /^Bearer\s+(\S+)$/.exec(auth);
    if (!m) return json(site, { error: "Sign in first." }, 401);
    const u = await fetch("https://api.github.com/user", { headers: { Authorization: "Bearer " + m[1], Accept: "application/vnd.github+json", "User-Agent": "hound-protocol-signin" } });
    if (!u.ok) return json(site, { error: "GitHub did not recognise your sign-in. Sign in again." }, 401);
    const who = await u.json();
    let lv7 = String(who.id) === String(env.OWNER_GITHUB_ID);
    if (!lv7) {
      const org = env.GITHUB_ORG || "Hound-Protocol";
      const mm = await fetch("https://api.github.com/user/memberships/orgs/" + org, { headers: { Authorization: "Bearer " + m[1], Accept: "application/vnd.github+json", "User-Agent": "hound-protocol-signin" } });
      const ms = mm.ok ? await mm.json() : null;
      lv7 = !!(ms && ms.state === "active" && ms.role === "admin");
    }
    if (!lv7) return json(site, { error: "Only LV7 can manage guest passes." }, 403);
    const kv = env.HP_KV || env.GUEST_KV;
    if (url.pathname === "/guest/grant" && req.method === "POST") {
      const p = await mint(env, kv, who.login);
      return json(site, Object.assign(p, { hours: PASS_HOURS, revocable: !!kv }));
    }
    if (!kv) return json(site, { error: "Revoking needs the GUEST_KV storage on the relay (sign-in setup, section 6).", code: "no_kv" }, 503);
    /* Requests from visitors: list them, approve one (a pass is made for that name) or decline it */
    if (url.pathname === "/guest/asks") {
      const asks = await asksGet(kv);
      return json(site, { asks: asks.map(x => ({ id: x.id, name: x.name, at: x.at, state: x.state, by: x.by || "", n: x.n || "" })).sort((a, b) => b.at - a.at), maxOpen: ASK_MAX_OPEN });
    }
    if ((url.pathname === "/guest/approve" || url.pathname === "/guest/decline") && req.method === "POST") {
      const asks = await asksGet(kv), a = asks.find(x => x.id === String(url.searchParams.get("id") || ""));
      if (!a) return json(site, { error: "That request is gone." }, 404);
      if (a.state !== "pending") return json(site, { error: "That request was already answered." }, 409);
      if (url.pathname === "/guest/approve") { const p = await mint(env, kv, who.login, a.name); Object.assign(a, { state: "approved", pass: p.pass, exp: p.exp, n: p.n }); }
      else a.state = "declined";
      a.by = who.login; a.done = Date.now();
      await asksPut(kv, asks);
      return json(site, { ok: true, id: a.id, state: a.state, n: a.n || "" });
    }
    if (url.pathname === "/guest/list") {
      const keys = (await kv.list({ prefix: "pass:" })).keys;
      const out = [];
      for (const k of keys) { const v = await kv.get(k.name, "json"); if (v) out.push(Object.assign(v, { revoked: !!(await kv.get("revoked:" + v.n)), expired: v.exp <= Date.now() })); }
      return json(site, { passes: out.sort((a, b) => b.at - a.at), keepDays: KEEP_DAYS });
    }
    if (url.pathname === "/guest/revoke" && req.method === "POST") {
      const n = String(url.searchParams.get("n") || "");
      if (!/^[0-9a-f-]{8}$/.test(n)) return json(site, { error: "Bad pass number." }, 400);
      const v = await kv.get("pass:" + n, "json");
      await kv.put("revoked:" + n, "1", { expiration: Math.ceil(((v && v.exp) || Date.now() + PASS_HOURS * 3600 * 1000) / 1000) + KEEP_DAYS * 86400 });
      return json(site, { ok: true, n });
    }
    /* Clear one pass: a live pass is revoked first (the revocation stays until it would have expired), then its record goes.
       Purge clears every expired one; with ?all=1 it clears every pass, live ones included. */
    const clear = async (n, v) => {
      if (v && v.exp > Date.now()) await kv.put("revoked:" + n, "1", { expiration: Math.ceil(v.exp / 1000) + 60 });
      else await kv.delete("revoked:" + n);
      await kv.delete("pass:" + n);
    };
    if (url.pathname === "/guest/delete" && req.method === "POST") {
      const n = String(url.searchParams.get("n") || "");
      if (!/^[0-9a-f-]{8}$/.test(n)) return json(site, { error: "Bad pass number." }, 400);
      await clear(n, await kv.get("pass:" + n, "json"));
      return json(site, { ok: true, n });
    }
    if (url.pathname === "/guest/purge" && req.method === "POST") {
      const all = url.searchParams.get("all") === "1"; let gone = 0;
      for (const k of (await kv.list({ prefix: "pass:" })).keys) { const v = await kv.get(k.name, "json"); if (!v || all || v.exp <= Date.now()) { await clear(k.name.slice(5), v); gone++; } }
      return json(site, { ok: true, deleted: gone });
    }
    return json(site, { error: "Unknown request." }, 404);
  }
  /* Everything else needs a valid, unexpired pass */
  const g = /^Guest\s+(\S+)$/.exec(auth);
  const p = g && await checkPass(env.GUEST_SECRET, g[1]);
  if (!p) return json(site, { error: "This guest pass is not valid or has expired.", code: "invalid" }, 401);
  if ((env.HP_KV || env.GUEST_KV) && await (env.HP_KV || env.GUEST_KV).get("revoked:" + p.n)) return json(site, { error: "This guest pass has been revoked by the owner.", code: "revoked" }, 401);
  if (url.pathname === "/guest/check") return json(site, { ok: true, exp: p.exp, lvl: p.lvl });
  const repo = env.GUEST_REPO || "Hound-Protocol/hp-staff", tok = await appToken(env, repo);
  const gh = (path, raw) => fetch("https://api.github.com/repos/" + repo + path, { headers: { Authorization: "Bearer " + tok, Accept: raw ? "application/vnd.github.raw+json" : "application/vnd.github+json", "User-Agent": "hound-protocol-signin" } });
  if (url.pathname === "/guest/tree") {
    const r = await gh(""); if (!r.ok) return json(site, { error: "GitHub refused (" + r.status + ")" }, 502);
    const t = await (await gh("/git/trees/" + encodeURIComponent((await r.json()).default_branch) + "?recursive=1")).json();
    return json(site, { exp: p.exp, paths: (t.tree || []).filter(n => n.type === "blob" && /\.md$/i.test(n.path) && !/(^|\/)README\.md$/i.test(n.path)).map(n => n.path) });
  }
  if (url.pathname === "/guest/file") {
    const path = url.searchParams.get("path") || "";
    if (!/^[\w\-./ ]+\.md$/i.test(path) || path.split("/").some(s => s === ".." || s === "")) return json(site, { error: "Bad path." }, 400);
    const r = await gh("/contents/" + path.split("/").map(encodeURIComponent).join("/"), true);
    if (!r.ok) return json(site, { error: "Not found." }, r.status === 404 ? 404 : 502);
    return new Response(await r.text(), { status: 200, headers: Object.assign({ "Content-Type": "text/markdown; charset=utf-8", "Cache-Control": "no-store" }, cors(site)) });
  }
  return json(site, { error: "Unknown request." }, 404);
}
async function checkPass(secret, pass) {
  const parts = String(pass).split(".");
  if (parts.length === 3) {
    const [e36, n, sig] = parts;
    if (!/^[0-9a-z]{4,9}$/.test(e36) || !/^[0-9a-f-]{8}$/.test(n) || sig !== (await hmac(secret, "v2|" + e36 + "|" + n)).slice(0, 16)) return null;
    const exp = parseInt(e36, 36) * 1000;
    return exp > Date.now() && exp - Date.now() <= PASS_HOURS * 3600 * 1000 + 60000 ? { v: 2, lvl: 3, exp, n } : null;
  }
  const [body, sig] = parts;
  if (!body || !sig || sig !== await hmac(secret, body)) return null;
  let p; try { p = JSON.parse(new TextDecoder().decode(unb64u(body))); } catch (e) { return null; }
  return p && p.v === 1 && p.exp > Date.now() && p.exp - Date.now() <= PASS_HOURS * 3600 * 1000 + 60000 ? p : null;
}
async function hmac(secret, data) {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64u(new Uint8Array(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(data))));
}
/* The GitHub App's installation token: read-only, for the one guest repository, cached while it is valid */
let tokCache = null;
async function appToken(env, repo) {
  if (tokCache && tokCache.repo === repo && tokCache.exp > Date.now() + 120000) return tokCache.tok;
  if (!env.GITHUB_APP_ID || !env.GITHUB_APP_PRIVATE_KEY) throw new Error("guest_app_key_missing");
  const jwt = await appJwt(env.GITHUB_APP_ID, env.GITHUB_APP_PRIVATE_KEY);
  const H = { Authorization: "Bearer " + jwt, Accept: "application/vnd.github+json", "User-Agent": "hound-protocol-signin" };
  const inst = await fetch("https://api.github.com/repos/" + repo + "/installation", { headers: H });
  if (!inst.ok) throw new Error("app_not_installed_" + inst.status);
  const id = (await inst.json()).id;
  const t = await fetch("https://api.github.com/app/installations/" + id + "/access_tokens", { method: "POST", headers: H,
    body: JSON.stringify({ repositories: [repo.split("/")[1]], permissions: { contents: "read" } }) });
  if (!t.ok) throw new Error("token_" + t.status);
  const j = await t.json();
  tokCache = { repo, tok: j.token, exp: Date.parse(j.expires_at) || Date.now() + 3000000 };
  return j.token;
}
async function appJwt(appId, pem) {
  const now = Math.floor(Date.now() / 1000), enc = o => b64u(new TextEncoder().encode(JSON.stringify(o)));
  const data = enc({ alg: "RS256", typ: "JWT" }) + "." + enc({ iat: now - 60, exp: now + 540, iss: String(appId) });
  const key = await crypto.subtle.importKey("pkcs8", pkcs8(pem), { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  return data + "." + b64u(new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(data))));
}
/* GitHub hands out PKCS#1 keys ("BEGIN RSA PRIVATE KEY"); Web Crypto wants PKCS#8, so wrap it */
function pkcs8(pem) {
  const isP1 = /BEGIN RSA PRIVATE KEY/.test(pem);
  const der = unb64(pem.replace(/-----[^-]+-----/g, "").replace(/\s+/g, ""));
  if (!isP1) return der;
  const len = n => n < 128 ? [n] : n < 256 ? [0x81, n] : n < 65536 ? [0x82, n >> 8, n & 255] : [0x83, n >> 16, (n >> 8) & 255, n & 255];
  const algo = [0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05, 0x00];
  const oct = [0x04].concat(len(der.length));
  const inner = [0x02, 0x01, 0x00].concat(algo, oct);
  const head = [0x30].concat(len(inner.length + der.length), inner), out = new Uint8Array(head.length + der.length);
  out.set(head, 0); out.set(der, head.length);
  return out;
}
function b64u(u) { let s = ""; for (let i = 0; i < u.length; i++) s += String.fromCharCode(u[i]); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
function unb64(s) { const b = atob(s); const u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
function unb64u(s) { s = s.replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "="; return unb64(s); }
function cors(site) { return { "Access-Control-Allow-Origin": site, "Access-Control-Allow-Headers": "Authorization, Content-Type", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Max-Age": "600", Vary: "Origin" }; }
function json(site, obj, status) { return new Response(JSON.stringify(obj), { status: status || 200, headers: Object.assign({ "Content-Type": "application/json", "Cache-Control": "no-store" }, cors(site)) }); }

/* The callback page sends the result to the website window that opened it, and only to the website's origin */
function page(site, msg) {
  const body = `<!doctype html><meta charset="utf-8"><title>Signing in</title><body style="background:#0c0f10;color:#e9edee;font:15px sans-serif;padding:24px">
<p>${msg.error ? msg.error : "Signed in. You can close this window."}</p>
<script>try{window.opener&&window.opener.postMessage(${JSON.stringify({ houndSignin: msg })},${JSON.stringify(site)});}catch(e){}setTimeout(function(){window.close()},${msg.error ? 4000 : 300});</script>`;
  return new Response(body, { status: 200, headers: {
    "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "Referrer-Policy": "no-referrer",
    "Set-Cookie": "hp_state=; Path=/callback; Max-Age=0; HttpOnly; Secure; SameSite=Lax",
    "Content-Security-Policy": "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'" } });
}
