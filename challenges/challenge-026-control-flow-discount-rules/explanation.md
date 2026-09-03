# Discount Engine Ignores Every Rule But the First

## The bug

```python
for condition, discount in rules:
    if condition(price):
        return price * (1 - discount)
    return price
```

The second `return price` sits inside the loop body but outside the `if`
— so on the very first iteration, if that rule's condition doesn't match,
the function returns immediately with the original price, never even
looking at the second, third, or any later rule. Only a price that
happens to match the *first* rule in the list ever gets a discount.

## The fix

```python
for condition, discount in rules:
    if condition(price):
        return price * (1 - discount)
return price
```

Dedent the fallback `return price` so it only runs after the loop
finishes checking every rule, not after just the first one.

## How to spot this pattern faster

- A `return` (or `break`) sitting at the same indentation level as an
  `if` inside a loop — rather than nested only inside the `if`'s `else`
  or after the loop — is worth a second look any time the function is
  supposed to check multiple items before giving up.
- The function's own name, "first matching," is a strong hint the loop
  needs to keep going past non-matches. "First matching X" always implies
  scanning until a match is found or the options run out — not stopping
  at the first item checked.
- Test with at least two rules where the *first* one doesn't match but a
  *later* one does. A test suite where the matching rule always happens
  to be first can't distinguish "checks all rules in order" from "only
  ever checks the first one."
