// GET /api/doc?id=<n>   Authorization: Bearer <jwt>
// Returns a document. Admin-only docs require role "admin" -- and this check is
// CORRECT (unlike Lockbox's IDOR). The way in is not a missing check here; it's
// that the caller can forge role:admin in a token the verifier wrongly trusts.

const { docs } = require('./_data');
const { verify } = require('./_jwt');

function claims(req) {
  const auth = req.headers['authorization'] || '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  return m ? verify(m[1]) : null;
}

module.exports = (req, res) => {
  const c = claims(req);
  if (!c) { res.status(401).json({ error: 'not logged in' }); return; }

  const doc = docs[Number(req.query.id)];
  if (!doc) { res.status(404).json({ error: 'no such document' }); return; }

  if (doc.role === 'admin' && c.role !== 'admin') {
    res.status(403).json({ error: 'admins only' });
    return;
  }
  res.status(200).json({ title: doc.title, body: doc.body });
};
