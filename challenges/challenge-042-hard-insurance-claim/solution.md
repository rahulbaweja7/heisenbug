# Solution

## Approach

`claim_rules.py` needs `<=` for the coverage-limit check so claims at
the exact limit pass, and `claim_service.py` needs the record/count
mutations moved after the validity check.

## Solution

```python
# claim_rules.py
def is_claim_valid(policy, claim):
    within_window = claim.days_since_incident <= policy.coverage_window_days
    within_limit = claim.amount <= policy.coverage_limit
    return within_window and within_limit
```

```python
# claim_service.py
def file_claim(policy_id, claim, repository):
    policy = repository.policies[policy_id]

    if not is_claim_valid(policy, claim):
        raise ClaimDeniedError(f"Claim {claim.id} does not meet policy {policy_id} terms")

    repository.claims.append(claim)
    policy.claims_filed_count += 1

    return True
```

## Why this works

`<=` correctly treats the coverage limit as inclusive. Checking
validity before recording the claim means a denied claim leaves no
trace in the repository and doesn't inflate `claims_filed_count`.
