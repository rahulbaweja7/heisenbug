from src.claim_rules import is_claim_valid


class ClaimDeniedError(Exception):
    pass


def file_claim(policy_id, claim, repository):
    policy = repository.policies[policy_id]

    repository.claims.append(claim)
    policy.claims_filed_count += 1

    if not is_claim_valid(policy, claim):
        raise ClaimDeniedError(f"Claim {claim.id} does not meet policy {policy_id} terms")

    return True
