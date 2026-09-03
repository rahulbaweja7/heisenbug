class BillingRepository:
    def __init__(self, subscriptions=None):
        self.subscriptions = subscriptions or {}

    def add_subscription(self, subscription):
        self.subscriptions[subscription.id] = subscription
