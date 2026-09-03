# (max_weight_kg, rate_per_kg), checked in order; the last tier has no upper bound
RATE_TIERS = [
    (1, 5.00),
    (5, 3.50),
    (20, 2.00),
    (float("inf"), 1.25),
]
