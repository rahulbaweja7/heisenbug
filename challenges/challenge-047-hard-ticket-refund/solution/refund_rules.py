REFUND_WINDOW_DAYS = 14


def is_refundable(ticket, event):
    not_used = not ticket.used
    event_not_started = event.days_until_event > 0
    within_window = ticket.purchase_days_ago <= REFUND_WINDOW_DAYS
    return not_used and event_not_started and within_window
