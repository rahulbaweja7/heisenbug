# Tag List Remembers Tags From Previous Calls

## The bug

```python
def add_unique_tag(tag, existing=[]):
```

Default argument values in Python are evaluated **once**, when the function
is defined — not once per call. Since `[]` is a mutable object, every call
that doesn't pass its own `existing` argument shares the *exact same list
object*. The function then mutates it with `.append()`, so tags from one
call silently persist into the next, completely unrelated call.

## The fix

```python
def add_unique_tag(tag, existing=None):
    tags = list(existing) if existing is not None else []
```

Use `None` as the default sentinel and create a fresh list (or a copy of
the caller's list) inside the function body, every call.

## How to spot this pattern faster

- `def f(x, arg=[])`, `def f(x, arg={})`, or any mutable literal
  (`[]`/`{}`/`set()`) as a default argument value is one of Python's most
  famous gotchas — treat it as an instant red flag whenever you see it,
  regardless of whether the function looks otherwise correct.
- The symptom is sneaky: the function works perfectly on the *first* call
  in a test run and only misbehaves once it's called a second time without
  explicit arguments — so a single, isolated test can completely miss it.
- Reproduce it in your head (or literally) by calling the function twice in
  a row with different inputs and no optional argument — if the second
  call "remembers" something from the first, that's this bug.
