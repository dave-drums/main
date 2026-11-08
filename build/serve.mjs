import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { ROOT } from './common.mjs';

const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.ico': 'image/x-icon', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.pdf': 'application/pdf', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8' };

export function serveSite({ root = ROOT, port = 4177 } = {}) {
  root = resolve(root);
  return new Promise((accept, reject) => {
    const server = http.createServer(async (request, response) => {
      try {
        const url = new URL(request.url, 'http://localhost');
        const path = decodeURIComponent(url.pathname);
        const parts = path.split('/').filter(Boolean);
        if (parts.some(part => part.startsWith('.')) || ['apps', 'build', 'tests', 'node_modules', 'README.md', 'package.json', 'package-lock.json'].includes(parts[0])) {
          response.writeHead(404); response.end(); return;
        }
        let file = resolve(root, '.' + path);
        if (file !== root && !file.startsWith(root + sep)) { response.writeHead(403); response.end(); return; }
        let entry = await stat(file).catch(() => null);
        if (entry?.isDirectory()) {
          if (!path.endsWith('/')) {
            response.writeHead(308, { Location: url.pathname + '/' + url.search }); response.end(); return;
          }
          file = resolve(file, 'index.html');
        } else if (!entry && !extname(file)) file += '.html';
        let status = 200;
        let bytes;
        try { bytes = await readFile(file); }
        catch {
          status = 404; file = resolve(root, '404.html'); bytes = await readFile(file);
        }
        response.writeHead(status, { 'Content-Type': types[extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store', 'Content-Length': bytes.length });
        response.end(request.method === 'HEAD' ? undefined : bytes);
      } catch { response.writeHead(400); response.end(); }
    });
    server.on('error', reject);
    server.listen(port, '127.0.0.1', () => accept(server));
  });
}
