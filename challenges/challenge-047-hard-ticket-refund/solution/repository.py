class TicketRepository:
    def __init__(self, events=None, tickets=None):
        self.events = events or {}
        self.tickets = tickets or {}

    def add_event(self, event):
        self.events[event.id] = event

    def add_ticket(self, ticket):
        self.tickets[ticket.id] = ticket
