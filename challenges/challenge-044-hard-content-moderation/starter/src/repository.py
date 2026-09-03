from src.models import ModerationStats


class ModerationRepository:
    def __init__(self, posts=None, stats=None):
        self.posts = posts or {}
        self.stats = stats or ModerationStats()

    def add_post(self, post):
        self.posts[post.id] = post
