from src.refund_service import refund_ticket, RefundDeniedError


def handle_refund_request(ticket_id, repository):
    try:
        refund_ticket(ticket_id, repository)
        return {"status": "refunded", "ticket_id": ticket_id}
    except RefundDeniedError as e:
        return {"status": "denied", "reason": str(e)}
    except KeyError:
        return {"status": "error", "reason": "ticket not found"}
