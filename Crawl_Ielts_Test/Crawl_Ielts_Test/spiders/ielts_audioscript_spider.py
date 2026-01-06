from __future__ import annotations

import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional

import scrapy
from bs4 import BeautifulSoup

from ..utils.parsers import slug_from_url, infer_series_meta


class IeltsAudioscriptSpider(scrapy.Spider):
    name = "ielts_audioscript"
    allowed_domains = ["ieltstrainingonline.com"]

    # Disable MongoDB pipeline for this spider
    custom_settings = {
        'ITEM_PIPELINES': {},
    }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.output_file = getattr(self, 'output', 'answer.json')
        self.answers_data = []
        # Determine output path - save in export directory
        output_path = Path(self.output_file)
        if not output_path.is_absolute():
            # Relative to Crawl_Ielts_Test directory, save in export folder
            project_root = Path(__file__).parent.parent.parent
            export_dir = project_root / "export"
            export_dir.mkdir(parents=True, exist_ok=True)
            self.output_path = export_dir / self.output_file
        else:
            self.output_path = output_path
        
        # Load questions and test_sections for generating answerKeys
        self.questions = []
        self.test_sections = []
        self.test_doc = None
        self._load_reference_data()
    
    def _load_reference_data(self):
        """Load questions.json, test_sections.json, and tests.json for reference."""
        project_root = Path(__file__).parent.parent.parent
        collections_dir = project_root / "export" / "collections"
        
        # Load questions
        questions_file = collections_dir / "questions.json"
        if questions_file.exists():
            with questions_file.open("r", encoding="utf-8") as f:
                self.questions = json.load(f)
            self.logger.info(f"Loaded {len(self.questions)} questions")
        else:
            self.logger.warning(f"Questions file not found: {questions_file}")
        
        # Load test_sections
        sections_file = collections_dir / "test_sections.json"
        if sections_file.exists():
            with sections_file.open("r", encoding="utf-8") as f:
                self.test_sections = json.load(f)
            self.logger.info(f"Loaded {len(self.test_sections)} test sections")
        else:
            self.logger.warning(f"Sections file not found: {sections_file}")
        
        # Load tests
        tests_file = collections_dir / "tests.json"
        if tests_file.exists():
            with tests_file.open("r", encoding="utf-8") as f:
                tests = json.load(f)
                if tests:
                    self.test_doc = tests[0]  # Assume first test
                    self.logger.info(f"Loaded test: {self.test_doc.get('title', 'Unknown')}")
        else:
            self.logger.warning(f"Tests file not found: {tests_file}")
    
    def _get_answer_keys_for_part(self, part_num: int) -> List[Dict]:
        """
        Generate answerKeys for a part from questions.json based on questionRange.
        Returns list matching AnswerKey schema:
        {
            "questionNumber": number,
            "correctAnswer": string[],
            "alternatives": string[] (optional)
        }
        """
        answer_keys = []
        
        # Find test section for this part
        section = None
        for sec in self.test_sections:
            if sec.get("partNumber") == part_num:
                section = sec
                break
        
        if not section:
            self.logger.warning(f"No test section found for part {part_num}")
            return answer_keys
        
        # Get question range for this section
        question_range = section.get("questionRange", [])
        if len(question_range) < 2:
            self.logger.warning(f"Invalid questionRange for part {part_num}: {question_range}")
            return answer_keys
        
        start_q, end_q = question_range[0], question_range[1]
        
        # Find questions in this range
        for question in self.questions:
            q_num = question.get("questionNumber")
            if q_num is None:
                continue
                
            if start_q <= q_num <= end_q:
                # Extract correctAnswer from question schema
                correct_answer = question.get("correctAnswer", {})
                if not isinstance(correct_answer, dict):
                    continue
                
                # Get value and alternatives according to AnswerKey schema
                value = correct_answer.get("value", [])
                alternatives = correct_answer.get("alternatives", [])
                
                # Ensure value is a list
                if not isinstance(value, list):
                    value = [value] if value else []
                
                # Ensure alternatives is a list
                if not isinstance(alternatives, list):
                    alternatives = [alternatives] if alternatives else []
                
                answer_key = {
                    "questionNumber": q_num,
                    "correctAnswer": value,
                }
                
                # Only include alternatives if not empty
                if alternatives:
                    answer_key["alternatives"] = alternatives
                
                answer_keys.append(answer_key)
        
        # Sort by questionNumber
        answer_keys.sort(key=lambda x: x["questionNumber"])
        
        self.logger.info(
            f"Generated {len(answer_keys)} answer keys for part {part_num} "
            f"(questions {start_q}-{end_q})"
        )
        
        return answer_keys

    def start_requests(self):
        # Can be called with URL parameter: scrapy crawl ielts_audioscript -a url=https://...
        url = getattr(self, 'url', None)
        if url:
            yield scrapy.Request(url, callback=self.parse_audioscript)
        else:
            self.logger.warning("No URL provided. Use: scrapy crawl ielts_audioscript -a url=<audioscript_url>")

    def parse_audioscript(self, response: scrapy.http.Response):
        """Parse audioscript page and extract transcripts, audio links, and answer keys."""
        soup = BeautifulSoup(response.text, "html.parser")
        article = soup.select_one("#main-content article")
        if not article:
            self.logger.warning("Skip %s - missing article wrapper", response.url)
            return

        title_el = article.select_one("h1.entry-title")
        title = title_el.get_text(strip=True) if title_el else response.url

        # Infer test metadata from URL/title
        series_meta = infer_series_meta(title, response.url)
        test_slug = slug_from_url(response.url)

        # Extract parts (PART 1, PART 2, etc.)
        parts = self._extract_parts(article)

        # Extract answer keys
        answer_keys_by_part = self._extract_answer_keys(article)

        # Prepare output data
        output_data = {
            "sourceUrl": response.url,
            "title": title,
            "testSlug": test_slug,
            "series": series_meta.series,
            "testNumber": series_meta.test_number,
            "retrievedAt": datetime.now(timezone.utc).isoformat(),
            "answers": [],
        }

        # Process each part
        for part_data in parts:
            part_num = part_data["part"]
            transcript_html = part_data.get("transcriptHtml", "")
            audio_url = part_data.get("audioUrl", "")

            # Get answer keys from questions.json (preferred) or from parsed answer keys
            answer_keys = self._get_answer_keys_for_part(part_num)
            if not answer_keys:
                # Fallback to parsed answer keys from page
                answer_keys = answer_keys_by_part.get(part_num, [])
                self.logger.info(
                    f"Using parsed answer keys from page for part {part_num} "
                    f"({len(answer_keys)} keys)"
                )

            # Prepare answer document for JSON export
            answer_doc = {
                "partNumber": part_num,
                "transcriptHtml": transcript_html,
                "answerKeys": answer_keys,
                "audioUrl": audio_url if audio_url else None,
            }

            output_data["answers"].append(answer_doc)

            self.logger.info(
                "Extracted answer for partNumber=%d, questions=%d",
                part_num,
                len(answer_keys),
            )

        # Store for later export
        self.answers_data.append(output_data)

    def _extract_parts(self, article: BeautifulSoup) -> List[Dict]:
        """Extract PART sections with transcripts and audio links."""
        parts = []

        # Find all PART headings (h2, h3, h4 with "PART" text)
        part_headings = article.find_all(
            lambda tag: tag.name in ["h2", "h3", "h4"]
            and re.search(r"part\s+\d+", tag.get_text(), re.IGNORECASE)
        )

        for heading in part_headings:
            part_match = re.search(r"part\s+(\d+)", heading.get_text(), re.IGNORECASE)
            if not part_match:
                continue

            part_num = int(part_match.group(1))

            # Extract audio link
            audio_url = self._extract_audio(heading)

            # Extract transcript HTML - use the same method as extract_listening_parts
            # Find the transcript div container (et_pb_text_inner) that comes after this heading
            transcript_div = heading.find_next(
                lambda tag: hasattr(tag, "name")
                and tag.name == "div"
                and "et_pb_text_inner" in (tag.get("class") or [])
                and tag.find("p")
            )
            
            if transcript_div:
                # Check if there's a next PART heading before this div
                next_part_before_div = None
                for next_heading in heading.find_all_next(["h2", "h3", "h4"]):
                    if re.search(r"part\s+\d+", next_heading.get_text(), re.IGNORECASE):
                        # Check if this heading comes before transcript_div
                        if transcript_div in next_heading.find_all_next():
                            next_part_before_div = next_heading
                        break
                
                if not next_part_before_div:
                    # Found valid transcript div, include heading and div
                    transcript_html = str(heading) + str(transcript_div)
                else:
                    # Next PART comes before div, use fallback
                    transcript_html = str(heading)
            else:
                # Fallback: collect all siblings until next PART or answer section
                transcript_nodes = [heading]
                current = heading.next_sibling
                
                while current is not None:
                    # Stop at next PART heading
                    if (
                        hasattr(current, "name")
                        and current.name in ["h2", "h3", "h4"]
                        and re.search(r"part\s+\d+", current.get_text(), re.IGNORECASE)
                    ):
                        break
                    
                    # Stop at answer section
                    if (
                        hasattr(current, "name")
                        and current.name in ["h2", "h3", "h4", "h5"]
                        and hasattr(current, "get_text")
                        and "answer" in current.get_text().lower()
                        and "cam" in current.get_text().lower()
                    ):
                        break
                    
                    transcript_nodes.append(current)
                    current = current.next_sibling
                
                transcript_html = "".join(
                    str(node) if hasattr(node, "__str__") else str(node)
                    for node in transcript_nodes
                )

            parts.append({
                "part": part_num,
                "transcriptHtml": transcript_html,
                "audioUrl": audio_url,
            })

        return sorted(parts, key=lambda x: x["part"])

    def _extract_audio(self, tag: BeautifulSoup) -> Optional[str]:
        """Extract audio URL from tag or nearby elements."""
        # Check for audio tag
        audio_tag = tag.find_next("audio")
        if audio_tag and audio_tag.get("src"):
            return audio_tag["src"].split("?")[0]

        # Check for source tag inside audio
        if audio_tag:
            source = audio_tag.find("source")
            if source and source.get("src"):
                return source["src"].split("?")[0]

        # Check for links with .mp3 or .MP3
        for link in tag.find_all_next("a", href=True, limit=5):
            href = link.get("href", "")
            if href and (href.endswith(".mp3") or href.endswith(".MP3")):
                return href.split("?")[0]

        return None

    def _extract_answer_keys(self, article: BeautifulSoup) -> Dict[int, List[Dict]]:
        """Extract answer keys organized by part number."""
        answer_keys_by_part: Dict[int, List[Dict]] = {}

        # Find answer section - usually has "Answer Cam" or "Part" in heading
        answer_section = None
        for heading in article.find_all(["h2", "h3", "h4", "h5"]):
            text = heading.get_text().lower()
            if "answer" in text and ("cam" in text or "part" in text):
                answer_section = heading
                break

        if not answer_section:
            self.logger.warning("Answer section not found")
            return answer_keys_by_part

        # Extract answers from the answer section
        current_part = None
        for element in answer_section.find_all_next(["h3", "h4", "h5", "p", "li", "strong"]):
            text = element.get_text(strip=True)

            # Check if this is a Part heading
            part_match = re.search(r"part\s+(\d+)", text, re.IGNORECASE)
            if part_match:
                current_part = int(part_match.group(1))
                answer_keys_by_part[current_part] = []
                continue

            # Skip if no current part
            if current_part is None:
                continue

            # Parse answer lines (format: "1 break" or "1-5 A B C D E")
            answer_match = re.match(r"^(\d+(?:[-–]\d+)?)\s+(.+)$", text)
            if answer_match:
                question_str = answer_match.group(1)
                answer_str = answer_match.group(2).strip()

                # Expand question numbers (e.g., "1-5" -> [1,2,3,4,5])
                question_numbers = self._expand_question_numbers(question_str)

                # Split answer values
                answer_values = self._split_answer_values(answer_str)

                # Add to answer keys
                for q_num in question_numbers:
                    answer_keys_by_part[current_part].append({
                        "questionNumber": q_num,
                        "correctAnswer": answer_values,
                        "alternatives": [],
                    })

        return answer_keys_by_part

    def _expand_question_numbers(self, question_str: str) -> List[int]:
        """Expand question number string to list (e.g., '1-5' -> [1,2,3,4,5])."""
        question_str = question_str.strip().replace("–", "-").replace("—", "-")
        numbers = []

        if "-" in question_str:
            parts = question_str.split("-", 1)
            if len(parts) == 2 and parts[0].isdigit() and parts[1].isdigit():
                start, end = int(parts[0]), int(parts[1])
                numbers.extend(range(start, end + 1))
        elif question_str.isdigit():
            numbers.append(int(question_str))
        else:
            # Try to extract numbers
            for num_str in re.findall(r"\d+", question_str):
                numbers.append(int(num_str))

        return numbers

    def _split_answer_values(self, answer_str: str) -> List[str]:
        """Split answer string into list of values."""
        values = []
        for chunk in re.split(r"[,/\\+|;&]", answer_str):
            cleaned = chunk.strip(" .:-").strip()
            if cleaned:
                values.append(cleaned)
        if not values and answer_str.strip():
            values.append(answer_str.strip())
        return values

    def closed(self, reason):
        """Save collected data to JSON file."""
        if not self.answers_data:
            self.logger.warning("No data collected to save.")
            return

        # Ensure parent directory exists
        self.output_path.parent.mkdir(parents=True, exist_ok=True)

        # Load existing data if file exists
        existing_data = []
        if self.output_path.exists():
            try:
                with self.output_path.open("r", encoding="utf-8") as f:
                    existing_data = json.load(f)
                    if not isinstance(existing_data, list):
                        existing_data = [existing_data]
                self.logger.info("Loaded existing data from %s", self.output_path)
            except Exception as e:
                self.logger.warning("Failed to load existing file, will create new: %s", e)
                existing_data = []

        # Merge new data with existing (avoid duplicates by testSlug)
        existing_slugs = {item.get("testSlug") for item in existing_data if item.get("testSlug")}
        
        for new_item in self.answers_data:
            test_slug = new_item.get("testSlug")
            if test_slug and test_slug in existing_slugs:
                # Update existing item
                for i, existing_item in enumerate(existing_data):
                    if existing_item.get("testSlug") == test_slug:
                        existing_data[i] = new_item
                        self.logger.info("Updated existing data for testSlug: %s", test_slug)
                        break
            else:
                # Add new item
                existing_data.append(new_item)
                if test_slug:
                    existing_slugs.add(test_slug)
                self.logger.info("Added new data for testSlug: %s", test_slug)

        # Save merged data
        try:
            with self.output_path.open("w", encoding="utf-8") as f:
                json.dump(existing_data, f, ensure_ascii=False, indent=2)
            self.logger.info("Saved %d answer set(s) to %s", len(existing_data), self.output_path)
        except Exception as e:
            self.logger.error("Failed to save JSON file: %s", e)

