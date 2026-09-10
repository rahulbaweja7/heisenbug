#!/usr/bin/env python3
"""Validate every challenge and prove starter-red/reference-green contracts."""
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CHALLENGES = ROOT / "challenges"
SAFE_PATH = re.compile(r"^[A-Za-z0-9_./-]+$")
RESULTS = re.compile(r"(\d+) (?:passed|failed|error)")


def safe_relative(value: object) -> bool:
    if not isinstance(value, str) or not value or not SAFE_PATH.fullmatch(value):
        return False
    path = Path(value)
    return not path.is_absolute() and ".." not in path.parts and all(part and not part.startswith(".") for part in path.parts)


def execute(tree: Path, entry: str, timeout: int) -> dict:
    try:
        completed = subprocess.run(
            [sys.executable, "-m", "pytest", "-q", entry],
            cwd=tree, capture_output=True, text=True, timeout=timeout,
            env={"PATH": "/usr/bin:/bin", "PYTHONPATH": os.pathsep.join(filter(None, (str(tree), os.environ.get("PYTHONPATH"))))},
        )
        output = (completed.stdout + completed.stderr)[-4000:]
        counts = sum(int(value) for value in RESULTS.findall(output))
        return {"exit": completed.returncode, "tests": counts, "output": output}
    except subprocess.TimeoutExpired as error:
        output = ((error.stdout or "") + (error.stderr or ""))[-4000:]
        return {"exit": 124, "tests": 0, "output": output or "timeout"}


def validate(path: Path, seen: set[str]) -> tuple[dict | None, list[str]]:
    errors: list[str] = []
    try:
        meta = json.loads((path / "meta.json").read_text(encoding="utf-8"))
    except Exception as error:
        return None, [f"metadata: {error}"]
    challenge_id = meta.get("id")
    for key in ("id", "title", "language", "difficulty", "timeLimitMinutes", "bugCategories", "filesVisible", "entryTest"):
        if not meta.get(key):
            errors.append(f"missing {key}")
    if challenge_id in seen:
        errors.append("duplicate id")
    elif isinstance(challenge_id, str):
        seen.add(challenge_id)
    if path.name != f"challenge-{challenge_id}":
        errors.append("directory does not match id")
    if meta.get("language") != "python":
        errors.append("unsupported language")
    if not isinstance(meta.get("timeLimitMinutes"), int) or not 1 <= meta.get("timeLimitMinutes", 0) <= 180:
        errors.append("invalid time limit")
    if not isinstance(meta.get("bugCategories"), list) or not all(isinstance(item, str) and item for item in meta.get("bugCategories", [])):
        errors.append("invalid bug categories")
    entry = meta.get("entryTest")
    if not safe_relative(entry) or not str(entry).startswith("tests/") or not (path / str(entry)).is_file():
        errors.append("invalid entry test")
    visible = meta.get("filesVisible")
    if not isinstance(visible, list) or len(set(visible)) != len(visible):
        errors.append("invalid visible files")
    else:
        for name in visible:
            if not safe_relative(name) or str(name).startswith("tests/") or not (path / "starter" / str(name)).is_file():
                errors.append(f"invalid visible file: {name}")
    for required in ("starter", "solution", "tests"):
        if not (path / required).is_dir():
            errors.append(f"missing {required}")
    workspace = meta.get("workspace")
    if workspace is not None:
        if not isinstance(workspace, dict) or not isinstance(workspace.get("previewPort"), int) or not 1 <= workspace.get("previewPort", 0) <= 65535:
            errors.append("invalid preview port")
        if not isinstance(workspace, dict) or not isinstance(workspace.get("startCommand"), str) or not workspace.get("startCommand", "").strip():
            errors.append("invalid preview command")
    return meta, errors


def check(path: Path, timeout: int, seen: set[str]) -> dict:
    meta, errors = validate(path, seen)
    challenge_id = meta.get("id", path.name) if meta else path.name
    if errors:
        return {"id": challenge_id, "status": "invalid", "errors": errors}
    with tempfile.TemporaryDirectory(prefix="heisenbug-contract-") as temp:
        results = {}
        for kind in ("solution", "starter"):
            tree = Path(temp) / kind
            shutil.copytree(path / "starter", tree)
            if kind == "solution":
                visible = [Path(name) for name in meta["filesVisible"]]
                for source in (path / "solution").rglob("*"):
                    if not source.is_file():
                        continue
                    relative = source.relative_to(path / "solution")
                    target = tree / relative
                    if not target.exists() and len(matches := [name for name in visible if name.name == relative.name]) == 1:
                        target = tree / matches[0]
                    target.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(source, target)
            shutil.copytree(path / "tests", tree / "tests")
            results[kind] = execute(tree, meta["entryTest"], timeout)
    solution_ok = results["solution"]["exit"] == 0 and results["solution"]["tests"] > 0
    starter_red = results["starter"]["exit"] == 1 and results["starter"]["tests"] > 0
    return {"id": challenge_id, "status": "pass" if solution_ok and starter_red else "fail", **results}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--challenge", action="append")
    parser.add_argument("--timeout", type=int, default=30)
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()
    paths = sorted(path for path in CHALLENGES.glob("challenge-*") if path.is_dir())
    if args.challenge:
        requested = set(args.challenge)
        paths = [path for path in paths if path.name in requested or path.name.removeprefix("challenge-") in requested]
        if len(paths) != len(requested):
            parser.error("one or more requested challenges were not found")
    seen: set[str] = set()
    report = [check(path, args.timeout, seen) for path in paths]
    if args.json:
        print(json.dumps(report, indent=2))
    else:
        for item in report:
            details = "" if item["status"] == "pass" else f" {item.get('errors') or item.get('solution', {}).get('output', '')[-200:]}"
            print(f"{item['status'].upper():7} {item['id']}{details}")
    return int(not report or any(item["status"] != "pass" for item in report))


if __name__ == "__main__":
    raise SystemExit(main())
