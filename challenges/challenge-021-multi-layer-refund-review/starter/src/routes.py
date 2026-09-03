from src.refund_service import process_refund


def handle_refund_request(order_id, repository):
    """Entry point simulating an HTTP handler for POST /refunds/{order_id}."""
    decision = process_refund(order_id, repository)
    return {"order_id": order_id, "approved": decision.approved, "reason": decision.reason}
