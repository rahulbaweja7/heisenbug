ELIGIBLE_TIERS = ("gold", "platinum")


def is_upgrade_eligible(passenger, flight):
    good_tier = passenger.loyalty_tier in ELIGIBLE_TIERS
    no_show_ok = passenger.no_show_count == 0
    seat_available = flight.upgrade_seats_available > 0
    return good_tier and no_show_ok and seat_available
