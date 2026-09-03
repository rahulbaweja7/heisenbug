class Applicant:
    def __init__(self, applicant_id, name, years_experience, skills, desired_salary, already_screened=False):
        self.id = applicant_id
        self.name = name
        self.years_experience = years_experience
        self.skills = skills
        self.desired_salary = desired_salary
        self.already_screened = already_screened


class JobPosting:
    def __init__(self, posting_id, title, min_years_experience, required_skills, salary_max, applicant_count=0):
        self.id = posting_id
        self.title = title
        self.min_years_experience = min_years_experience
        self.required_skills = required_skills
        self.salary_max = salary_max
        self.applicant_count = applicant_count
