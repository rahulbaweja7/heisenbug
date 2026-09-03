from src.fulfillment_rules import can_fulfill


class FulfillmentDeniedError(Exception):
    pass


def fulfill_order(order_id, warehouse_id, repository):
    order = repository.orders[order_id]
    warehouse = repository.warehouses[warehouse_id]

    if not can_fulfill(order, warehouse):
        raise FulfillmentDeniedError(f"Order {order_id} cannot be fulfilled from warehouse {warehouse_id}")

    warehouse.stock_available -= order.quantity
    warehouse.orders_fulfilled_count += 1

    return True
