from src.eligibility_rules import is_eligible
from src.models import RefundDecision


def process_refund(order_id, repository):
    """Look up the order, decide eligibility, and mark it refunded in the
    repository only if the refund is approved."""
    order = repository.get_order(order_id)
    if order is None:
        return RefundDecision(False, "order not found")

    if is_eligible(order):
        repository.mark_refunded(order_id)
        return RefundDecision(True, "approved")
    return RefundDecision(False, "not eligible")
