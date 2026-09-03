def apply_first_matching_discount(price, rules):
    """Apply the discount from the first matching rule, checked in order."""
    for condition, discount in rules:
        if condition(price):
            return price * (1 - discount)
        return price  # BUG: gives up after the first rule regardless of whether it matched
    return price
