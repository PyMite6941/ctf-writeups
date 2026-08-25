// Seed data for the Vault challenge. Not a route (underscore prefix).
// The flag is on an admin-only document and comes from an env var (JWT_FLAG),
// so it is never committed -- source only ever has the placeholder.

const FLAG = process.env.JWT_FLAG || 'flag{local_dev_set_JWT_FLAG}';

// The player is given alice's credentials (role: user).
const users = {
  alice: { password: 'password123', role: 'user' },
  bob: { password: 'letmein', role: 'user' },
  // admin exists but you are NOT given the password -- becoming admin is the
  // whole challenge, and the intended path is forging the token, not this login.
  root: { password: crypto_random(), role: 'admin' },
};

// docs[id] -> { title, role, body }. The flag doc requires role "admin".
const docs = {
  1: { title: 'Welcome', role: 'user', body: 'Welcome to the Vault. Your documents are listed here.' },
  2: { title: 'Team offsite notes', role: 'user', body: 'Q3 offsite: kickoff Tuesday, retro Friday.' },
  3: { title: 'Root recovery kit', role: 'admin', body: `Break-glass credentials: ${FLAG}` },
};

// admin login is intentionally un-guessable; the challenge is JWT forgery.
function crypto_random() {
  return require('crypto').randomBytes(24).toString('hex');
}

module.exports = { users, docs };
