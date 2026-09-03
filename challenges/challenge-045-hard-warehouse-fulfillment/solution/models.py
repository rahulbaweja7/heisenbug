class Order:
    def __init__(self, order_id, quantity, shipping_zone, fraud_flagged=False):
        self.id = order_id
        self.quantity = quantity
        self.shipping_zone = shipping_zone
        self.fraud_flagged = fraud_flagged


class Warehouse:
    def __init__(self, warehouse_id, stock_available, supported_zones, orders_fulfilled_count=0):
        self.id = warehouse_id
        self.stock_available = stock_available
        self.supported_zones = supported_zones
        self.orders_fulfilled_count = orders_fulfilled_count
