/**
 * Minify style.css → style.min.css and script.js → script.min.js
 *   npm run build
 *   (or: node tools/minify.mjs)
 *
 * After the build runs, index.html should reference the .min variants.
 * The unminified source files remain for editing.
 */

import { readFile, writeFile, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import CleanCSS from "clean-css";
import { minify as terserMinify } from "terser";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function kb(n) { return (n / 1024).toFixed(1) + " KB"; }

async function minCSS() {
  const src = await readFile(join(ROOT, "style.css"), "utf8");
  const result = new CleanCSS({ level: 2, returnPromise: true });
  const out = await result.minify(src);
  if (out.errors.length) throw new Error("CleanCSS errors: " + out.errors.join("; "));
  await writeFile(join(ROOT, "style.min.css"), out.styles, "utf8");
  console.log(`  style.css     ${kb(src.length).padStart(10)} → style.min.css     ${kb(out.styles.length).padStart(10)}`);
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

console.log("Minifying atiaria.org assets");
await minCSS();
await minJS();
console.log("Done.");
