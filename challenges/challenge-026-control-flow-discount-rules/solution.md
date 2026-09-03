# Solution

## Approach

The fallback `return price` was indented to sit inside the loop body
(but outside the `if`), so it executed on the first iteration whenever
that rule didn't match — short-circuiting before any later rule got a
chance. Moving it outside the loop entirely means it only runs once every
rule has been checked and none matched.

## Solution

```python
def apply_first_matching_discount(price, rules):
    """Apply the discount from the first matching rule, checked in order."""
    for condition, discount in rules:
        if condition(price):
            return price * (1 - discount)
    return price
```

## Why this works

Now the loop only exits early (via `return`) when a rule actually
matches. If no rule matches during the entire loop, control falls
through to the final `return price` after the loop — so every rule gets
a fair chance to match before the function gives up.
