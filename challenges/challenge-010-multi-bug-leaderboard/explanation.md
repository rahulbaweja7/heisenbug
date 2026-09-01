# Leaderboard Ranking Has Two Separate Bugs

## Bug 1: wrong comparison direction

```python
return sorted(players, key=lambda p: p["score"])
```

`sorted()` defaults to ascending order. A leaderboard needs the highest
score first, so this needs `reverse=True`. Without it, the "top" player is
actually the *lowest*-scoring one.

**Fix:**

```python
return sorted(players, key=lambda p: p["score"], reverse=True)
```

## Bug 2: off-by-one in the slice

```python
top = ranked[:n - 1]
```

To take the top `n` players, the slice needs to be `ranked[:n]`. Using
`n - 1` drops the last player that should have been included — asking for
the top 2 only returns 1 player, and asking for the top 1 returns 0 players
(then crashes dividing by `len(top) == 0`).

**Fix:**

```python
top = ranked[:n]
```

## How to spot this pattern faster

- These two bugs are independent — fixing one doesn't fix the other, and a
  test can pass on one while failing on the other. Don't stop debugging
  after the first fix; rerun the full suite.
- `sorted(...)` without `reverse=True` defaulting to ascending is an easy
  bug to miss when skimming, since the code *looks* like it's sorting
  correctly — the mistake is only in what's *not* there.
- A slice like `[:n - 1]` right next to a variable named `n` (implying "take
  n items") is a strong red flag — read it literally: "take n minus one
  items," and ask whether that matches the function's stated contract.
