from src.screening_service import screen_applicant, AlreadyScreenedError


def handle_screening_request(applicant_id, posting_id, repository):
    try:
        qualified = screen_applicant(applicant_id, posting_id, repository)
        return {"status": "qualified" if qualified else "rejected", "applicant_id": applicant_id}
    except AlreadyScreenedError as e:
        return {"status": "error", "reason": str(e)}
    except KeyError:
        return {"status": "error", "reason": "applicant or posting not found"}
