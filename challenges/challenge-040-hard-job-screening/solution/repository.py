class HiringRepository:
    def __init__(self, applicants=None, postings=None):
        self.applicants = applicants or {}
        self.postings = postings or {}

    def add_applicant(self, applicant):
        self.applicants[applicant.id] = applicant

    def add_posting(self, posting):
        self.postings[posting.id] = posting
