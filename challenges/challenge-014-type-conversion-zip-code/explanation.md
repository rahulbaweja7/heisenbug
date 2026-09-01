# Zip Code Loses Its Leading Zero

## The bug

```python
return str(int(zip_str.strip()))
```

Routing the zip code through `int()` treats it as a number. Numbers don't
have leading zeros — `int("02139")` is `2139`, and converting that back to
a string gives `"2139"`, silently dropping the leading digit. A zip code is
an *identifier* made of digits, not a quantity, so it should never be
converted to a numeric type at all.

## The fix

```python
return zip_str.strip()
```

Just strip whitespace and keep it as a string — no numeric conversion
needed or wanted.

## How to spot this pattern faster

- Any time a value is described as a "code" (zip code, ID number, phone
  number, account number) rather than a "count" or "amount," treat it as a
  string, never convert it through `int()`/`float()`. Converting to a
  number and back is a classic way to accidentally lose leading zeros or
  formatting.
- This bug is invisible if your only test data happens to not have leading
  zeros (e.g. "90210") — always include at least one test case that starts
  with `0` when the input is an identifier-like string of digits.
- `str(int(x))` chained together on something that's already a string is
  worth a second look — ask why the value needed to become a number at all
  if it's just being turned back into a string immediately after.
