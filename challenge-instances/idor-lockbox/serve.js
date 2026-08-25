#!/usr/bin/env node
// Standalone local runner for Lockbox -- zero dependencies, no Vercel CLI.
//
//     LOCKBOX_FLAG='flag{test}' node serve.js
//     # then open http://localhost:3000
//
// It serves public/ statically and routes /api/<name> to the SAME handler
// files Vercel runs in production (api/login.js, api/note.js, api/mynotes.js),
// with tiny req/res shims so the handler code is identical in both places.
// Download this folder, run it, and experiment freely -- change the seed data
// in api/_data.js, add the ownership check in api/note.js and watch the attack
// stop working, etc.

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
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); }
      catch { resolve({}); }
    });
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // --- API routes: reuse the Vercel handler files verbatim ---
  if (url.pathname.startsWith('/api/')) {
    const name = url.pathname.slice('/api/'.length).replace(/[^a-z0-9_]/gi, '');
    const handlerPath = path.join(__dirname, 'api', `${name}.js`);
    if (!fs.existsSync(handlerPath)) {
      res.writeHead(404, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: 'no such endpoint' }));
      return;
    }
    // Fresh require each hit so edits to handlers show up without a restart.
    delete require.cache[require.resolve(handlerPath)];
    delete require.cache[require.resolve(path.join(__dirname, 'api', '_data.js'))];
    const handler = require(handlerPath);
    const query = Object.fromEntries(url.searchParams.entries());
    const body = req.method === 'POST' ? await readBody(req) : undefined;
    handler({ method: req.method, headers: req.headers, query, body }, makeRes(res));
    return;
  }

  // --- static files from public/ ---
  let file = url.pathname === '/' ? '/index.html' : url.pathname;
  const full = path.join(PUBLIC_DIR, path.normalize(file));
  if (!full.startsWith(PUBLIC_DIR) || !fs.existsSync(full)) {
    res.writeHead(404); res.end('not found'); return;
  }
  res.writeHead(200, { 'content-type': MIME[path.extname(full)] || 'application/octet-stream' });
  fs.createReadStream(full).pipe(res);
});

server.listen(PORT, () => {
  if (!process.env.LOCKBOX_FLAG) {
    console.log('[!] LOCKBOX_FLAG not set -- using placeholder. Set it to see a real flag.');
  }
  console.log(`Lockbox running at http://localhost:${PORT}`);
  console.log('Log in as bob / hunter2, then try changing the note id.');
});
