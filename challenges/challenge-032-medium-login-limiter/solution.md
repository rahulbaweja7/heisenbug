# Solution

## Approach

`AttemptTracker.__init__` used `{}` as a mutable default argument, so
every tracker created without an explicit `failures` dict shared the same
underlying object. Switching to the `None` sentinel pattern gives each
tracker its own independent dict.

## Solution

```python
class AttemptTracker:
    def __init__(self, failures=None):
        self.failures = dict(failures) if failures is not None else {}

    def record_failure(self, username):
        self.failures[username] = self.failures.get(username, 0) + 1

    def get_failures(self, username):
        return self.failures.get(username, 0)
```

`auth.py`'s `is_locked_out` needed no changes.

## Why this works

Each `AttemptTracker()` call now either copies a passed-in dict or builds
a fresh empty one — never the same shared object across instances — so
failures recorded on one tracker have zero effect on any other tracker.
