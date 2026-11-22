// Minimal static file server for local development: `npm start`.
// Browsers block ES module imports from file:// URLs, so the pages must be
// served over HTTP. Binds to localhost only, answers only to localhost Host
// headers (blocks DNS rebinding), never serves dotfiles, and refuses symlinks
// that lead outside the project.

import { createServer } from 'node:http';
import { readFile, realpath } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = await realpath(fileURLToPath(new URL('..', import.meta.url)));
const port = Number(process.env.PORT) || 8000;
const allowedHosts = new Set([`localhost:${port}`, `127.0.0.1:${port}`]);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

const insideRoot = (path) => path.startsWith(root + sep);

createServer(async (request, response) => {
  if (!allowedHosts.has(request.headers.host)) {
    response.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Forbidden');
    return;
  }
  try {
    let path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (path.endsWith('/')) path += 'index.html';
    const hidden = path.split('/').some((segment) => segment.startsWith('.'));
    const file = resolve(root, `.${path}`);
    if (hidden || !insideRoot(file)) throw new Error('forbidden');
    const real = await realpath(file);
    if (!insideRoot(real)) throw new Error('forbidden');
    const body = await readFile(real);
    response.writeHead(200, {
      'Content-Type': types[extname(real)] ?? 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    response.end(body);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`Serving ${root} at http://localhost:${port}/`);
});
