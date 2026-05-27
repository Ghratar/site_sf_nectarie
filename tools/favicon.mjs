/**
 * Build a favicon set from dove.png that is visible on BOTH light
 * and dark backgrounds (Google search results, browser tabs in light
 * mode, app launchers, etc.).
 *
 * Output:
 *   favicon.ico                  (16+32, legacy)
 *   favicon-32.png               (modern <link rel="icon">)
 *   favicon-192.png              (Android home screen)
 *   favicon-512.png              (PWA splash / large)
 *   apple-touch-icon.png         (180, iOS home screen)
 *   site.webmanifest             (PWA manifest)
 *
 * Composition: white dove (the source PNG inverted to pure white)
 * centered on a forest-green (#454F2D) rounded square. The colored
 * tile guarantees visibility against any background — Google search
 * shows it as a green chip with a white dove, browser tabs same.
 *
 * Run: node tools/favicon.mjs   (or: npm run favicon)
 */

import sharp from "sharp";
import pngToIco from "png-to-ico";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SRC  = join(ROOT, "dove.png");

const BRAND_HEX = "#454F2D";  // var(--color-primary)

function kb(n) { return (n / 1024).toFixed(1) + " KB"; }

/**
 * Build a square favicon tile at the given size:
 *   - solid rounded-corner forest green background
 *   - white dove centered, sized to ~70% of the tile
 *   - rounded corners (~18% radius) via SVG mask
 */
async function buildTile(size, outPath) {
  // 1. Source dove → white silhouette at ~70% of tile size.
  // The dove.png is a dark drawing on transparent background; we
  // resize it then NEGATE the RGB channels (preserving alpha) so the
  // dark dove becomes white. linear() with -1 slope inverts; alpha
  // is preserved automatically.
  const doveSize = Math.round(size * 0.7);
  const resized = await sharp(SRC)
    .resize({ width: doveSize, height: doveSize, fit: "inside" })
    .ensureAlpha()
    .toBuffer();
  const resizedMeta = await sharp(resized).metadata();
  const dW = resizedMeta.width;
  const dH = resizedMeta.height;

  const whiteDove = await sharp(resized)
    .negate({ alpha: false })   // invert RGB, leave alpha alone
    .png()
    .toBuffer();

  // 2. Build the background: rounded-corner square in brand color.
  const radius = Math.round(size * 0.18);
  const tile = await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
  .composite([{
    input: Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">` +
      `<rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="${BRAND_HEX}"/>` +
      `</svg>`
    )
  }])
  .png()
  .toBuffer();

  // 3. Composite dove onto tile, slightly upward bias for visual balance
  const top = Math.round((size - dH) / 2) - Math.round(size * 0.02);
  const left = Math.round((size - dW) / 2);
  const out = await sharp(tile)
    .composite([{ input: whiteDove, top, left }])
    .png({ compressionLevel: 9 })
    .toBuffer();

  await writeFile(outPath, out);
  return out.length;
}

async function main() {
  console.log("Generating favicon set");

  const tasks = [
    { size: 32,  out: "favicon-32.png" },
    { size: 180, out: "apple-touch-icon.png" },
    { size: 192, out: "favicon-192.png" },
    { size: 512, out: "favicon-512.png" }
  ];

  for (const t of tasks) {
    const bytes = await buildTile(t.size, join(ROOT, t.out));
    console.log(`  ${t.out.padEnd(28)} ${t.size}x${t.size}  ${kb(bytes)}`);
  }

  // Multi-resolution .ico (16 + 32 + 48) for legacy browsers
  const ico16Path = join(ROOT, "_tmp-16.png");
  const ico32Path = join(ROOT, "_tmp-32.png");
  const ico48Path = join(ROOT, "_tmp-48.png");
  await buildTile(16, ico16Path);
  await buildTile(32, ico32Path);
  await buildTile(48, ico48Path);
  const ico = await pngToIco([ico16Path, ico32Path, ico48Path]);
  await writeFile(join(ROOT, "favicon.ico"), ico);
  console.log(`  favicon.ico                  16+32+48  ${kb(ico.length)}`);
  // Clean up temp PNGs
  const { unlink } = await import("node:fs/promises");
  await unlink(ico16Path);
  await unlink(ico32Path);
  await unlink(ico48Path);

  // Web app manifest
  const manifest = {
    name: "Asociația de Terapii Integrative „Sfântul Nectarie”",
    short_name: "ATI Sf. Nectarie",
    description: "Informare, consiliere și sprijin pentru persoanele diagnosticate cu afecțiuni oncologice.",
    lang: "ro",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f3ec",
    theme_color: BRAND_HEX,
    icons: [
      { src: "/favicon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/favicon-512.png", sizes: "512x512", type: "image/png", purpose: "any" }
    ]
  };
  await writeFile(join(ROOT, "site.webmanifest"), JSON.stringify(manifest, null, 2) + "\n");
  console.log(`  site.webmanifest             PWA`);

  console.log("Done.");
}

main().catch((e) => { console.error(e); process.exit(1); });
