from src.rates import RATE_TIERS


def calculate_shipping_cost(weight_kg):
    """Look up the rate tier for weight_kg and return the total cost."""
    for max_weight, rate in RATE_TIERS:
        if weight_kg < max_weight:  # BUG: excludes packages exactly at the boundary
            return weight_kg * rate
    return weight_kg * RATE_TIERS[-1][1]
