# Two Bugs, Two Layers

## Bug 1: `and` instead of `or` requires every red flag at once

```python
return too_many_reports and has_blocked_word and low_trust
```

The rule is "flag if **any** of these is true," but `and` requires
**all three** simultaneously. A post with 5 reports, clean text, and a
trustworthy author should be flagged for reports alone — instead it
passes because it doesn't also contain a blocked word and doesn't also
have a low-trust author.

**Fix:**

```python
return too_many_reports or has_blocked_word or low_trust
```

## Bug 2: `total_flags` increments before the flag decision is known

```python
repository.stats.total_flags += 1

flagged = should_flag(post)
post.flagged = flagged
return flagged
```

The stats counter increments unconditionally for every post reviewed,
regardless of whether it actually gets flagged.

**Fix:** compute `flagged` first, and only increment `total_flags`
when it's `True`.

## How to spot this pattern faster

- When a rule description says "if any of," count how many conditions
  must independently be able to trigger it on their own — then check
  whether the code's `and`/`or` choice actually allows that.
- Same signature as other challenges in this set: a counter meant to
  track an outcome should be updated after the outcome is known, not
  before.
