#!/usr/bin/env node
// Builds a password-protected static page: the content is AES-256-GCM encrypted with a key
// derived (PBKDF2-SHA256) from "username:password", so the plaintext never appears in the repo
// or the published HTML. The browser decrypts it with the Web Crypto API after login.
//
// Usage: node scripts/encrypt_page.mjs <content.html> <out.html> <username> <password> [title]
// Keep <content.html> outside the repo (or untracked); only <out.html> is committed.
import { readFileSync, writeFileSync } from "node:fs";
import { webcrypto as crypto } from "node:crypto";

const [src, out, user, pass, title = "Private page"] = process.argv.slice(2);
if (!src || !out || !user || !pass) {
  console.error("usage: node scripts/encrypt_page.mjs <content.html> <out.html> <username> <password> [title]");
  process.exit(1);
}

const ITERATIONS = 250000;
const b64 = (buf) => Buffer.from(buf).toString("base64");
const enc = new TextEncoder();
const salt = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));
const base = await crypto.subtle.importKey("raw", enc.encode(`${user}:${pass}`), "PBKDF2", false, ["deriveKey"]);
const key = await crypto.subtle.deriveKey(
  { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
  base, { name: "AES-GCM", length: 256 }, false, ["encrypt"]);
const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(readFileSync(src, "utf8")));
const payload = JSON.stringify({ v: 1, iter: ITERATIONS, salt: b64(salt), iv: b64(iv), data: b64(cipher) });
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

writeFileSync(out, `---
layout: null
sitemap: false
---
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <title>${esc(title)}</title>
  <style>
    :root { --bg: #f8f8f8; --fg: #111; --card: #fff; --muted: #666; --accent: #106ebe; --err: #c0392b; --line: #ddd; }
    @media (prefers-color-scheme: dark) { :root { --bg: #111; --fg: #eee; --card: #1c1c1c; --muted: #999; --accent: #71afe5; --err: #ff6b6b; --line: #333; } }
    * { box-sizing: border-box; }
    body { margin: 0; background: var(--bg); color: var(--fg); font: 16px/1.6 system-ui, -apple-system, "Segoe UI", sans-serif; }
    #login { max-width: 360px; margin: 12vh auto; padding: 28px 24px; background: var(--card); border: 1px solid var(--line); border-radius: 10px; }
    #login h1 { margin: 0 0 4px; font-size: 1.3rem; }
    #login p { margin: 0 0 18px; color: var(--muted); font-size: .9rem; }
    label { display: block; font-size: .85rem; margin: 10px 0 4px; }
    input { width: 100%; padding: 9px 10px; border: 1px solid var(--line); border-radius: 6px; background: var(--bg); color: var(--fg); font: inherit; }
    button { margin-top: 16px; width: 100%; padding: 10px; border: 0; border-radius: 6px; background: var(--accent); color: #fff; font: inherit; cursor: pointer; }
    button:disabled { opacity: .6; cursor: wait; }
    #err { color: var(--err); font-size: .9rem; min-height: 1.4em; margin-top: 10px; }
    #content { max-width: 760px; margin: 0 auto; padding: 32px 16px; }
  </style>
</head>
<body>
  <form id="login" autocomplete="on">
    <h1>${esc(title)}</h1>
    <p>This page is private. Log in to view it.</p>
    <label for="user">Username</label>
    <input id="user" name="username" autocomplete="username" required>
    <label for="pass">Password</label>
    <input id="pass" name="password" type="password" autocomplete="current-password" required>
    <button type="submit">Unlock</button>
    <div id="err" role="alert"></div>
  </form>
  <main id="content" hidden></main>
  <script>
    const PAYLOAD = ${payload};
    const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
    async function decrypt(user, pass) {
      const enc = new TextEncoder();
      const base = await crypto.subtle.importKey("raw", enc.encode(user + ":" + pass), "PBKDF2", false, ["deriveKey"]);
      const key = await crypto.subtle.deriveKey(
        { name: "PBKDF2", salt: unb64(PAYLOAD.salt), iterations: PAYLOAD.iter, hash: "SHA-256" },
        base, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
      const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(PAYLOAD.iv) }, key, unb64(PAYLOAD.data));
      return new TextDecoder().decode(plain);
    }
    document.getElementById("login").addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = e.target.querySelector("button"), err = document.getElementById("err");
      btn.disabled = true; err.textContent = "";
      try {
        const html = await decrypt(document.getElementById("user").value, document.getElementById("pass").value);
        const main = document.getElementById("content");
        main.innerHTML = html;
        main.hidden = false;
        e.target.remove();
      } catch {
        err.textContent = "Wrong username or password.";
        btn.disabled = false;
      }
    });
  </script>
</body>
</html>
`);
console.log(`wrote ${out}`);
