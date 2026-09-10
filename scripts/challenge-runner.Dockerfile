FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTEST_DISABLE_PLUGIN_AUTOLOAD=1

RUN pip install --no-cache-dir pytest==8.4.2 \
    && useradd --create-home --uid 1000 runner

WORKDIR /workspace
USER runner
