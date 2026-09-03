class Subscription:
    def __init__(self, sub_id, cancelled, payment_method_valid, days_since_due, renewal_count=0):
        self.id = sub_id
        self.cancelled = cancelled
        self.payment_method_valid = payment_method_valid
        self.days_since_due = days_since_due
        self.renewal_count = renewal_count
