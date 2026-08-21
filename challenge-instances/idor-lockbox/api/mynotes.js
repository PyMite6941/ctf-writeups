// GET /api/mynotes   with header  Authorization: Bearer <token>
//
// Returns only the notes the session owns -- this endpoint DOES filter by owner,
// which is what makes the app look secure at a glance. The gap is that note.js
// (fetch-by-id) forgot to. Realistic IDOR is exactly this: one endpoint checks,
// a sibling one doesn't.

const { users, notes } = require('./_data');

function sessionUserId(req) {
  const auth = req.headers['authorization'] || '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  let id;
  try {
    id = Number(Buffer.from(m[1], 'base64').toString('utf8'));
  } catch {
    return null;
  }
  return users[id] ? id : null;
}

module.exports = (req, res) => {
  const uid = sessionUserId(req);
  if (!uid) {
    res.status(401).json({ error: 'not logged in' });
    return;
  }
  const mine = Object.entries(notes)
    .filter(([, n]) => n.owner === uid)
    .map(([id, n]) => ({ id: Number(id), title: n.title }));
  res.status(200).json({ user: users[uid].name, notes: mine });
};
