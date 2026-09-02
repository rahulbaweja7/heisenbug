# One Bad Order Stops the Whole Batch

## The bug

```python
if order["amount"] is None:
    break
```

`break` exits the loop entirely — as soon as one invalid order is hit,
every order after it is never even looked at, valid or not. The function
was supposed to *skip* bad orders, not treat one as a signal to give up on
the rest of the batch.

## The fix

```python
if order["amount"] is None:
    continue
```

`continue` skips just this iteration and moves on to the next order,
which is what "skip the invalid ones" actually means.

## How to spot this pattern faster

- `break` and `continue` are easy to mix up under time pressure — they
  look similar and both interrupt a loop, but `break` stops everything and
  `continue` skips just the current item. Read the spec's verb carefully:
  "skip" almost always means `continue`, "stop" means `break`.
- This bug is invisible if the only invalid order in your test data happens
  to be the *last* one in the list — always test with a bad order stuck in
  the *middle*, so anything wrongly dropped after it is obvious.
