from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from bson import ObjectId
from pymongo import MongoClient, ReturnDocument


class MongoWriter:
    def __init__(
        self,
        uri: str,
        db_name: str,
        tests_collection: Optional[str] = None,
        contents_collection: Optional[str] = None,
        answers_collection: Optional[str] = None,
    ):
        self.uri = uri
        self.client = MongoClient(uri)
        self.db = self.client[db_name]
        self.tests = self.db[tests_collection or os.getenv("IELTS_MONGO_TESTS", "tests")]
        self.contents = self.db[contents_collection or os.getenv("IELTS_MONGO_CONTENTS", "contents")]
        self.answers = self.db[answers_collection or os.getenv("IELTS_MONGO_ANSWERS", "answers")]

    def close(self):
        self.client.close()

    def upsert_test(self, item: Dict[str, Any]) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        payload = {
            "title": item["title"],
            "language": "English",
            "level": item.get("series") or "IELTS",
            "durationMinutes": item.get("duration_minutes", 60),
            "totalQuestions": item.get("total_questions", 40),
            "description": f"{item['title']} imported from IELTS Training Online.",
            "hastag": [tag for tag in ["ielts", item.get("skill"), item.get("series")] if tag],
            "externalSlug": item["test_code"],
            "skill": item.get("skill"),
            "sourceUrl": item["source_url"],
            "updatedAt": now,
        }
        result = self.tests.find_one_and_update(
            {"externalSlug": item["test_code"]},
            {
                "$set": payload,
                "$setOnInsert": {"createdAt": now},
            },
            upsert=True,
            return_document=ReturnDocument.AFTER,
        )
        return result

    def upsert_content(self, test_doc: Dict[str, Any], question_content: Dict[str, Any]) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        test_id = test_doc["_id"]
        if not isinstance(test_id, ObjectId):
            test_id = ObjectId(test_id)
        update_doc = {
            "testId": test_id,
            "questionContent": question_content,
            "deletedAt": None,
            "updatedAt": now,
        }
        result = self.contents.find_one_and_update(
            {"testId": test_id},
            {
                "$set": update_doc,
                "$setOnInsert": {"createdAt": now},
            },
            upsert=True,
            return_document=ReturnDocument.AFTER,
        )
        return result

    def upsert_answer(self, content_doc: Dict[str, Any], answer_payload: Dict[str, Any]):
        now = datetime.now(timezone.utc)
        content_id = content_doc["_id"]
        if not isinstance(content_id, ObjectId):
            content_id = ObjectId(content_id)
        self.answers.find_one_and_update(
            {"contentId": content_id},
            {
                "$set": {
                    "contentId": content_id,
                    "correctAnswer": answer_payload,
                    "deletedAt": None,
                    "updatedAt": now,
                },
                "$setOnInsert": {"createdAt": now},
            },
            upsert=True,
            return_document=ReturnDocument.AFTER,
        )

    def upsert_answer_by_section(
        self,
        test_doc: Dict[str, Any],
        section_doc: Dict[str, Any],
        answer_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Upsert answer document for a specific test section.
        
        Args:
            test_doc: Test document from database
            section_doc: TestSection document from database
            answer_data: Answer data dict with keys:
                - partNumber: int
                - transcriptHtml: str
                - answerKeys: List[Dict] with questionNumber, correctAnswer, alternatives
                - audioUrl: Optional[str]
                - sourceUrl: Optional[str]
        
        Returns:
            Updated/inserted answer document
        """
        now = datetime.now(timezone.utc)
        test_id = test_doc["_id"]
        section_id = section_doc["_id"]
        
        if not isinstance(test_id, ObjectId):
            test_id = ObjectId(test_id)
        if not isinstance(section_id, ObjectId):
            section_id = ObjectId(section_id)
        
        answer_doc = {
            "testId": test_id,
            "sectionId": section_id,
            "partNumber": answer_data.get("partNumber"),
            "transcriptHtml": answer_data.get("transcriptHtml", ""),
            "answerKeys": answer_data.get("answerKeys", []),
            "audioUrl": answer_data.get("audioUrl"),
            "sourceUrl": answer_data.get("sourceUrl"),
            "deletedAt": None,
            "updatedAt": now,
        }
        
        result = self.answers.find_one_and_update(
            {"testId": test_id, "sectionId": section_id},
            {
                "$set": answer_doc,
                "$setOnInsert": {"createdAt": now},
            },
            upsert=True,
            return_document=ReturnDocument.AFTER,
        )
        
        return result


