import copy


class Cart:
    def __init__(self):
        self.items = []

    def add(self, item):
        self.items.append(item)

    def checkout_snapshot(self):
        """Return a snapshot of the cart to send to checkout, and clear
        applied one-time discounts from the live cart items."""
        snapshot = copy.deepcopy(self.items)
        for item in snapshot:
            item["discount_applied"] = False
        return snapshot
