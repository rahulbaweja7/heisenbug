class ShoppingCart:
    def __init__(self, items=None):
        self.items = list(items) if items is not None else []

    def add(self, item):
        self.items.append(item)
