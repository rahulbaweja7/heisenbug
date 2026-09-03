# Removing the File Extension Strips Every Dot

## The bug

```python
return filename.replace(".", "")
```

`.replace(".", "")` removes **every** occurrence of `"."` in the string,
not just the one before the extension. For `"report.v2.final.pdf"`, that
strips all three dots, producing `"reportv2finalpdf"` — completely
mangling the filename instead of just removing `.pdf`.

## The fix

```python
if "." not in filename:
    return filename
return filename.rsplit(".", 1)[0]
```

## How to spot this pattern faster

- `.replace()` operates on *every* match in the string by default — it
  has no concept of "the last one" or "the extension." Any time you want
  to affect only one specific occurrence (especially the last), `.replace()`
  is almost always the wrong tool.
- `.rsplit(".", 1)` splits from the right and stops after the first split
  found, which is exactly "everything before the last dot" — a much
  better match for "strip the extension" than a blanket replace.
- Test with a filename that has more than one dot — a test using only
  `"report.pdf"` (one dot) can't distinguish "removed the last dot" from
  "removed every dot," since they produce the same result in that case.
