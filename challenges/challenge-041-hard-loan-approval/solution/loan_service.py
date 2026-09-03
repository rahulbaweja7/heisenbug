from src.loan_rules import is_approved


def process_loan_application(applicant_id, application, repository):
    applicant = repository.applicants[applicant_id]

    approved = is_approved(applicant)
    application.status = "approved" if approved else "denied"

    if approved:
        applicant.active_loans_count += 1

    return approved
