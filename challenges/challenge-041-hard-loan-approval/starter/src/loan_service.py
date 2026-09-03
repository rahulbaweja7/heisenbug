from src.loan_rules import is_approved


def process_loan_application(applicant_id, application, repository):
    applicant = repository.applicants[applicant_id]

    applicant.active_loans_count += 1

    approved = is_approved(applicant)
    application.status = "approved" if approved else "denied"
    return approved
