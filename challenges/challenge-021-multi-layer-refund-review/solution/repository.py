class OrderRepository:
    def __init__(self):
        self._orders = {}

    def add_order(self, order):
        self._orders[order.order_id] = order

    def get_order(self, order_id):
        return self._orders.get(order_id)

    def mark_refunded(self, order_id):
        order = self._orders.get(order_id)
        if order:
            order.refunded = True
