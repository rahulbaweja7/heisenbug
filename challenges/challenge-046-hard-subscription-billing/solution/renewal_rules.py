GRACE_PERIOD_DAYS = 7


def is_renewable(subscription):
    not_cancelled = not subscription.cancelled
    payment_ok = subscription.payment_method_valid
    within_grace = subscription.days_since_due <= GRACE_PERIOD_DAYS
    return not_cancelled and payment_ok and within_grace
