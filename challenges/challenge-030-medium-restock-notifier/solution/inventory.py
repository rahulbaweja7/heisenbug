class Item:
    def __init__(self, sku, quantity, reorder_threshold):
        self.sku = sku
        self.quantity = quantity
        self.reorder_threshold = reorder_threshold
