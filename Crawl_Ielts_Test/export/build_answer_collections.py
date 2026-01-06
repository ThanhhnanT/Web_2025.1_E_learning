"""
Transform answer.json to match Answer schema format.
Each part becomes a separate document with testId and sectionId as null (to be filled manually).

Usage:
    python build_answer_collections.py [--auto-fill]
    
    --auto-fill: Automatically fill testId and sectionId from MongoDB (requires IELTS_MONGO_URI)
"""

import argparse
import json
import os
from pathlib import Path
from datetime import datetime, timezone

try:
    from pymongo import MongoClient
    from bson import ObjectId
    MONGO_AVAILABLE = True
except ImportError:
    MONGO_AVAILABLE = False


BASE_DIR = Path(__file__).resolve().parent
ANSWER_JSON = BASE_DIR / "answer.json"
OUT_ANSWERS = BASE_DIR / "collections" / "answers.json"


def load_answer_json(path: Path):
    """Load answer.json file."""
    if not path.exists():
        print(f"Error: File not found: {path}")
        return None
    
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def transform_to_answer_schema(answer_data_list):
    """
    Transform answer data to match Answer schema.
    
    Input format:
    [
      {
        "sourceUrl": "...",
        "title": "...",
        "testSlug": "...",
        "series": "...",
        "testNumber": "...",
        "retrievedAt": "...",
        "answers": [
          {
            "partNumber": 1,
            "transcriptHtml": "...",
            "answerKeys": [...],
            "audioUrl": "..."
          },
          ...
        ]
      },
      ...
    ]
    
    Output format (Answer schema):
    [
      {
        "testId": null,  // To be filled manually
        "sectionId": null,  // To be filled manually
        "partNumber": 1,
        "transcriptHtml": "...",
        "answerKeys": [...],
        "audioUrl": "...",
        "sourceUrl": "...",
        "deletedAt": null,
        "testSlug": "...",  // Keep for reference
        "series": "...",  // Keep for reference
        "testNumber": "..."  // Keep for reference
      },
      ...
    ]
    """
    answer_documents = []
    
    for answer_data in answer_data_list:
        source_url = answer_data.get("sourceUrl", "")
        test_slug = answer_data.get("testSlug", "")
        series = answer_data.get("series", "")
        test_number = answer_data.get("testNumber", "")
        
        # Transform each part into a separate Answer document
        for part_data in answer_data.get("answers", []):
            part_num = part_data.get("partNumber")
            if part_num is None:
                continue
            
            answer_doc = {
                "testId": None,  # To be filled manually
                "sectionId": None,  # To be filled manually
                "partNumber": part_num,
                "transcriptHtml": part_data.get("transcriptHtml", ""),
                "answerKeys": part_data.get("answerKeys", []),
                "audioUrl": part_data.get("audioUrl"),
                "sourceUrl": source_url,
                "deletedAt": None,
                # Keep metadata for reference (not in schema but useful for mapping)
                "_metadata": {
                    "testSlug": test_slug,
                    "series": series,
                    "testNumber": test_number,
                    "title": answer_data.get("title", ""),
                }
            }
            
            answer_documents.append(answer_doc)
    
    return answer_documents


def save_json(path: Path, data):
    """Save data to JSON file."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def auto_fill_ids(answer_documents, mongo_uri: str, db_name: str):
    """Automatically fill testId and sectionId from MongoDB."""
    if not MONGO_AVAILABLE:
        print("Warning: pymongo not available. Cannot auto-fill IDs.")
        return answer_documents
    
    try:
        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
        db = client[db_name]
        tests_collection = os.getenv("IELTS_MONGO_TESTS", "tests")
        sections_collection = os.getenv("IELTS_MONGO_TEST_SECTIONS", "testsections")
        
        filled_count = 0
        
        for doc in answer_documents:
            metadata = doc.get("_metadata", {})
            test_slug = metadata.get("testSlug")
            part_num = doc.get("partNumber")
            
            if not test_slug or part_num is None:
                continue
            
            # Find test by externalSlug
            test_doc = db[tests_collection].find_one({"externalSlug": test_slug})
            if not test_doc:
                continue
            
            test_id = test_doc["_id"]
            if not isinstance(test_id, ObjectId):
                test_id = ObjectId(test_id)
            
            # Find section by testId and partNumber
            section_doc = db[sections_collection].find_one({
                "testId": test_id,
                "partNumber": part_num,
                "deletedAt": None,
            })
            
            if not section_doc:
                continue
            
            section_id = section_doc["_id"]
            if not isinstance(section_id, ObjectId):
                section_id = ObjectId(section_id)
            
            # Fill IDs
            doc["testId"] = {"$oid": str(test_id)}
            doc["sectionId"] = {"$oid": str(section_id)}
            filled_count += 1
        
        client.close()
        print(f"✓ Auto-filled {filled_count}/{len(answer_documents)} documents")
        
    except Exception as e:
        print(f"Warning: Failed to auto-fill IDs: {e}")
    
    return answer_documents


def main():
    parser = argparse.ArgumentParser(description="Transform answer.json to Answer schema format")
    parser.add_argument(
        "--auto-fill",
        action="store_true",
        help="Automatically fill testId and sectionId from MongoDB (requires IELTS_MONGO_URI)",
    )
    args = parser.parse_args()
    
    print("Loading answer.json...")
    answer_data = load_answer_json(ANSWER_JSON)
    
    if answer_data is None:
        return
    
    # Handle both single object and array
    if isinstance(answer_data, list):
        answer_data_list = answer_data
    else:
        answer_data_list = [answer_data]
    
    print(f"Found {len(answer_data_list)} answer set(s)")
    
    # Transform to Answer schema format
    print("Transforming to Answer schema format...")
    answer_documents = transform_to_answer_schema(answer_data_list)
    
    print(f"Generated {len(answer_documents)} Answer document(s)")
    
    # Auto-fill IDs if requested
    if args.auto_fill:
        mongo_uri = os.getenv("IELTS_MONGO_URI")
        db_name = os.getenv("IELTS_MONGO_DB", "ielts_app")
        
        if mongo_uri:
            print("Auto-filling testId and sectionId from MongoDB...")
            answer_documents = auto_fill_ids(answer_documents, mongo_uri, db_name)
        else:
            print("Warning: IELTS_MONGO_URI not set. Cannot auto-fill IDs.")
    
    # Save to collections/answers.json
    save_json(OUT_ANSWERS, answer_documents)
    
    print(f"✓ Saved to {OUT_ANSWERS}")
    
    if not args.auto_fill:
        print(f"\nNote: testId and sectionId are set to null. To auto-fill, run:")
        print(f"  python build_answer_collections.py --auto-fill")
        print(f"\nOr fill manually based on:")
        print("  - testSlug -> find Test by externalSlug")
        print("  - partNumber -> find TestSection by testId and partNumber")


if __name__ == "__main__":
    main()

