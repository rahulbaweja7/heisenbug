class Request:
    """Request with query keys q, genre, and page; values are strings or page integers."""

    def __init__(self, query=None, user=None):
        self.query, self.user = (query or {}, user)

class User:

    def __init__(self, id, username, is_authenticated=True):
        self.id, self.username, self.is_authenticated = (id, username, is_authenticated)

class Response:

    def __init__(self, status_code=200, template_name=None, context=None, data=None):
        self.status_code, self.template_name, self.context, self.data = (status_code, template_name, context or {}, data)
