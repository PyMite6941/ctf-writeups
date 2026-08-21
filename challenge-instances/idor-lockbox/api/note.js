// GET /api/note?id=<n>   with header  Authorization: Bearer <token>
//
// THE VULNERABILITY LIVES HERE. The handler checks that you have a *valid
// session* (authentication) but never checks that the note you asked for
// *belongs to you* (authorization). So a logged-in bob can read note id=1,
// the admin's note, and lift the flag.
//
// The one-line fix is commented below -- that comparison is the whole lesson.

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

  const id = Number(req.query.id);
  const note = notes[id];
  if (!note) {
    res.status(404).json({ error: 'no such note' });
    return;
  }

  // --- THE BUG: no ownership check. The fix would be:
  //     if (note.owner !== uid) { res.status(403).json({ error: 'forbidden' }); return; }
  // Uncomment that line and the challenge becomes unsolvable -- which is how you
  // know that single comparison is exactly what IDOR is about.

  res.status(200).json({
    id,
    title: note.title,
    body: note.body,
    owner: users[note.owner].name,
  });
};
