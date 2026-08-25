#!/usr/bin/env node
// Standalone local runner for Vault -- zero dependencies, no Vercel CLI.
//
//     JWT_FLAG='flag{test}' node serve.js
//     # then open http://localhost:3000
//
// Serves public/ statically and routes /api/<name> to the SAME handler files
// Vercel runs. Handlers are re-required per request, so edit api/_jwt.js (e.g.
// reject alg:none) and watch the forged token stop working without a restart.

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };

function makeRes(nodeRes) {
  let code = 200;
  return {
    status(c) { code = c; return this; },
    json(obj) {
      nodeRes.writeHead(code, { 'content-type': 'application/json' });
      nodeRes.end(JSON.stringify(obj));
    },
  };
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => (data += c));
    req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch { resolve({}); } });
  });
}

function clearApiCache() {
  for (const key of Object.keys(require.cache)) {
    if (key.includes(`${path.sep}api${path.sep}`)) delete require.cache[key];
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname.startsWith('/api/')) {
    const name = url.pathname.slice('/api/'.length).replace(/[^a-z0-9_]/gi, '');
    const handlerPath = path.join(__dirname, 'api', `${name}.js`);
    if (!fs.existsSync(handlerPath)) {
      res.writeHead(404, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: 'no such endpoint' }));
      return;
    }
    clearApiCache(); // pick up edits to handlers and their shared imports
    const handler = require(handlerPath);
    const query = Object.fromEntries(url.searchParams.entries());
    const body = req.method === 'POST' ? await readBody(req) : undefined;
    handler({ method: req.method, headers: req.headers, query, body }, makeRes(res));
    return;
  }

  let file = url.pathname === '/' ? '/index.html' : url.pathname;
  const full = path.join(PUBLIC_DIR, path.normalize(file));
  if (!full.startsWith(PUBLIC_DIR) || !fs.existsSync(full)) {
    res.writeHead(404); res.end('not found'); return;
  }
  res.writeHead(200, { 'content-type': MIME[path.extname(full)] || 'application/octet-stream' });
  fs.createReadStream(full).pipe(res);
});

server.listen(PORT, () => {
  if (!process.env.JWT_FLAG) {
    console.log('[!] JWT_FLAG not set -- using placeholder.');
  }
  console.log(`Vault running at http://localhost:${PORT}`);
  console.log('Log in as alice / password123, then inspect your token.');
});
