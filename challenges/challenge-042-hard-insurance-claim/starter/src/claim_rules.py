def is_claim_valid(policy, claim):
    within_window = claim.days_since_incident <= policy.coverage_window_days
    within_limit = claim.amount < policy.coverage_limit
    return within_window and within_limit
