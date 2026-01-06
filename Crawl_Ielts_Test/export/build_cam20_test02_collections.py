import json
import uuid
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
RAW_PATH = BASE_DIR / "cam20_test02.json"

COLL_DIR = BASE_DIR / "collections"
COLL_DIR.mkdir(parents=True, exist_ok=True)

OUT_TESTS = COLL_DIR / "tests.json"
OUT_SECTIONS = COLL_DIR / "test_sections.json"
OUT_GROUPS = COLL_DIR / "question_groups.json"
OUT_QUESTIONS = COLL_DIR / "questions.json"


def new_oid() -> str:
  """Generate a 24-hex string similar to Mongo ObjectId."""
  return uuid.uuid4().hex[:24]


def load_array_if_exists(path: Path):
  if not path.exists():
    return []
  try:
    with path.open("r", encoding="utf-8") as f:
      data = json.load(f)
      if isinstance(data, list):
        return data
      return []
  except Exception:
    return []


def save_json(path: Path, data):
  with path.open("w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)


def main():
  # Load raw crawl file for this specific test
  with RAW_PATH.open("r", encoding="utf-8") as f:
    raw = json.load(f)

  # ---------- TEST ----------
  test_id = new_oid()

  test_doc = {
    "_id": {"$oid": test_id},
    "title": raw["title"],
    "testType": "IELTS",
    "language": "English",
    "level": "Intermediate",
    "durationMinutes": 30,
    "totalQuestions": raw.get("total_questions", 40),
    "totalUser": 0,
    "totalComment": 0,
    "hastag": [
      "IELTS",
      (raw.get("skill") or "").capitalize(),
      raw.get("series", ""),
      raw.get("testNumber", ""),
    ],
    "description": f'{raw["title"]} with {raw.get("total_questions", 40)} questions.',
    "createdBy": None,
    # Fields for crawler / metadata
    "externalSlug": "cambridge-ielts-020-listening-test-02",
    "series": raw.get("series"),
    "testNumber": raw.get("testNumber"),
    "skill": raw.get("skill"),
    "sourceUrl": raw.get("sourceUrl"),
  }

  # Start from existing collections if they already exist
  tests_out = load_array_if_exists(OUT_TESTS)
  testsections = load_array_if_exists(OUT_SECTIONS)
  questiongroups = load_array_if_exists(OUT_GROUPS)
  questions = load_array_if_exists(OUT_QUESTIONS)

  tests_out.append(test_doc)

  # ---------- TEST SECTIONS / QUESTION GROUPS / QUESTIONS ----------
  answers_parts = {p["part"]: p for p in raw["answer_payload"]["parts"]}
  parts = raw["question_content"]["parts"]

  for part_idx, part in enumerate(parts, start=1):
    part_num = part["part"]
    section_id = new_oid()
    q_min, q_max = part["questionRange"]

    # TestSection document
    section_doc = {
      "_id": {"$oid": section_id},
      "testId": {"$oid": test_id},
      "sectionType": (raw.get("skill") or "listening").lower(),
      "partNumber": part_num,
      "title": part["title"],
      "questionRange": [q_min, q_max],
      "resources": {
        "audio": part.get("audio"),
      },
      "order": part_idx - 1,
    }
    testsections.append(section_doc)

    # QuestionGroups + Questions in this section
    part_answers = answers_parts.get(part_num, {})
    ans_list = part_answers.get("answers", [])
    ans_by_q = {a["question"]: a for a in ans_list}

    for group_idx, qsec in enumerate(part["questionSections"], start=1):
      group_id = new_oid()
      qr = qsec["questionRange"]

      group_doc = {
        "_id": {"$oid": group_id},
        "sectionId": {"$oid": section_id},
        "groupType": "shared_passage",
        "title": qsec.get("heading", f"Group {group_idx}"),
        "instructions": qsec.get("instructions", ""),
        "questionRange": qr,
        "sharedContent": {
          "contextHtml": qsec.get("fullHtml") or qsec.get("html") or "",
        },
        "order": group_idx - 1,
      }
      questiongroups.append(group_doc)

      # Questions within this group
      for q_idx, q in enumerate(qsec["questions"], start=1):
        q_num = q["questionNumber"]
        ans = ans_by_q.get(q_num, {})
        values = ans.get("value", [])

        question_doc = {
          "_id": {"$oid": new_oid()},
          "questionGroupId": {"$oid": group_id},
          "questionNumber": q_num,
          "questionType": q.get("questionType", "fill_in_blank"),
          "questionText": q.get("questionText", ""),
          "options": [],
          "correctAnswer": {
            "value": values,
            "alternatives": [],
          },
          "explanation": {},
          "points": 1,
          "order": q_idx - 1,
        }
        questions.append(question_doc)

  # ---------- WRITE BACK TO FILES ----------
  save_json(OUT_TESTS, tests_out)
  save_json(OUT_SECTIONS, testsections)
  save_json(OUT_GROUPS, questiongroups)
  save_json(OUT_QUESTIONS, questions)

  print(f"Wrote {len(tests_out)} test(s) to {OUT_TESTS}")
  print(f"Wrote {len(testsections)} test section(s) to {OUT_SECTIONS}")
  print(f"Wrote {len(questiongroups)} question group(s) to {OUT_GROUPS}")
  print(f"Wrote {len(questions)} question(s) to {OUT_QUESTIONS}")


if __name__ == "__main__":
  main()
























