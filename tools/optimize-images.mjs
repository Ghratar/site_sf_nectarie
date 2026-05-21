/**
 * One-off image optimization for atiaria.org
 *
 * Usage:
 *   npm install --save-dev sharp
 *   node tools/optimize-images.mjs
 *
 * Reads each source image at the project root and writes
 * WebP (640 / 1280 / 1920) + a JPEG fallback into ./images/.
 *
 * The HTML uses <picture> with the WebP <source> and the
 * original PNG/JPEG as <img src> fallback, so the site
 * works even if this script hasn't been run yet.
 */

import sharp from "sharp";
import { mkdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, basename, extname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT  = join(ROOT, "images");

const TARGETS = [
  { src: "forest.png",            widths: [480, 768, 1024, 1280, 1920], jpegWidth: 1280 },
  { src: "SARBATORI-IMPREUNA.png", widths: [640, 1280],       jpegWidth: 1280 },
  { src: "PELERINAJ.png",         widths: [640, 1280],       jpegWidth: 1280 },
  { src: "GRUP-DE-SUPORT.png",    widths: [640, 1280],       jpegWidth: 1280 },
  { src: "COLABORARI.jpeg",       widths: [640, 1280],       jpegWidth: 1280 },
  { src: "dove.png",              widths: [180, 360],        jpegWidth: null }
];

const WEBP_OPTS = { quality: 80, effort: 5 };
const JPEG_OPTS = { quality: 82, mozjpeg: true };

function humanSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1024 / 1024).toFixed(2) + " MB";
}

async function ensureDir(d) {
  if (!existsSync(d)) await mkdir(d, { recursive: true });
}

async function processOne(target) {
  const srcPath = join(ROOT, target.src);
  if (!existsSync(srcPath)) {
    console.warn(`  ✗ skip (missing): ${target.src}`);
    return;
  }
  const stem = basename(target.src, extname(target.src));
  const srcStat = await stat(srcPath);
  console.log(`\n• ${target.src}  (${humanSize(srcStat.size)})`);

  for (const w of target.widths) {
    const dest = join(OUT, `${stem}-${w}.webp`);
    await sharp(srcPath).resize({ width: w, withoutEnlargement: true }).webp(WEBP_OPTS).toFile(dest);
    const s = await stat(dest);
    console.log(`    → ${stem}-${w}.webp  (${humanSize(s.size)})`);
  }

  if (target.jpegWidth) {
    const dest = join(OUT, `${stem}-${target.jpegWidth}.jpg`);
    await sharp(srcPath).resize({ width: target.jpegWidth, withoutEnlargement: true }).jpeg(JPEG_OPTS).toFile(dest);
    const s = await stat(dest);
    console.log(`    → ${stem}-${target.jpegWidth}.jpg  (${humanSize(s.size)})`);
  }
}

async function main() {
  console.log("Optimizing images for atiaria.org");
  console.log(`Output: ${OUT}`);
  await ensureDir(OUT);

  for (const t of TARGETS) {
    await processOne(t);
  }

  // Also build an Open Graph cover (1200×630, brand color, with logo center)
  const ogPath = join(OUT, "og-cover.jpg");
  const forestPath = join(ROOT, "forest.png");
  const dovePath   = join(ROOT, "dove.png");
  if (existsSync(forestPath)) {
    const base = sharp(forestPath)
      .resize({ width: 1200, height: 630, fit: "cover", position: "center" })
      .modulate({ brightness: 0.75 });
    const overlays = [];
    if (existsSync(dovePath)) {
      const doveBuf = await sharp(dovePath)
        .resize({ width: 220 })
        .negate({ alpha: false })
        .toBuffer();
      const doveMeta = await sharp(doveBuf).metadata();
      const left = Math.round((1200 - (doveMeta.width || 220)) / 2);
      const top  = Math.round((630  - (doveMeta.height || 220)) / 2) - 30;
      overlays.push({ input: doveBuf, left, top });
    }
    if (overlays.length) base.composite(overlays);
    await base.jpeg({ quality: 84 }).toFile(ogPath);
    const s = await stat(ogPath);
    console.log(`\n• og-cover.jpg generated  (${humanSize(s.size)})`);
  }

  console.log("\nDone. Commit /images and you're set.");
}

main().catch((err) => {
  console.error("\nFailed:", err);
  process.exit(1);
});
