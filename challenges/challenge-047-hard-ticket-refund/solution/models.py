class Event:
    def __init__(self, event_id, days_until_event, refunds_issued_count=0):
        self.id = event_id
        self.days_until_event = days_until_event
        self.refunds_issued_count = refunds_issued_count


class Ticket:
    def __init__(self, ticket_id, event_id, used, purchase_days_ago, refunded=False):
        self.id = ticket_id
        self.event_id = event_id
        self.used = used
        self.purchase_days_ago = purchase_days_ago
        self.refunded = refunded
