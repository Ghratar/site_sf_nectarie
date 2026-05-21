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
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import CleanCSS from "clean-css";
import { minify as terserMinify } from "terser";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const HTML_FILES = ["index.html", "confidentialitate.html", "termeni.html"];

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
  console.log(`  script.js     ${kb(src.length).padStart(10)} → script.min.js     ${kb(out.code.length).padStart(10)}`);
}

async function inlineCSSInto(htmlFile, css) {
  const path = join(ROOT, htmlFile);
  const html = await readFile(path, "utf8");
  const block =
    "<!-- inline-css:start -->\n" +
    "  <style>" + css + "</style>\n" +
    "  <!-- inline-css:end -->";
  const re = /<!-- inline-css:start -->[\s\S]*?<!-- inline-css:end -->/;
  if (!re.test(html)) {
    console.warn(`  ${htmlFile}: no <!-- inline-css:start/end --> markers found, skipping`);
    return;
  }
  const next = html.replace(re, block);
  await writeFile(path, next, "utf8");
  console.log(`  inlined CSS into ${htmlFile}`);
}

console.log("Building atiaria.org");
const css = await minCSS();
await minJS();
for (const f of HTML_FILES) await inlineCSSInto(f, css);
console.log("Done.");
