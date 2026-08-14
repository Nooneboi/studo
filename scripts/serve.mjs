import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT || 4173);
const MIME = {
  '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.mjs':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8', '.svg':'image/svg+xml',
  '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.xlsx':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
};

const server = http.createServer((req,res) => {
  const raw = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
  const rel = raw === '/' ? '/content-studio.html' : raw;
  const full = path.resolve(ROOT, `.${rel}`);
  if (!full.startsWith(ROOT)) { res.writeHead(403); res.end('Forbidden'); return; }
  let target = full;
  try {
    if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target,'index.html');
    if (!fs.existsSync(target)) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, {'Content-Type': MIME[path.extname(target)] || 'application/octet-stream', 'Cache-Control':'no-store'});
    fs.createReadStream(target).pipe(res);
  } catch (err) {
    res.writeHead(500); res.end(err.message);
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Studo Content Studio: http://localhost:${PORT}/content-studio.html`);
  console.log('Press Ctrl+C to stop.');
});
