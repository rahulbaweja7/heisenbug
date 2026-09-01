# Free Shipping Excludes the Exact Threshold

## The bug

```python
return cart_total > 50
```

The spec says "$50 or more," but `>` excludes `50` itself — only totals
strictly greater than 50 qualify.

## The fix

```python
return cart_total >= 50
```

## How to spot this pattern faster

- "X or more" / "at least X" always means `>=`, never `>`. Translate the
  English spec into the comparison operator explicitly before trusting
  what's written in the code.
- Always test the boundary value itself (`50`), not just values clearly
  above or below it — that's the only input that can catch a `>` vs `>=`
  mistake.
