from src.screening_rules import is_qualified


class AlreadyScreenedError(Exception):
    pass


def screen_applicant(applicant_id, posting_id, repository):
    applicant = repository.applicants[applicant_id]
    posting = repository.postings[posting_id]

    if applicant.already_screened:
        raise AlreadyScreenedError(f"Applicant {applicant_id} was already screened")

    applicant.already_screened = True
    qualified = is_qualified(applicant, posting)
    if qualified:
        posting.applicant_count += 1

    return qualified
