# Support Queue Shows Newest Tickets First

## The bug

```python
return sorted(tickets, key=lambda t: t["created_at"], reverse=True)
```

`reverse=True` sorts from highest to lowest — the newest ticket
(highest `created_at`) ends up first. The function is supposed to surface
the ticket that's been waiting *longest*, which means the lowest
`created_at` should come first.

## The fix

```python
return sorted(tickets, key=lambda t: t["created_at"])
```

Dropping `reverse=True` restores the default ascending order: oldest
(smallest value) first.

## How to spot this pattern faster

- Whenever you see `sorted(..., reverse=True)`, stop and ask: does the
  spec actually want descending order here, or did someone default to
  `reverse=True` out of habit? "Oldest first," "lowest price first,"
  "first in line" all mean ascending — no `reverse=True` needed.
- This bug produces a fully sorted, valid-looking list — just backwards.
  It won't crash and won't look obviously wrong at a glance, so test with
  at least 3 distinct values and check the exact order, not just that the
  list "looks sorted."
