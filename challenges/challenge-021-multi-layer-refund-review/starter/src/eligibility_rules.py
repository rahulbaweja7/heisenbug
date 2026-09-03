MAX_RETURN_WINDOW_DAYS = 30
MAX_PRIOR_REFUNDS = 3
ACCEPTABLE_CONDITIONS = {"unopened", "defective"}


def is_eligible(order):
    """An order is eligible for refund only if it's within the return
    window, the item is in acceptable condition, AND the customer hasn't
    exceeded their prior-refund limit."""
    within_window = order.days_since_purchase < MAX_RETURN_WINDOW_DAYS  # BUG: excludes day 30 itself
    good_condition = order.item_condition in ACCEPTABLE_CONDITIONS
    under_refund_limit = order.customer_prior_refunds < MAX_PRIOR_REFUNDS
    return within_window and good_condition or under_refund_limit  # BUG: wrong boolean grouping
