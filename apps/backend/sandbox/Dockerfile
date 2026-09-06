FROM ubuntu:24.04
RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-venv bash ca-certificates procps && rm -rf /var/lib/apt/lists/*
RUN python3 -m venv /opt/venv && /opt/venv/bin/pip install --no-cache-dir pytest==8.4.2
RUN id user >/dev/null 2>&1 || useradd --create-home --shell /bin/bash user
RUN mkdir -p /workspace /grading/tests && chown user:user /workspace && chmod 755 /grading /grading/tests && chmod -R go-w /opt/venv
# The candidate user must not be able to replace the trusted Python runtime.
RUN if command -v sudo >/dev/null; then chmod 700 /usr/bin/sudo; fi
ENV PATH="/opt/venv/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
WORKDIR /workspace
USER user
