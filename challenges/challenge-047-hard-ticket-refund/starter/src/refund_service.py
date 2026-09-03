from src.refund_rules import is_refundable


class RefundDeniedError(Exception):
    pass


def refund_ticket(ticket_id, repository):
    ticket = repository.tickets[ticket_id]
    event = repository.events[ticket.event_id]

    ticket.refunded = True
    event.refunds_issued_count += 1

    if not is_refundable(ticket, event):
        raise RefundDeniedError(f"Ticket {ticket_id} is not refundable")

    return True
