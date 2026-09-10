#!/usr/bin/env python3
"""Validate every challenge's trusted tests against its solution and starter.

The checker assembles a disposable candidate tree from the files declared in
``meta.json``. It deliberately runs the repository's pytest tests rather than
unittest discovery: a runner that silently collects zero tests would make a
broken challenge look healthy.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path, PureWindowsPath

ROOT = Path(__file__).resolve().parents[1]
CHALLENGES = ROOT / "challenges"
IGNORED = shutil.ignore_patterns("__pycache__", "*.pyc", ".pytest_cache")
DEFAULT_RUNNER_IMAGE = "heisenbug-challenge-runner:ci"
SAFE_PATH = re.compile(r"^[A-Za-z0-9_./-]+$")
SAFE_ID = re.compile(r"^[A-Za-z0-9][A-Za-z0-9-]*$")
SAFE_CATEGORY = re.compile(r"^[a-z0-9][a-z0-9-]*$")
VALID_DIFFICULTIES = {"easy", "medium", "hard"}


def safe_relative(value: object) -> bool:
    if not isinstance(value, str) or not value or not SAFE_PATH.fullmatch(value):
        return False
    parts = value.split("/")
    if any(not part or part in (".", "..") or part.startswith(".") for part in parts):
        return False
    path = Path(value)
    windows_path = PureWindowsPath(value)
    return not path.is_absolute() and not windows_path.is_absolute() and ".." not in path.parts


def solution_file(source: Path, visible: str) -> Path | None:
    """Resolve both mirrored and flattened maintainer solution layouts."""
    relative = Path(visible)
    candidates = [source / relative]
    if relative.parts and relative.parts[0] == "src":
        candidates.append(source / Path(*relative.parts[1:]))
    candidates.append(source / relative.name)
    for candidate in candidates:
        if candidate.is_file():
            return candidate
    return None


def materialize(challenge: Path, meta: dict, kind: str, tree: Path) -> None:
    source = challenge / kind
    if kind == "starter":
        shutil.copytree(source, tree, ignore=IGNORED)
    else:
        tree.mkdir(parents=True)
        for visible in meta["filesVisible"]:
            source_file = solution_file(source, visible)
            if source_file is None:
                raise FileNotFoundError(f"solution file not found for {visible}")
            destination = tree / visible
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source_file, destination)
    shutil.copytree(challenge / "tests", tree / "tests", ignore=IGNORED)


def run(tree: Path, entry: str, timeout: int, runner: str, runner_image: str) -> dict:
    if runner == "docker":
        command = [
            "docker",
            "run",
            "--rm",
            "--network",
            "none",
            "--read-only",
            "--cap-drop",
            "ALL",
            "--security-opt",
            "no-new-privileges",
            "--pids-limit",
            "128",
            "--memory",
            "256m",
            "--cpus",
            "0.5",
            "--ulimit",
            "nofile=256:256",
            "--tmpfs",
            "/tmp:rw,nosuid,nodev,noexec",
            "--mount",
            f"type=bind,src={tree},dst=/workspace,readonly",
            "--workdir",
            "/workspace",
            "-e",
            "PYTHONDONTWRITEBYTECODE=1",
            "-e",
            "PYTEST_DISABLE_PLUGIN_AUTOLOAD=1",
            runner_image,
            "python",
        ]
    else:
        env = os.environ.copy()
        env["PYTHONDONTWRITEBYTECODE"] = "1"
        env["PYTEST_DISABLE_PLUGIN_AUTOLOAD"] = "1"
        env["PYTHONPATH"] = os.pathsep.join(filter(None, [str(tree), env.get("PYTHONPATH", "")]))
        command = [sys.executable]
    command.extend([
        "-m",
        "pytest",
        entry,
        "-v",
        "--tb=short",
        "-p",
        "no:cacheprovider",
    ])
    try:
        completed = subprocess.run(
            command,
            cwd=tree,
            env=env if runner == "local" else None,
            text=True,
            capture_output=True,
            timeout=timeout,
        )
        output = (completed.stdout + completed.stderr)[-5000:]
        collected_match = re.search(r"collected (\d+) item", output)
        passed_match = re.search(r"(\d+) passed", output)
        failed_match = re.search(r"(\d+) failed", output)
        counts = {
            "collected": int(collected_match.group(1)) if collected_match else 0,
            "passed": int(passed_match.group(1)) if passed_match else 0,
            "failed": int(failed_match.group(1)) if failed_match else 0,
        }
        if completed.returncode == 0:
            status = "passed"
        elif completed.returncode == 5:
            status = "no_tests_collected"
        elif "ERROR collecting" in output or "ImportError" in output or "ModuleNotFoundError" in output:
            status = "collection_error"
        elif completed.returncode in (2, 3, 4):
            status = "runner_error"
        elif "failed" in output.lower():
            status = "assertion_failure"
        else:
            status = "test_failure"
        return {"status": status, "exit": completed.returncode, **counts, "output": output}
    except subprocess.TimeoutExpired:
        return {"status": "timeout", "exit": 124, "collected": 0, "passed": 0, "failed": 0, "output": f"pytest timed out after {timeout}s"}
    except OSError as error:
        return {"status": "runner_error", "exit": 127, "collected": 0, "passed": 0, "failed": 0, "output": str(error)}


def check(challenge: Path, timeout: int, runner: str, runner_image: str) -> dict:
    if not challenge.is_dir():
        return {"id": challenge.name, "status": "invalid", "errors": ["challenge directory does not exist"]}
    try:
        meta = json.loads((challenge / "meta.json").read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        return {"id": challenge.name, "status": "invalid", "errors": [f"invalid meta.json: {error}"]}

    if not isinstance(meta, dict):
        return {"id": challenge.name, "status": "invalid", "errors": ["meta.json must contain an object"]}

    errors = []
    challenge_id = meta.get("id")
    if not isinstance(challenge_id, str) or not challenge_id or not SAFE_ID.fullmatch(challenge_id):
        errors.append("id must be a non-empty safe identifier")
    elif challenge.name != f"challenge-{challenge_id}":
        errors.append(f"directory does not match metadata id: {challenge.name}")

    title = meta.get("title")
    if not isinstance(title, str) or not title.strip():
        errors.append("title must be a non-empty string")
    if meta.get("language") != "python":
        errors.append(f"unsupported language: {meta.get('language')!r}")
    difficulty = meta.get("difficulty")
    if not isinstance(difficulty, str) or difficulty not in VALID_DIFFICULTIES:
        errors.append(f"difficulty must be one of {sorted(VALID_DIFFICULTIES)}")
    categories = meta.get("bugCategories")
    if (not isinstance(categories, list) or not categories
            or any(not isinstance(category, str) or not SAFE_CATEGORY.fullmatch(category) for category in categories)
            or len(set(categories)) != len(categories)):
        errors.append("bugCategories must be a non-empty list of unique lowercase slugs")
    time_limit = meta.get("timeLimitMinutes")
    if not isinstance(time_limit, int) or isinstance(time_limit, bool) or not 1 <= time_limit <= 180:
        errors.append("timeLimitMinutes must be an integer from 1 to 180")

    for directory in ("starter", "tests", "solution"):
        if not (challenge / directory).is_dir():
            errors.append(f"missing directory: {directory}")

    entry = meta.get("entryTest", "")
    if not isinstance(entry, str) or not safe_relative(entry) or not entry.startswith("tests/") or not (challenge / entry).is_file():
        errors.append(f"invalid entryTest: {entry!r}")
    visible_files = meta.get("filesVisible", [])
    if not isinstance(visible_files, list) or not visible_files:
        errors.append("filesVisible must be a non-empty list")
        visible_files = []
    elif any(not isinstance(value, str) for value in visible_files):
        errors.append("filesVisible entries must be strings")
    elif len(set(visible_files)) != len(visible_files):
        errors.append("filesVisible contains duplicate paths")
    for visible in visible_files:
        if not isinstance(visible, str) or not safe_relative(visible) or visible.startswith("tests/"):
            errors.append(f"unsafe visible path: {visible!r}")
            continue
        if not (challenge / "starter" / visible).is_file():
            errors.append(f"missing visible starter file: {visible}")
        if solution_file(challenge / "solution", visible) is None:
            errors.append(f"missing visible solution file: {visible}")

    workspace = meta.get("workspace")
    if workspace is not None:
        if not isinstance(workspace, dict):
            errors.append("workspace must be an object")
        else:
            preview_port = workspace.get("previewPort")
            if (not isinstance(preview_port, int) or isinstance(preview_port, bool)
                    or not 1 <= preview_port <= 65535):
                errors.append("workspace.previewPort must be an integer from 1 to 65535")
            start_command = workspace.get("startCommand")
            if not isinstance(start_command, str) or not start_command.strip():
                errors.append("workspace.startCommand must be a non-empty string")
    if errors:
        return {"id": challenge_id if isinstance(challenge_id, str) else challenge.name, "status": "invalid", "errors": errors}

    with tempfile.TemporaryDirectory(prefix="heisenbug-challenge-") as temporary:
        root = Path(temporary)
        results = {}
        for kind in ("solution", "starter"):
            tree = root / kind
            try:
                materialize(challenge, meta, kind, tree)
                results[kind] = run(tree, entry, timeout, runner, runner_image)
            except (OSError, shutil.Error, FileNotFoundError) as error:
                results[kind] = {"status": "materialization_error", "exit": 127, "collected": 0, "passed": 0, "failed": 0, "output": str(error)}

    contract_ok = results["solution"]["status"] == "passed" and results["starter"]["status"] == "assertion_failure"
    return {
        "id": challenge_id,
        "status": "pass" if contract_ok else "fail",
        "solution": results["solution"],
        "starter": results["starter"],
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--challenge", action="append", help="challenge ID or directory prefix; repeatable")
    parser.add_argument("--timeout", type=int, default=60)
    parser.add_argument("--runner", choices=("local", "docker"), default="docker")
    parser.add_argument("--runner-image", default=os.environ.get("HEISENBUG_CHALLENGE_IMAGE", DEFAULT_RUNNER_IMAGE))
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()
    if args.timeout <= 0:
        parser.error("--timeout must be positive")

    if args.challenge:
        paths = []
        for value in args.challenge:
            matches = sorted(CHALLENGES.glob(f"challenge-{value}*"))
            paths.append(matches[0] if matches else CHALLENGES / value)
    else:
        paths = sorted(path for path in CHALLENGES.glob("challenge-*") if path.is_dir())

    report = []
    for path in paths:
        item = check(path, args.timeout, args.runner, args.runner_image)
        report.append(item)
        if not args.json:
            print(f"{item['status'].upper():7} {item['id']}", flush=True)
    seen = {}
    for item in report:
        seen.setdefault(item["id"], []).append(item)
    for challenge_id, items in seen.items():
        if len(items) > 1:
            for item in items:
                item["status"] = "invalid"
                item.setdefault("errors", []).append(f"duplicate challenge id: {challenge_id}")
    if args.json:
        print(json.dumps(report, indent=2))
    else:
        failures = [item for item in report if item["status"] != "pass"]
        if failures:
            for item in failures:
                print(json.dumps(item, indent=2), file=sys.stderr)
    return 1 if any(item["status"] != "pass" for item in report) else 0


if __name__ == "__main__":
    raise SystemExit(main())
