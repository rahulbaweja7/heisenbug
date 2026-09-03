class ShoppingCart:
    def __init__(self, items=[]):  # BUG: mutable default argument shared across instances
        self.items = items

    def add(self, item):
        self.items.append(item)
