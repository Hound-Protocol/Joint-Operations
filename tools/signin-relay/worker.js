/* Hound Protocol sign-in relay (Cloudflare Worker). See docs/signin.md.
   It does one thing: swaps GitHub's one-time sign-in code for a user token, using the app secret that only it holds,
   and hands the token to the Hound Protocol website window that asked for it. No storage, no logging of tokens.
   Settings (Worker → Settings → Variables): GITHUB_CLIENT_ID (plain), GITHUB_CLIENT_SECRET (secret), SITE_ORIGIN (plain,
   e.g. https://hound-protocol.github.io). */
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const site = env.SITE_ORIGIN;
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
      if (!j.access_token) return page(site, { error: "GitHub did not accept the sign-in. Try again." });
      return page(site, { token: j.access_token, expires_in: j.expires_in || 0 });
    }
    return new Response("Hound Protocol sign-in relay", { status: 200, headers: { "Content-Type": "text/plain" } });
  }
};
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
