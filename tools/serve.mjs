import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.env.PORT || 8765);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css":  "text/css; charset=utf-8",
  ".js":   "application/javascript; charset=utf-8",
  ".mjs":  "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif":  "image/gif",
  ".svg":  "image/svg+xml",
  ".ico":  "image/x-icon",
  ".woff": "font/woff",
  ".woff2":"font/woff2",
  ".pdf":  "application/pdf",
  ".xml":  "application/xml; charset=utf-8",
  ".txt":  "text/plain; charset=utf-8",
  ".map":  "application/json; charset=utf-8"
};

// Mirror what Cloudflare Pages does in production, so local testing
// shows the same behaviour:
//   - the site-wide ("/*") headers from _headers, CSP included
//     (Cache-Control rules are skipped - local files must stay fresh)
//   - /evenimente resolves to evenimente.html
//   - unknown paths get 404.html with a 404 status
function siteHeaders() {
  const out = {};
  let text = "";
  try { text = fs.readFileSync(path.join(ROOT, "_headers"), "utf8"); } catch { return out; }
  let inAll = false;
  for (const raw of text.split(/\r?\n/)) {
    if (!raw.trim() || raw.trim().startsWith("#")) continue;
    if (!/^\s/.test(raw)) { inAll = raw.trim() === "/*"; continue; }
    if (!inAll) continue;
    const i = raw.indexOf(":");
    if (i > 0) out[raw.slice(0, i).trim()] = raw.slice(i + 1).trim();
  }
  return out;
}

function isFile(p) {
  try { return fs.statSync(p).isFile(); } catch { return false; }
}

http.createServer((req, res) => {
  try {
    let url = decodeURIComponent(req.url.split("?")[0]);
    if (url === "/" || url.endsWith("/")) url += "index.html";
    let file = path.join(ROOT, url);
    if (!file.startsWith(ROOT)) { res.writeHead(403); res.end("Forbidden"); return; }

    let status = 200;
    if (!isFile(file)) {
      if (!path.extname(file) && isFile(file + ".html")) {
        file += ".html";
      } else {
        file = path.join(ROOT, "404.html");
        status = 404;
        if (!isFile(file)) { res.writeHead(404); res.end("Not found: " + url); return; }
      }
    }

    const ext = path.extname(file).toLowerCase();
    res.writeHead(status, Object.assign(siteHeaders(), {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Cache-Control": "no-cache"
    }));
    fs.createReadStream(file).pipe(res);
  } catch (e) {
    res.writeHead(500); res.end(String(e));
  }
}).listen(PORT, () => {
  console.log(`serving ${ROOT} on http://localhost:${PORT}`);
});
