# CryptoHack Writeup Stubs

Auto-generated writeup skeletons for every CryptoHack challenge (305 total),
so you never have to hand-type titles, categories, links, or descriptions.
You only fill in the "how I solved it" part.

## Workflow

```bash
# refresh the catalog (only needed when CryptoHack adds challenges)
python cryptohack_stubber.py fetch

# (re)create any missing stub files
python cryptohack_stubber.py stubs

# mark a solve done so it shows up as progress
python cryptohack_stubber.py solve rsa "Monoprime"
# ...or with just a fuzzy name
python cryptohack_stubber.py solve general "Favourite byte"

# see progress at a glance
python cryptohack_stubber.py check
python cryptohack_stubber.py check rsa
```

## Output layout

```
ctf-prep/writeups/cryptohack/
  general/ascii.md
  rsa/monoprime.md
  cryptography/...           # each of the 13 categories
```

Every stub contains: category, points, direct link to the challenge, the full
description pulled from CryptoHack, and sections for Approach / Solution /
Key takeaway. Flip the header to `**Status:** solved` (or run `solve`) and add
your script — the description stays attached for later reference.

## What this is for

Your university apps need verifiable security signals. The **public CryptoHack
profile** plus a **GitHub writeups repo** are the two citable artifacts. These
stubs are the writeup repo. Solve a challenge, paste your 3-6 sentence approach
and the script into the stub, and each solves becomes a portfolio entry.

Tip: after solving on CryptoHack, keep the description for your GitHub repo —
but **redact the flag** for still-live challenges (see `CTF-Writeups-Guide.md`).