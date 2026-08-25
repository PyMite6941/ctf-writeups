// GET /api/docs   Authorization: Bearer <jwt>
// Lists the documents visible to the caller's role. Titles only.

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

  const visible = Object.entries(docs)
    .filter(([, d]) => d.role === 'user' || c.role === 'admin')
    .map(([id, d]) => ({ id: Number(id), title: d.title, role: d.role }));
  res.status(200).json({ role: c.role, docs: visible });
};
