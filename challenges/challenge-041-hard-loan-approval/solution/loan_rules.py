MIN_CREDIT_SCORE = 650
MAX_DTI_RATIO = 0.4


def is_approved(applicant):
    good_credit = applicant.credit_score >= MIN_CREDIT_SCORE
    debt_to_income = applicant.existing_debt / applicant.annual_income
    acceptable_dti = debt_to_income <= MAX_DTI_RATIO
    employed = applicant.employment_verified
    return good_credit and acceptable_dti and employed
