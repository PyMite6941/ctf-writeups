---
title: "Repeating Offender"
category: "Cryptography"
difficulty: "easy"
points: 50
published: "2026-08-12"
files: ["repeating-offender.txt"]
flagHash: "2eb2d887a757d98bb830b6f09ad0d86dd2cebe3296049cfe49a4b4cedf06329b"
---
## Brief

A message was encrypted by XOR-ing it against a short word, repeated end to end
for as long as the message lasted. All you get is the result, as hex.

The key is a single lowercase English word. Recover the message and read the
flag out of it.

## Hint

XOR is its own inverse, so `plaintext ^ key = ciphertext` also means
`ciphertext ^ key = plaintext`. You don't know the key — but you do know what
English looks like, and every tenth byte was encrypted with the same one.
