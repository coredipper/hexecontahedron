// Minimal static file server for local development: `npm start`.
// Browsers block ES module imports from file:// URLs, so the pages must be
// served over HTTP. Binds to localhost only, answers only to localhost Host
// headers (blocks DNS rebinding), never serves dotfiles (including via
// symlinks), and refuses symlinks that lead outside the project.

import { createServer } from 'node:http';
import { readFile, realpath } from 'node:fs/promises';
import { extname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = await realpath(fileURLToPath(new URL('..', import.meta.url)));
const rawPort = process.env.PORT;
const requestedPort = rawPort === undefined || rawPort === '' ? 8000 : Number(rawPort);
if (!Number.isInteger(requestedPort) || requestedPort < 0 || requestedPort > 65535) {
  console.error(`Invalid PORT "${rawPort}": expected an integer between 0 and 65535.`);
  process.exit(1);
}

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
const hasDotSegment = (path, divider) => path.split(divider).some((segment) => segment.startsWith('.'));

function buildAllowedHosts(port) {
  const hosts = new Set([`localhost:${port}`, `127.0.0.1:${port}`, `[::1]:${port}`]);
  if (port === 80) {
    hosts.add('localhost');
    hosts.add('127.0.0.1');
    hosts.add('[::1]');
  }
  return hosts;
}

let allowedHosts = buildAllowedHosts(requestedPort);

function sendText(request, response, status, body, extraHeaders = {}) {
  const payload = Buffer.from(body);
  response.writeHead(status, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Length': payload.length,
    'X-Content-Type-Options': 'nosniff',
    ...extraHeaders,
  });
  response.end(request.method === 'HEAD' ? undefined : payload);
}

async function handleRequest(request, response) {
  if (!allowedHosts.has(request.headers.host)) {
    sendText(request, response, 403, 'Forbidden');
    return;
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    sendText(request, response, 405, 'Method Not Allowed', { Allow: 'GET, HEAD' });
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  } catch {
    sendText(request, response, 400, 'Bad Request');
    return;
  }

  try {
    let path = pathname;
    if (path.endsWith('/')) path += 'index.html';
    const file = resolve(root, `.${path}`);
    if (hasDotSegment(path, '/') || !insideRoot(file)) throw new Error('forbidden');
    const real = await realpath(file);
    if (!insideRoot(real) || hasDotSegment(relative(root, real), sep)) throw new Error('forbidden');
    const body = await readFile(real);
    response.writeHead(200, {
      'Content-Type': types[extname(real)] ?? 'application/octet-stream',
      'Content-Length': body.length,
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    });
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch {
    sendText(request, response, 404, 'Not found');
  }
}

const ipv4 = createServer(handleRequest);
ipv4.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    const nextPort = requestedPort < 65535 ? requestedPort + 1 : 8000;
    console.error(`Port ${requestedPort} is already in use. Try: PORT=${nextPort} npm start`);
  } else {
    console.error(error.message);
  }
  process.exit(1);
});

ipv4.listen(requestedPort, '127.0.0.1', () => {
  const { port } = ipv4.address();
  allowedHosts = buildAllowedHosts(port);
  console.log(`Serving ${root} at http://localhost:${port}/`);

  // Best-effort IPv6 loopback listener so clients resolving localhost to ::1 work directly.
  const ipv6 = createServer(handleRequest);
  ipv6.on('error', () => {});
  ipv6.listen(port, '::1');
});
