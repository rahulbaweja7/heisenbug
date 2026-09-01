# Cart Total Drops the Cents

## The bug

```python
total += int(price)
```

`price` is a string like `"12.50"`. `int("12.50")` doesn't truncate to
`12` — it raises `ValueError: invalid literal for int() with base 10:
'12.50'`, because `int()` refuses to parse a string containing a decimal
point at all. Prices are inherently fractional (dollars and cents); using
the wrong numeric type for the conversion breaks on the very first
non-whole price.

## The fix

```python
total += float(price)
```

`float()` correctly parses decimal strings, and starting `total` as `0.0`
keeps the running sum a float throughout.

## How to spot this pattern faster

- Whenever you see `int(...)` applied to something that represents money,
  a measurement, or any real-world quantity, ask: "can this value ever have
  a fractional part?" Money almost always can.
- `int("12.50")` failing outright (rather than silently truncating) is
  actually the friendlier failure mode — but don't rely on it. The same bug
  with whole-number-looking strings (`"12"`) would silently "work" while
  still being the wrong type choice, and would break the moment a decimal
  price showed up in production.
- When a bug report says "totals are wrong" or "it crashed on this specific
  input," check whether the input format (string, decimal, currency) matches
  the assumptions baked into the conversion function being used.
