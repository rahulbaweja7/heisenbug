from src.models import Applicant, JobPosting
from src.repository import HiringRepository
from src.routes import handle_screening_request


def make_repo():
    repo = HiringRepository()
    repo.add_applicant(Applicant("a1", "Sam", years_experience=4, skills=["python", "sql"], desired_salary=90000))
    repo.add_posting(JobPosting("j1", "Backend Engineer", min_years_experience=3,
                                 required_skills=["python", "sql", "aws"], salary_max=100000))
    return repo


def test_applicant_missing_required_skill_is_rejected():
    repo = make_repo()
    result = handle_screening_request("a1", "j1", repo)
    assert result["status"] == "rejected"


def test_applicant_with_all_required_skills_is_qualified():
    repo = make_repo()
    repo.applicants["a1"].skills = ["python", "sql", "aws"]
    result = handle_screening_request("a1", "j1", repo)
    assert result["status"] == "qualified"


def test_applicant_count_only_increments_for_qualified():
    repo = make_repo()
    handle_screening_request("a1", "j1", repo)
    assert repo.postings["j1"].applicant_count == 0


def test_applicant_count_increments_for_qualified_applicant():
    repo = make_repo()
    repo.applicants["a1"].skills = ["python", "sql", "aws"]
    handle_screening_request("a1", "j1", repo)
    assert repo.postings["j1"].applicant_count == 1


def test_under_experienced_applicant_is_rejected():
    repo = make_repo()
    repo.applicants["a1"].skills = ["python", "sql", "aws"]
    repo.applicants["a1"].years_experience = 1
    result = handle_screening_request("a1", "j1", repo)
    assert result["status"] == "rejected"


def test_already_screened_applicant_raises_error():
    repo = make_repo()
    handle_screening_request("a1", "j1", repo)
    result = handle_screening_request("a1", "j1", repo)
    assert result["status"] == "error"
