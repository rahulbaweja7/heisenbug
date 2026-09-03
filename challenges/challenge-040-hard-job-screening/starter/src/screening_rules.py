def is_qualified(applicant, posting):
    has_experience = applicant.years_experience >= posting.min_years_experience
    has_skills = any(skill in applicant.skills for skill in posting.required_skills)
    within_budget = applicant.desired_salary <= posting.salary_max
    return has_experience and has_skills and within_budget
