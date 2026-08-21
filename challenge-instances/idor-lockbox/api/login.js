// POST /api/login  { user, password }  ->  { token }
//
// The token is just the user's id, base64'd. That is deliberately weak, but it
// is NOT the intended bug here -- the point of this challenge is what happens
// *after* you hold a valid session (see api/note.js). Auth-token forgery is a
// later rung on the ladder.

const { users } = require('./_data');

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

  const entry = Object.entries(users).find(
    ([, u]) => u.name === body.user && u.password === body.password
  );
  if (!entry) {
    res.status(401).json({ error: 'bad credentials' });
    return;
  }

  const [id] = entry;
  const token = Buffer.from(String(id)).toString('base64');
  res.status(200).json({ token, userId: Number(id) });
};
