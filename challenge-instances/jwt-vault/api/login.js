// POST /api/login  { user, password }  ->  { token }
// Issues a correctly-signed HS256 JWT carrying the user's role. Nothing wrong
// here -- the flaw is in how the token is later verified (see api/_jwt.js).

const { users } = require('./_data');
const { sign } = require('./_jwt');

module.exports = (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST only' });
    return;
  }
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  const u = users[body.user];
  if (!u || u.password !== body.password) {
    res.status(401).json({ error: 'bad credentials' });
    return;
  }
  const token = sign({ user: body.user, role: u.role });
  res.status(200).json({ token, role: u.role });
};
