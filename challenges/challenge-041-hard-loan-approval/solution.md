# Solution

## Approach

`loan_rules.py` needs the debt-to-income division un-swapped, and
`loan_service.py` needs the `active_loans_count` increment moved after
the approval decision and gated on it.

## Solution

```python
# loan_rules.py
def is_approved(applicant):
    good_credit = applicant.credit_score >= MIN_CREDIT_SCORE
    debt_to_income = applicant.existing_debt / applicant.annual_income
    acceptable_dti = debt_to_income <= MAX_DTI_RATIO
    employed = applicant.employment_verified
    return good_credit and acceptable_dti and employed
```

```python
# loan_service.py
def process_loan_application(applicant_id, application, repository):
    applicant = repository.applicants[applicant_id]

    approved = is_approved(applicant)
    application.status = "approved" if approved else "denied"

    if approved:
        applicant.active_loans_count += 1

    return approved
```

## Why this works

Dividing `existing_debt` by `annual_income` produces the ratio the
variable name promises, so the 0.4 threshold check works as intended.
Deferring the `active_loans_count` increment until after the decision,
and only applying it when `approved` is `True`, keeps the count
accurate for every applicant who was actually denied.
