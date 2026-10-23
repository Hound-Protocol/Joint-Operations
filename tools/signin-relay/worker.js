/* Hound Protocol sign-in relay (Cloudflare Worker). See docs/signin.md.
   1. Sign-in: swaps GitHub's one-time sign-in code for a user token, using the app secret that only it holds, and hands
      the token to the website window that asked for it.
   2. Guest passes: the owner (and only the owner, checked against GitHub on every request) mints a pass that lasts
      24 hours. Whoever holds the pass can read the Staff documents (LV3) through this relay, which reads them with the
      GitHub App's own short-lived token, limited to that one repository and to reading. The pass is signed here and
      checked here; the browser cannot forge or extend it.
   No storage, no logging of tokens or passes.
   Settings (Worker → Settings → Variables and Secrets):
     GITHUB_CLIENT_ID (text), GITHUB_CLIENT_SECRET (secret), SITE_ORIGIN (text, https://hound-protocol.github.io)
     For guest passes: OWNER_GITHUB_ID (text), GUEST_SECRET (secret, a long random string), GITHUB_APP_ID (text),
     GITHUB_APP_PRIVATE_KEY (secret, the app's .pem file), GUEST_REPO (text, Hound-Protocol/hp-staff) */
const PASS_HOURS = 24;
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const site = env.SITE_ORIGIN;
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
      return page(site, { token: j.access_token, expires_in: j.expires_in || 0 });
    }
    return new Response("Hound Protocol sign-in relay", { status: 200, headers: { "Content-Type": "text/plain" } });
  }
};

/* ---------------- Guest passes ---------------- */
async function guest(req, env, url) {
  const site = env.SITE_ORIGIN, auth = req.headers.get("Authorization") || "";
  if (!env.GUEST_SECRET || !env.OWNER_GITHUB_ID) return json(site, { error: "Guest passes are not set up on the relay yet (code: guest_off)." }, 503);
  /* The owner mints a pass. GitHub tells us who holds the token; only the owner's account ID may grant. */
  if (url.pathname === "/guest/grant" && req.method === "POST") {
    const m = /^Bearer\s+(\S+)$/.exec(auth);
    if (!m) return json(site, { error: "Sign in first." }, 401);
    const u = await fetch("https://api.github.com/user", { headers: { Authorization: "Bearer " + m[1], Accept: "application/vnd.github+json", "User-Agent": "hound-protocol-signin" } });
    if (!u.ok) return json(site, { error: "GitHub did not recognise your sign-in. Sign in again." }, 401);
    const who = await u.json();
    if (String(who.id) !== String(env.OWNER_GITHUB_ID)) return json(site, { error: "Only the owner can grant guest passes." }, 403);
    const exp = Date.now() + PASS_HOURS * 3600 * 1000;
    const body = b64u(new TextEncoder().encode(JSON.stringify({ v: 1, lvl: 3, exp, n: crypto.randomUUID().slice(0, 8) })));
    return json(site, { pass: body + "." + await hmac(env.GUEST_SECRET, body), exp, hours: PASS_HOURS });
  }
  /* Everything else needs a valid, unexpired pass */
  const g = /^Guest\s+(\S+)$/.exec(auth);
  const p = g && await checkPass(env.GUEST_SECRET, g[1]);
  if (!p) return json(site, { error: "This guest pass is not valid or has expired." }, 401);
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
  const [body, sig] = String(pass).split(".");
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
