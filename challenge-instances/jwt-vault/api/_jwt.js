// A minimal, hand-rolled JWT so the internals are visible -- and so the classic
// flaw is visible too. Underscore-prefixed => not a Vercel route, just a shared
// import.
//
// A JWT is three base64url parts joined by dots:  header.payload.signature
//   header    {"alg":"HS256","typ":"JWT"}
//   payload   your claims, e.g. {"user":"alice","role":"user"}
//   signature HMAC-SHA256(secret, header + "." + payload)
//
// THE BUG lives in verify(): it reads the algorithm FROM THE TOKEN and, if the
// token says "alg":"none", it skips signature checking entirely. That means a
// client can hand back a token they wrote themselves -- any claims they like,
// no secret needed. A correct verifier pins the algorithm on the server side
// and never honors "none".

const crypto = require('crypto');

const SECRET = process.env.JWT_SECRET || 'dev-only-not-the-real-secret';

function b64url(buf) {
  return Buffer.from(buf).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlJson(obj) { return b64url(JSON.stringify(obj)); }
function fromB64url(s) {
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
}

function hmac(data) {
  return b64url(crypto.createHmac('sha256', SECRET).update(data).digest());
}

// Issue a normal, correctly-signed HS256 token.
function sign(payload) {
  const header = b64urlJson({ alg: 'HS256', typ: 'JWT' });
  const body = b64urlJson(payload);
  const sig = hmac(`${header}.${body}`);
  return `${header}.${body}.${sig}`;
}

// Verify a token and return its payload, or null if it should be rejected.
function verify(token) {
  const parts = String(token).split('.');
  if (parts.length < 2) return null;
  const [h, p, sig] = parts;

  let header, payload;
  try {
    header = JSON.parse(fromB64url(h));
    payload = JSON.parse(fromB64url(p));
  } catch {
    return null;
  }

  // --- THE VULNERABILITY: the algorithm is taken from attacker-controlled
  //     header, and "none" means "don't bother checking the signature". A
  //     forged {"alg":"none"} token with any claims sails through.
  if (header.alg === 'none') {
    return payload;
  }

  // The HS256 path is actually fine -- you can't forge this without the secret.
  //   The correct fix for the whole function: decide the algorithm on the
  //   server (const expected = 'HS256') and reject anything else, including
  //   "none", BEFORE looking at the signature.
  if (header.alg === 'HS256') {
    const expected = hmac(`${h}.${p}`);
    if (sig && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
      return payload;
    }
  }
  return null;
}

module.exports = { sign, verify };
