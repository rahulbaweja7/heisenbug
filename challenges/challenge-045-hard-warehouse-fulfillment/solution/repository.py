class FulfillmentRepository:
    def __init__(self, orders=None, warehouses=None):
        self.orders = orders or {}
        self.warehouses = warehouses or {}

    def add_order(self, order):
        self.orders[order.id] = order

    def add_warehouse(self, warehouse):
        self.warehouses[warehouse.id] = warehouse
