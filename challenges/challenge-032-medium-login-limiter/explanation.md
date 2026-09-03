# Login Attempts Leak Across Different Users

## The bug

```python
def __init__(self, failures={}):
```

The same mutable-default-argument trap as before, applied to a
constructor again: `{}` is created once at class-definition time, so
every `AttemptTracker()` created without an explicit `failures` argument
shares the same dict. Recording a failure on one tracker instance leaks
into every other tracker created the same way.

## The fix

```python
def __init__(self, failures=None):
    self.failures = dict(failures) if failures is not None else {}
```

## How to spot this pattern faster

- `attempts.py` has the bug; `auth.py`'s logic (`>= 3`) is completely
  correct. When a multi-file bug report says "lockout isn't working
  right," check the data layer before assuming the decision logic is
  wrong.
- This is the third time this exact pattern has shown up across this
  challenge set (function default, class default, and now a *dict*
  default instead of a list) — once you've internalized "never use a
  mutable literal as a default argument," you'll spot it instantly
  regardless of which container type it uses.
- Test by creating two independent instances and checking one doesn't see
  the other's state — a test that only ever creates one instance can't
  catch this.
