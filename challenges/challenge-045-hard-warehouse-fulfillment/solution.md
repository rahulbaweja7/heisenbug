# Solution

## Approach

`fulfillment_rules.py` needs the fraud check actually negated, and
`fulfillment_service.py` needs the stock/count mutations moved after
the `can_fulfill` check.

## Solution

```python
# fulfillment_rules.py
def can_fulfill(order, warehouse):
    enough_stock = warehouse.stock_available >= order.quantity
    zone_supported = order.shipping_zone in warehouse.supported_zones
    not_fraud = not order.fraud_flagged
    return enough_stock and zone_supported and not_fraud
```

```python
# fulfillment_service.py
def fulfill_order(order_id, warehouse_id, repository):
    order = repository.orders[order_id]
    warehouse = repository.warehouses[warehouse_id]

    if not can_fulfill(order, warehouse):
        raise FulfillmentDeniedError(f"Order {order_id} cannot be fulfilled from warehouse {warehouse_id}")

    warehouse.stock_available -= order.quantity
    warehouse.orders_fulfilled_count += 1

    return True
```

## Why this works

`not order.fraud_flagged` correctly excludes fraud-flagged orders.
Checking `can_fulfill` before touching warehouse state means a denied
order leaves stock and the fulfilled count untouched, and the
eligibility check always sees the warehouse's true, pre-mutation stock.
