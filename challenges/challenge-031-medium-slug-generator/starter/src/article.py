from src.text_utils import slugify


def build_article_url(title):
    """Build the full article URL from its title."""
    return f"/articles/{slugify(title)}"
