# Solution

## Approach

Two independent bugs, fixed separately:

1. **`rank_players`** was missing `reverse=True` — `sorted()` defaults to
   ascending, so the lowest scorer came out first instead of the highest.
2. **`top_n_average`** sliced `ranked[:n - 1]` instead of `ranked[:n]`,
   dropping one player from the "top n" — asking for the top 2 only
   averaged 1 player, and asking for the top 1 averaged 0 (crashing on the
   division).

## Solution

```python
def rank_players(players):
    """Return players sorted by score, highest first."""
    return sorted(players, key=lambda p: p["score"], reverse=True)


def top_n_average(players, n):
    """Return the average score of the top n players."""
    ranked = rank_players(players)
    top = ranked[:n]
    return sum(p["score"] for p in top) / len(top)
```

## Why this works

`reverse=True` makes `rank_players` sort highest-score-first, matching
its docstring. `ranked[:n]` then takes exactly the first `n` players from
that correctly-ordered list — no off-by-one — so the average is computed
over the actual top `n`, not `n - 1`.
