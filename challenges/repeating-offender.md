# Repeating Offender

- **Category:** Cryptography
- **Difficulty:** easy
- **Points:** 50
- **Published:** 2026-08-12
- **Files:** files/repeating-offender.txt

## Brief

A message was encrypted by XOR-ing it against a short word, repeated end to end
for as long as the message lasted. All you get is the result, as hex.

The key is a single lowercase English word. Recover the message and read the
flag out of it.

## Hint

XOR is its own inverse, so `plaintext ^ key = ciphertext` also means
`ciphertext ^ key = plaintext`. You don't know the key — but you do know what
English looks like, and every tenth byte was encrypted with the same one.
