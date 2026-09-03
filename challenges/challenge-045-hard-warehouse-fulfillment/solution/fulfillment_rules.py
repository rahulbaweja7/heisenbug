def can_fulfill(order, warehouse):
    enough_stock = warehouse.stock_available >= order.quantity
    zone_supported = order.shipping_zone in warehouse.supported_zones
    not_fraud = not order.fraud_flagged
    return enough_stock and zone_supported and not_fraud
