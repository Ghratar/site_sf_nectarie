/**
 * Pornește / oprește transmisiunea din „Sala webinar” (live.html).
 *
 *   npm run live -- https://youtu.be/XXXXXXXXXXX          pornește (link YouTube sau ID)
 *   npm run live -- XXXXXXXXXXX --title "..." --date "..."  pornește + actualizează titlul/data
 *   npm run live -- off                                    oprește (pagina afișează programul)
 *   npm run live                                           arată starea curentă
 *
 * Scriptul NU are nevoie de cheia de stream (zzzz-zzzz-zzzz-zzzz-zzzz) - aceea
 * este secretă și se introduce doar în programul de streaming (OBS, StreamYard).
 * Pagina are nevoie doar de ID-ul videoclipului (11 caractere, din linkul „Distribuie”).
 *
 * După rulare: git commit -am "Live: on" && git push
 */

import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FILE = join(__dirname, "..", "live.html");

const ID_RE = /^[A-Za-z0-9_-]{11}$/;
const STREAM_KEY_RE = /^[a-z0-9]{4}(-[a-z0-9]{4}){3,5}$/i;

function toVideoId(input) {
  const s = String(input || "").trim();
  if (!s) return "";
  if (ID_RE.test(s)) return s;
  let u;
  try { u = new URL(s.startsWith("http") ? s : "https://" + s); } catch { return null; }
  const host = u.hostname.replace(/^www\./, "");
  if (host === "youtu.be") return u.pathname.slice(1, 12);
  if (/(^|\.)youtube(-nocookie)?\.com$/.test(host)) {
    const v = u.searchParams.get("v");
    if (v && ID_RE.test(v)) return v;
    const m = u.pathname.match(/\/(?:live|embed|shorts|video)\/([A-Za-z0-9_-]{11})/);
    if (m) return m[1];
  }
  return null;
}

function arg(name) {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : undefined;
}

const html = await readFile(FILE, "utf8");
const current = {
  videoId: (html.match(/videoId:\s*"([^"]*)"/) || [])[1] ?? "",
  title: (html.match(/\n\s*title:\s*"([^"]*)"/) || [])[1] ?? "",
  date: (html.match(/\n\s*date:\s*"([^"]*)"/) || [])[1] ?? ""
};

const target = process.argv[2];
if (!target) {
  console.log(current.videoId
    ? `LIVE: videoId ${current.videoId}  (https://youtu.be/${current.videoId})`
    : "OPRIT: nicio transmisiune activă (pagina afișează programul)");
  console.log(`titlu: ${current.title}\ndata:  ${current.date}`);
  process.exit(0);
}

let videoId;
if (/^(off|stop|oprit)$/i.test(target)) {
  videoId = "";
} else {
  if (STREAM_KEY_RE.test(target)) {
    console.error("EROARE: acesta este CHEIA DE STREAM (secretă). Nu o pune pe site!\n" +
      "Pagina are nevoie de ID-ul videoclipului: deschide transmisiunea în YouTube Studio,\n" +
      "apasă „Distribuie” și copiază linkul (https://youtu.be/XXXXXXXXXXX).");
    process.exit(1);
  }
  videoId = toVideoId(target);
  if (!videoId) {
    console.error(`EROARE: nu recunosc „${target}” ca link sau ID YouTube.`);
    process.exit(1);
  }
}

let out = html.replace(/videoId:\s*"[^"]*"/, `videoId: ${JSON.stringify(videoId)}`);
const title = arg("--title");
const date = arg("--date");
if (title) out = out.replace(/(\n\s*title:\s*)"[^"]*"/, `$1${JSON.stringify(title)}`);
if (date) out = out.replace(/(\n\s*date:\s*)"[^"]*"/, `$1${JSON.stringify(date)}`);

if (out === html) {
  console.log("Nicio schimbare.");
  process.exit(0);
}
await writeFile(FILE, out, "utf8");
console.log(videoId
  ? `PORNIT: live.html afișează acum playerul pentru https://youtu.be/${videoId}`
  : "OPRIT: live.html afișează acum programul (fără player).");
if (title) console.log(`titlu: ${title}`);
if (date) console.log(`data:  ${date}`);
console.log('\nPublică:  git commit -am "Live: ' + (videoId ? "on" : "off") + '" && git push');
