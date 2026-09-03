class Order:
    def __init__(
        self,
        order_id,
        amount,
        days_since_purchase,
        item_condition,
        customer_prior_refunds,
    ):
        self.order_id = order_id
        self.amount = amount
        self.days_since_purchase = days_since_purchase
        self.item_condition = item_condition  # "unopened", "defective", or "used"
        self.customer_prior_refunds = customer_prior_refunds
        self.refunded = False


class RefundDecision:
    def __init__(self, approved, reason):
        self.approved = approved
        self.reason = reason
