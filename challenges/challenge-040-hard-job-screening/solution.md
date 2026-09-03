# Solution

## Approach

`screening_rules.py` needs `all()` instead of `any()` so every
required skill must be present, and `screening_service.py` needs the
`applicant_count` increment moved after the qualification check so it
only counts qualified applicants.

## Solution

```python
# screening_rules.py
def is_qualified(applicant, posting):
    has_experience = applicant.years_experience >= posting.min_years_experience
    has_skills = all(skill in applicant.skills for skill in posting.required_skills)
    within_budget = applicant.desired_salary <= posting.salary_max
    return has_experience and has_skills and within_budget
```

```python
# screening_service.py
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
```

## Why this works

`all()` correctly requires every skill in `required_skills` to be
present on the applicant. Deferring the `applicant_count` increment
until after `is_qualified` runs, and gating it on the result, means
the count only ever reflects candidates who actually qualified.
