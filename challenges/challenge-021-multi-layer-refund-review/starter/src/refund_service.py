from src.eligibility_rules import is_eligible
from src.models import RefundDecision


def process_refund(order_id, repository):
    """Look up the order, decide eligibility, and mark it refunded in the
    repository only if the refund is approved."""
    order = repository.get_order(order_id)
    if order is None:
        return RefundDecision(False, "order not found")

    repository.mark_refunded(order_id)  # BUG: marks refunded before checking eligibility

    if is_eligible(order):
        return RefundDecision(True, "approved")
    return RefundDecision(False, "not eligible")
