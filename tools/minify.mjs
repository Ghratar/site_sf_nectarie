/**
 * Build step for atiaria.org:
 *   1. minify style.css     -> style.min.css
 *   2. minify script.js     -> script.min.js
 *   3. inline style.min.css INTO each HTML file between the
 *      sentinels <!-- inline-css:start --> and <!-- inline-css:end -->.
 *
 * Inlining the CSS eliminates the render-blocking <link rel=stylesheet>
 * request (was costing ~720ms on mobile). The CSS is small enough
 * (~24KB raw, ~7KB gzipped) that the trade-off favors inlining.
 *
 *   npm run build      (or: node tools/minify.mjs)
 */

import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import CleanCSS from "clean-css";
import { minify as terserMinify } from "terser";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const HTML_FILES = ["index.html", "evenimente.html", "live.html", "confidentialitate.html", "termeni.html"];

function kb(n) { return (n / 1024).toFixed(1) + " KB"; }

async function minCSS() {
  const src = await readFile(join(ROOT, "style.css"), "utf8");
  const out = await new CleanCSS({ level: 2, returnPromise: true }).minify(src);
  if (out.errors.length) throw new Error("CleanCSS errors: " + out.errors.join("; "));
  await writeFile(join(ROOT, "style.min.css"), out.styles, "utf8");
  console.log(`  style.css     ${kb(src.length).padStart(10)} → style.min.css     ${kb(out.styles.length).padStart(10)}`);
  return out.styles;
}

async function minJS() {
  const src = await readFile(join(ROOT, "script.js"), "utf8");
  const out = await terserMinify(src, {
    compress: { passes: 2 },
    mangle: true,
    format: { comments: false }
  });
  if (!out.code) throw new Error("terser produced no output");
  await writeFile(join(ROOT, "script.min.js"), out.code, "utf8");
  const hash = createHash("sha1").update(out.code).digest("hex").slice(0, 8);
  console.log(`  script.js     ${kb(src.length).padStart(10)} → script.min.js     ${kb(out.code.length).padStart(10)}   v=${hash}`);
  return hash;
}

async function hashFile(file) {
  try {
    const buf = await readFile(join(ROOT, file));
    return createHash("sha1").update(buf).digest("hex").slice(0, 8);
  } catch {
    return null;  // file might not exist yet
  }
}

async function inlineCSSInto(htmlFile, css, jsHash, faviconHashes) {
  const path = join(ROOT, htmlFile);
  let html = await readFile(path, "utf8");

  // 1. Inline minified CSS between sentinel markers
  const block =
    "<!-- inline-css:start -->\n" +
    "  <style>" + css + "</style>\n" +
    "  <!-- inline-css:end -->";
  const re = /<!-- inline-css:start -->[\s\S]*?<!-- inline-css:end -->/;
  if (!re.test(html)) {
    console.warn(`  ${htmlFile}: no <!-- inline-css:start/end --> markers found, skipping`);
    return;
  }
  html = html.replace(re, block);

  // 2. Cache-bust the script reference with the JS content hash so
  //    browsers never serve stale JS after a deploy.
  html = html.replace(
    /src="script\.min\.js(?:\?v=[^"]*)?"/g,
    `src="script.min.js?v=${jsHash}"`
  );

  // 3. Cache-bust each favicon-family asset so a redesigned icon
  //    propagates to returning visitors without a multi-hour cache
  //    expiry. The auto-fetched /favicon.ico can't be query-string
  //    busted, but PNG <link>s take precedence in modern browsers,
  //    so the tab updates immediately once HTML parses.
  for (const [file, hash] of Object.entries(faviconHashes)) {
    if (!hash) continue;
    const esc = file.replace(/\./g, "\\.").replace(/-/g, "\\-");
    const re = new RegExp(`href="${esc}(?:\\?v=[^"]*)?"`, "g");
    html = html.replace(re, `href="${file}?v=${hash}"`);
  }

  await writeFile(path, html, "utf8");
  console.log(`  inlined CSS + cache-bust into ${htmlFile}`);
}

console.log("Building atiaria.org");
const css = await minCSS();
const jsHash = await minJS();
const faviconHashes = {
  "favicon.ico":          await hashFile("favicon.ico"),
  "favicon-32.png":       await hashFile("favicon-32.png"),
  "favicon-192.png":      await hashFile("favicon-192.png"),
  "apple-touch-icon.png": await hashFile("apple-touch-icon.png"),
  "site.webmanifest":     await hashFile("site.webmanifest")
};
for (const f of HTML_FILES) await inlineCSSInto(f, css, jsHash, faviconHashes);
console.log("Done.");
