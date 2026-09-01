# Validator Bails Out After the First Field

## The bug

```python
for field in required_fields:
    if field not in form or not form[field]:
        missing.append(field)
        return missing
```

The `return missing` is inside the `if` block, inside the loop. As soon as
one required field is found missing, the function returns immediately —
any required fields checked *after* that one never get evaluated, even if
they're also missing.

## The fix

```python
for field in required_fields:
    if field not in form or not form[field]:
        missing.append(field)
return missing
```

Dedent the `return` so it only runs after the loop finishes, once every
field has been checked.

## How to spot this pattern faster

- A `return` (or `break`) nested inside a loop's `if` is worth a second look
  any time the function's job is to *collect* or *count* — those need to see
  every element, not bail on the first hit.
- Ask: "is this loop searching for one thing, or gathering all matching
  things?" `find_missing_fields` (plural, "fields") is a strong signal it
  should collect, not short-circuit.
- Test with at least two things wrong at once. A single-bad-input test can't
  distinguish "stops after the first miss" from "correctly finds all
  misses" — you need multiple missing fields in one call to catch this.
