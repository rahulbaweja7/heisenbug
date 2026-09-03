from src.claim_service import file_claim, ClaimDeniedError


def handle_claim_request(policy_id, claim, repository):
    try:
        file_claim(policy_id, claim, repository)
        return {"status": "approved", "claim_id": claim.id}
    except ClaimDeniedError as e:
        return {"status": "denied", "reason": str(e)}
    except KeyError:
        return {"status": "error", "reason": "policy not found"}
