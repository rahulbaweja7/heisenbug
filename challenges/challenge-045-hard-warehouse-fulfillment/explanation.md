# Two Bugs, Two Layers

## Bug 1: missing negation on the fraud check

```python
not_fraud = order.fraud_flagged
```

The variable is named `not_fraud`, but it's assigned the flag directly
instead of its negation — so a fraud-flagged order (`fraud_flagged =
True`) reads as `not_fraud = True` and sails through, while a clean
order (`fraud_flagged = False`) reads as `not_fraud = False` and gets
wrongly denied.

**Fix:**

```python
not_fraud = not order.fraud_flagged
```

## Bug 2: stock changes before eligibility is known

```python
warehouse.stock_available -= order.quantity
warehouse.orders_fulfilled_count += 1

if not can_fulfill(order, warehouse):
    raise FulfillmentDeniedError(...)
```

Stock is decremented and the fulfilled count bumped *before* checking
whether the order can actually be fulfilled. A denied order still
drains inventory and counts as fulfilled in the warehouse's stats —
and since the check runs against the already-decremented stock, it can
even throw off the stock comparison itself.

**Fix:** check `can_fulfill` first, and only mutate warehouse state
once the order is confirmed fulfillable.

## How to spot this pattern faster

- A variable named `not_x` should contain a negation — if the
  assignment doesn't have a `not` in it, that's a strong signal
  something was left out.
- Same signature as other challenges in this set: inventory and usage
  counters should only change after the decision that justifies the
  change, not before.
