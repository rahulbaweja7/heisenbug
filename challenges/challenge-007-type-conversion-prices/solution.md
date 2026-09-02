# Solution

## Approach

`int()` can't parse a string with a decimal point at all — `int("12.50")`
raises `ValueError` rather than truncating. Prices are inherently
fractional, so the conversion needs to be `float()`, not `int()`. Starting
the accumulator as `0.0` (instead of `0`) also keeps the running total a
float throughout.

## Solution

```python
def total_price(price_strings):
    """Sum a list of price strings like "12.50" and return the total."""
    total = 0.0
    for price in price_strings:
        total += float(price)
    return total
```

## Why this works

`float()` correctly parses decimal strings like `"12.50"` into `12.5`, so
each price string converts cleanly and the running sum stays accurate
down to the cents.
