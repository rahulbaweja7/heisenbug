class Applicant:
    def __init__(self, applicant_id, credit_score, annual_income, existing_debt,
                 employment_verified, active_loans_count=0):
        self.id = applicant_id
        self.credit_score = credit_score
        self.annual_income = annual_income
        self.existing_debt = existing_debt
        self.employment_verified = employment_verified
        self.active_loans_count = active_loans_count


class LoanApplication:
    def __init__(self, application_id, applicant_id, requested_amount, status="pending"):
        self.id = application_id
        self.applicant_id = applicant_id
        self.requested_amount = requested_amount
        self.status = status
