class LoanRepository:
    def __init__(self, applicants=None, applications=None):
        self.applicants = applicants or {}
        self.applications = applications or {}

    def add_applicant(self, applicant):
        self.applicants[applicant.id] = applicant

    def add_application(self, application):
        self.applications[application.id] = application
