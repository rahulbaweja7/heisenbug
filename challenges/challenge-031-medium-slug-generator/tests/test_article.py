from src.article import build_article_url


def test_capitalized_title():
    assert build_article_url("Hello World") == "/articles/hello-world"


def test_already_lowercase_title():
    assert build_article_url("breaking news") == "/articles/breaking-news"


def test_mixed_case_multiple_words():
    assert build_article_url("The Quick Brown Fox") == "/articles/the-quick-brown-fox"
