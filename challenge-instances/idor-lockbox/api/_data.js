// Seed data for the Lockbox challenge. Underscore-prefixed files under /api are
// NOT routed by Vercel, so this is a shared import, not an endpoint.
//
// The flag lives on the admin's note and comes from an env var so it is never
// committed. Set LOCKBOX_FLAG in the Vercel project settings; locally it falls
// back to an obvious placeholder.

const FLAG = process.env.LOCKBOX_FLAG || 'flag{local_dev_set_LOCKBOX_FLAG}';

// users[id] -> { name, password }. The player is given bob's credentials.
const users = {
  1: { name: 'admin', password: 'c0rrect-h0rse-battery' },
  2: { name: 'alice', password: 'sunshine2019' },
  3: { name: 'bob', password: 'hunter2' },
};

// notes[id] -> { owner, title, body }. Note 1 is the admin's and holds the flag.
const notes = {
  1: { owner: 1, title: 'infra credentials', body: `Root recovery phrase: ${FLAG}` },
  2: { owner: 2, title: 'grocery list', body: 'oat milk, eggs, coffee' },
  3: { owner: 3, title: 'todo', body: 'renew domain, back up laptop, learn CTF' },
};

module.exports = { users, notes };
