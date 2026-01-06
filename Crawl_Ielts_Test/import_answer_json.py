#!/usr/bin/env python3
"""
Import answer JSON file into MongoDB.

Usage:
    python import_answer_json.py answer.json [--uri mongodb://localhost:27017]
"""

import argparse
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

from bson import ObjectId
from pymongo import MongoClient


def import_answer_json(json_file: str, mongo_uri: str, mongo_db_name: str):
    """Import answer data from JSON file into MongoDB."""
    tests_collection = os.getenv("IELTS_MONGO_TESTS", "tests")
    sections_collection = os.getenv("IELTS_MONGO_TEST_SECTIONS", "testsections")
    answers_collection = os.getenv("IELTS_MONGO_ANSWERS", "answers")

    # Load JSON file
    json_path = Path(json_file)
    if not json_path.exists():
        print(f"Error: File not found: {json_file}")
        sys.exit(1)

    with json_path.open("r", encoding="utf-8") as f:
        data = json.load(f)

    # Handle both single object and array
    if isinstance(data, list):
        answer_data_list = data
    else:
        answer_data_list = [data]

    # Connect to MongoDB
    try:
        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
        db = client[mongo_db_name]
        print(f"Connected to MongoDB: {mongo_db_name} at {mongo_uri}")
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")
        sys.exit(1)

    imported_count = 0
    skipped_count = 0

    try:
        for answer_data in answer_data_list:
            test_slug = answer_data.get("testSlug")
            if not test_slug:
                print("Warning: Missing testSlug, skipping...")
                skipped_count += 1
                continue

            # Find test by externalSlug
            test_doc = db[tests_collection].find_one({"externalSlug": test_slug})
            if not test_doc:
                print(f"Warning: Test not found for slug: {test_slug}, skipping...")
                skipped_count += 1
                continue

            test_id = test_doc["_id"]
            if not isinstance(test_id, ObjectId):
                test_id = ObjectId(test_id)

            # Process each answer (part)
            for answer_item in answer_data.get("answers", []):
                part_num = answer_item.get("partNumber")
                if part_num is None:
                    print(f"Warning: Missing partNumber, skipping...")
                    skipped_count += 1
                    continue

                # Find corresponding test section
                section_doc = db[sections_collection].find_one({
                    "testId": test_id,
                    "partNumber": part_num,
                    "deletedAt": None,
                })

                if not section_doc:
                    print(
                        f"Warning: TestSection not found for testId={test_id}, partNumber={part_num}, skipping..."
                    )
                    skipped_count += 1
                    continue

                section_id = section_doc["_id"]
                if not isinstance(section_id, ObjectId):
                    section_id = ObjectId(section_id)

                # Prepare answer document
                answer_doc = {
                    "testId": test_id,
                    "sectionId": section_id,
                    "partNumber": part_num,
                    "transcriptHtml": answer_item.get("transcriptHtml", ""),
                    "answerKeys": answer_item.get("answerKeys", []),
                    "audioUrl": answer_item.get("audioUrl"),
                    "sourceUrl": answer_data.get("sourceUrl"),
                    "deletedAt": None,
                    "updatedAt": datetime.now(timezone.utc),
                }

                # Upsert answer
                result = db[answers_collection].find_one_and_update(
                    {"testId": test_id, "sectionId": section_id},
                    {
                        "$set": answer_doc,
                        "$setOnInsert": {"createdAt": datetime.now(timezone.utc)},
                    },
                    upsert=True,
                )

                imported_count += 1
                print(
                    f"✓ Imported answer for testId={test_id}, sectionId={section_id}, partNumber={part_num}"
                )

        print(f"\nImport completed: {imported_count} imported, {skipped_count} skipped")

    finally:
        client.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Import answer JSON file into MongoDB")
    parser.add_argument("json_file", help="Path to answer JSON file")
    parser.add_argument(
        "--uri",
        default=os.getenv("IELTS_MONGO_URI", "mongodb://localhost:27017"),
        help="MongoDB connection URI (default: mongodb://localhost:27017 or IELTS_MONGO_URI env var)",
    )
    parser.add_argument(
        "--db",
        default=os.getenv("IELTS_MONGO_DB", "ielts_app"),
        help="MongoDB database name (default: ielts_app or IELTS_MONGO_DB env var)",
    )

    args = parser.parse_args()

    import_answer_json(args.json_file, args.uri, args.db)

