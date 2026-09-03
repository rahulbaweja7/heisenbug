# Article URLs Break on Capitalized Titles

## The bug

```python
return text.replace(" ", "-")
```

`slugify` only replaces spaces with hyphens — it never lowercases the
text. `"Hello World"` becomes `"Hello-World"` instead of
`"hello-world"`, which breaks the convention that URL slugs are always
lowercase (and can cause the same article to end up reachable at multiple
different-cased URLs).

## The fix

```python
return text.lower().replace(" ", "-")
```

## How to spot this pattern faster

- `article.py` calls `slugify()` correctly — the bug is entirely inside
  `text_utils.py`. When a symptom shows up in one file's output, trace
  back to where the actual transformation happens rather than assuming
  the caller is at fault.
- "Slug," "URL-safe," and "identifier" almost always imply lowercase by
  convention, even if the spec doesn't spell it out explicitly — worth
  double-checking any text-transformation function against that
  assumption.
- Test with a title that has uppercase letters — an all-lowercase test
  title can't distinguish "slugify lowercases correctly" from "slugify
  never touches case at all."
