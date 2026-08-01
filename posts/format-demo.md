---
title: Format Demo — delete this before publishing
platform: Example
category: Meta
difficulty: Intro
date: 2026-08-02
tools: none
---

This post exists so you can see how every markdown feature renders before you
write a real writeup. **It is not a real solve** — delete it (and its entry in
`posts/manifest.json`) once you've published your first genuine writeup.

## Headings, text and links

Regular paragraph text with **bold**, *italic*, `inline code`, and a
[link](https://picoctf.org).

### A third-level heading

Sub-sections render like this.

## Blockquotes — use these for the challenge prompt

> Can you find the flag hidden in this file? It shouldn't be too hard.
>
> `challenge.zip`

## Code blocks with syntax highlighting

Shell commands and their output:

```bash
$ file challenge
challenge: ELF 64-bit LSB executable, x86-64, dynamically linked

$ strings challenge | grep -i flag
# no output — nothing hardcoded
```

Python, highlighted automatically by language tag:

```python
from pwn import *

io = process("./challenge")
io.sendline(b"A" * 64 + p64(0xdeadbeef))
io.interactive()
```

## Tables

| Attempt | Approach          | Result                        |
| ------- | ----------------- | ----------------------------- |
| 1       | `strings`         | Nothing — binary is packed    |
| 2       | `upx -d`          | Unpacked successfully         |
| 3       | `strings` again   | Flag visible in `.rodata`     |

Wide tables scroll horizontally on mobile rather than breaking the layout.

## Lists

Unordered:

- First observation
- Second observation
  - A nested detail
- Third observation

Ordered:

1. Run recon
2. Form a hypothesis
3. Test it
4. Write down what failed

## Horizontal rules

---

## Images

Drop screenshots into `assets/img/` and reference them relatively:

```markdown
![Ghidra control flow graph](assets/img/ghidra-cfg.png)
```

Use these sparingly — text is searchable, copyable and smaller. Screenshot only
when the visual *is* the point.

## Flags

Withhold flags for anything still live:

`picoCTF{REDACTED}` — challenge is still open, flag withheld.
