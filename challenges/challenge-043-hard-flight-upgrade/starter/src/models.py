class Passenger:
    def __init__(self, passenger_id, loyalty_tier, no_show_count, upgrades_used=0):
        self.id = passenger_id
        self.loyalty_tier = loyalty_tier
        self.no_show_count = no_show_count
        self.upgrades_used = upgrades_used


class Flight:
    def __init__(self, flight_id, upgrade_seats_available):
        self.id = flight_id
        self.upgrade_seats_available = upgrade_seats_available
