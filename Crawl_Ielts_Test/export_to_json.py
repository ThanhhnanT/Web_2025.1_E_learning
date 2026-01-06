#!/usr/bin/env python
"""
Export IELTS crawler data into JSON files per collection.

Usage:
    python export_to_json.py --uri <MONGO_URI> --db <DB_NAME> \
        --tests-file output/tests.json \
        --contents-file output/contents.json \
        --answers-file output/answers.json
"""

from __future__ import annotations

import argparse
import json
import os
from datetime import datetime
from pathlib import Path
from typing import Any, Iterable

from bson import ObjectId
from pymongo import MongoClient


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Export IELTS data to JSON files.")
    parser.add_argument("--uri", default=os.getenv("IELTS_MONGO_URI"), help="Mongo connection URI")
    parser.add_argument("--db", default=os.getenv("IELTS_MONGO_DB", "ielts_app"), help="Database name")
    parser.add_argument("--tests-coll", default=os.getenv("IELTS_MONGO_TESTS", "tests"), help="Tests collection name")
    parser.add_argument("--contents-coll", default=os.getenv("IELTS_MONGO_CONTENTS", "contents"), help="Contents collection name")
    parser.add_argument("--answers-coll", default=os.getenv("IELTS_MONGO_ANSWERS", "answers"), help="Answers collection name")
    parser.add_argument("--tests-file", default="export/tests.json", help="Output file for tests")
    parser.add_argument("--contents-file", default="export/contents.json", help="Output file for contents")
    parser.add_argument("--answers-file", default="export/answers.json", help="Output file for answers")
    parser.add_argument("--indent", type=int, default=2, help="JSON indent, default 2")
    return parser.parse_args()


def ensure_parent(path: Path):
    path.parent.mkdir(parents=True, exist_ok=True)


def serialise(doc: dict) -> dict:
    """Convert ObjectId and datetime to JSON friendly values."""
    def convert(value: Any):
        if isinstance(value, ObjectId):
            return str(value)
        if isinstance(value, datetime):
            return value.isoformat()
        if isinstance(value, dict):
            return {k: convert(v) for k, v in value.items()}
        if isinstance(value, list):
            return [convert(v) for v in value]
        return value

    return convert(doc)


def export_collection(documents: Iterable[dict], output_path: Path, indent: int, label: str):
    docs = [serialise(doc) for doc in documents]
    ensure_parent(output_path)
    with output_path.open("w", encoding="utf-8") as f:
        json.dump(docs, f, ensure_ascii=False, indent=indent)
    print(f"Exported {len(docs)} {label} documents to {output_path}")


def main():
    args = parse_args()
    if not args.uri:
        raise SystemExit("Mongo URI missing; set --uri or IELTS_MONGO_URI.")
    client = MongoClient(args.uri)
    db = client[args.db]

    tests = list(db[args.tests_coll].find({}))
    contents = list(db[args.contents_coll].find({}))
    answers = list(db[args.answers_coll].find({}))

    export_collection(tests, Path(args.tests_file), args.indent, "test")
    export_collection(contents, Path(args.contents_file), args.indent, "content")
    export_collection(answers, Path(args.answers_file), args.indent, "answer")

    client.close()


if __name__ == "__main__":
    main()

