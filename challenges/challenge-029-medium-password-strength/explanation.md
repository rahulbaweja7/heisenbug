# Weak Passwords Pass the Strength Check

## The bug

```python
return has_min_length(password) or has_digit(password) or has_uppercase(password)
```

`or` returns `True` as soon as **any one** rule passes — so a password
that's long enough but has no digit or uppercase letter still counts as
strong, since it satisfies `has_min_length`. The function needs *every*
rule to pass, which means combining them with `and`, not `or`.

## The fix

```python
return has_min_length(password) and has_digit(password) and has_uppercase(password)
```

## How to spot this pattern faster

- `and`/`or` bugs are easy to introduce when combining multiple checks —
  read the spec's language literally: "every rule" means `and`, "any
  rule" means `or`.
- Trace it across files: `validator.py` combines rules defined in
  `rules.py` — the individual rule functions themselves were correct, the
  bug was purely in how they were combined. Don't assume the bug lives in
  the file with the most code.
- Test with a password that passes exactly one rule and fails the other
  two — that's the case that distinguishes `or` from `and`.
