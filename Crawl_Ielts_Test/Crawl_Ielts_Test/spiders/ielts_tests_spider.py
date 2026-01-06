from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Iterable, List, Set

import scrapy
from bs4 import BeautifulSoup
from pymongo import MongoClient

from ..items import IeltsTestItem
from ..utils.parsers import (
    extract_listening_parts,
    extract_reading_parts,
    infer_series_meta,
    parse_listening_answers,
    parse_reading_answers,
    slug_from_url,
)


class IeltsTestsSpider(scrapy.Spider):
    name = "ielts_tests"
    allowed_domains = ["ieltstrainingonline.com"]

    listening_listing = "https://ieltstrainingonline.com/practice-tests-for-ielts-listening/"
    reading_listing = "https://ieltstrainingonline.com/practice-tests-for-ielts-reading/"
    reading_series_range = range(15, 21)

    custom_settings = {}

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.mongo_uri = os.getenv("IELTS_MONGO_URI")
        self.mongo_db_name = os.getenv("IELTS_MONGO_DB", "ielts_app")
        self.tests_collection = os.getenv("IELTS_MONGO_TESTS", "tests")
        self.existing_slugs: Set[str] = set()
        self._load_existing_slugs()

    def start_requests(self) -> Iterable[scrapy.Request]:
        yield scrapy.Request(
            self.listening_listing,
            callback=self.parse_listening_listing,
            cb_kwargs={"skill": "listening"},
        )
        yield scrapy.Request(
            self.reading_listing,
            callback=self.parse_reading_listing,
            cb_kwargs={"skill": "reading"},
        )

    def parse_listening_listing(self, response: scrapy.http.Response, skill: str):
        urls = self._collect_unique_urls(
            response,
            include_keywords=["listening-test"],
            exclude_keywords=["audioscript", "audio-script", "transcript"],
        )
        for url in urls:
            yield response.follow(
                url,
                callback=self.parse_listening_detail,
                cb_kwargs={"skill": skill},
            )

    def parse_reading_listing(self, response: scrapy.http.Response, skill: str):
        urls = self._collect_reading_urls(response)
        for url in urls:
            yield response.follow(
                url,
                callback=self.parse_reading_detail,
                cb_kwargs={"skill": skill},
            )

    def parse_listening_detail(self, response: scrapy.http.Response, skill: str):
        soup = BeautifulSoup(response.text, "html.parser")
        article = soup.select_one("#main-content article")
        if not article:
            self.logger.warning("Skip %s - missing article wrapper", response.url)
            return
        title_el = article.select_one("h1.entry-title")
        title = title_el.get_text(strip=True) if title_el else response.url
        parts = extract_listening_parts(article)
        answer_parts = parse_listening_answers(article)
        answers_lookup = {entry["part"]: entry for entry in answer_parts}
        for part in parts:
            answer_meta = answers_lookup.get(part["part"])
            if answer_meta:
                part["questionRange"] = answer_meta.get("questionRange")
        if not parts or not answer_parts:
            self.logger.warning("Skip %s - missing parts or answers", response.url)
            return
        series_meta = infer_series_meta(title, response.url)
        question_content = {
            "skill": skill,
            "title": title,
            "sourceUrl": response.url,
            "series": series_meta.series,
            "testNumber": series_meta.test_number,
            "retrievedAt": datetime.now(timezone.utc).isoformat(),
            "parts": sorted(parts, key=lambda item: item["part"]),
        }
        answer_payload = {
            "skill": skill,
            "sourceUrl": response.url,
            "parts": answer_parts,
        }
        total_questions = sum(len(part["answers"]) for part in answer_parts)
        item = IeltsTestItem(
            skill=skill,
            title=title,
            series=series_meta.series,
            test_number=series_meta.test_number,
            source_url=response.url,
            test_code=slug_from_url(response.url),
            question_content=question_content,
            answer_payload=answer_payload,
            total_questions=total_questions,
            duration_minutes=30,
        )
        self.existing_slugs.add(item["test_code"])
        yield item

    def parse_reading_detail(self, response: scrapy.http.Response, skill: str):
        soup = BeautifulSoup(response.text, "html.parser")
        article = soup.select_one("#main-content article")
        if not article:
            self.logger.warning("Skip %s - missing article wrapper", response.url)
            return
        title_el = article.select_one("h1.entry-title")
        title = title_el.get_text(strip=True) if title_el else response.url
        parts = extract_reading_parts(article)
        if not parts:
            self.logger.warning("Skip %s - no reading parts", response.url)
            return
        answer_parts = parse_reading_answers(parts)
        if not answer_parts:
            self.logger.warning("Skip %s - no answer data", response.url)
            return
        series_meta = infer_series_meta(title, response.url)
        question_content = {
            "skill": skill,
            "title": title,
            "sourceUrl": response.url,
            "series": series_meta.series,
            "testNumber": series_meta.test_number,
            "retrievedAt": datetime.now(timezone.utc).isoformat(),
            "parts": parts,
        }
        answer_payload = {
            "skill": skill,
            "sourceUrl": response.url,
            "parts": answer_parts,
        }
        total_questions = sum(len(part["answers"]) for part in answer_parts)
        item = IeltsTestItem(
            skill=skill,
            title=title,
            series=series_meta.series,
            test_number=series_meta.test_number,
            source_url=response.url,
            test_code=slug_from_url(response.url),
            question_content=question_content,
            answer_payload=answer_payload,
            total_questions=total_questions,
            duration_minutes=60,
        )
        self.existing_slugs.add(item["test_code"])
        yield item

    def _collect_unique_urls(
        self,
        response: scrapy.http.Response,
        include_keywords: List[str],
        exclude_keywords: List[str] = None,
    ) -> List[str]:
        unique: Set[str] = set()
        exclude_keywords = exclude_keywords or []
        for href in response.css("a::attr(href)").getall():
            if not href or not href.startswith("http"):
                continue
            lower = href.lower()
            # Skip if contains any exclude keywords
            if any(keyword in lower for keyword in exclude_keywords):
                continue
            if any(keyword in lower for keyword in include_keywords):
                slug = slug_from_url(href)
                if slug in self.existing_slugs:
                    self.logger.debug("Skip %s (%s) - already imported", href, slug)
                    if self.crawler and self.crawler.stats:
                        self.crawler.stats.inc_value("ielts/urls_skipped_existing", 1)
                    continue
                unique.add(href)
        return sorted(unique)

    def _collect_reading_urls(self, response: scrapy.http.Response) -> List[str]:
        urls: Set[str] = set()
        for href in response.css("a::attr(href)").getall():
            if not href or not href.startswith("http"):
                continue
            lower = href.lower()
            if not any(keyword in lower for keyword in ["reading-test", "reading-test-"]):
                continue
            slug = slug_from_url(href)
            series_match = next((num for num in self.reading_series_range if f"ielts-{num}" in slug), None)
            if series_match is None:
                continue
            canonical = href
            if "practice-cambridge" in lower:
                canonical = href.replace("practice-cambridge", "answers-and-explanations-for-cambridge")
            if canonical not in urls:
                urls.add(canonical)
        return sorted(urls)

    def _load_existing_slugs(self):
        if not self.mongo_uri:
            self.logger.warning("IELTS_MONGO_URI not set; duplicate skip disabled.")
            return
        client = None
        try:
            client = MongoClient(self.mongo_uri, serverSelectionTimeoutMS=5000)
            collection = client[self.mongo_db_name][self.tests_collection]
            slugs = collection.distinct("externalSlug")
            self.existing_slugs = {slug for slug in slugs if slug}
            self.logger.info("Loaded %d existing slugs", len(self.existing_slugs))
        except Exception as exc:
            self.logger.error("Failed to load existing slugs: %s", exc)
            self.existing_slugs = set()
        finally:
            if client:
                client.close()

