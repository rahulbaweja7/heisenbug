from src.models import LoanApplication
from src.loan_service import process_loan_application


def handle_loan_request(applicant_id, application_id, requested_amount, repository):
    if applicant_id not in repository.applicants:
        return {"status": "error", "reason": "applicant not found"}

    application = LoanApplication(application_id, applicant_id, requested_amount)
    repository.add_application(application)

    approved = process_loan_application(applicant_id, application, repository)
    return {"status": "approved" if approved else "denied", "application_id": application_id}
