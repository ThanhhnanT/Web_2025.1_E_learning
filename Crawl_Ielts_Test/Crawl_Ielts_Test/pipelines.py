# Define your item pipelines here
#
# Don't forget to add your pipeline to the ITEM_PIPELINES setting
# See: https://docs.scrapy.org/en/latest/topics/item-pipeline.html


# useful for handling different item types with a single interface
import os

from itemadapter import ItemAdapter

from .mongo_writer import MongoWriter


class CrawlIeltsTestPipeline:
    def __init__(self, mongo_uri: str, mongo_db: str):
        if not mongo_uri or not mongo_db:
            raise ValueError("Mongo URI and database name are required")
        self.mongo = MongoWriter(mongo_uri, mongo_db)

    @classmethod
    def from_crawler(cls, crawler):
        mongo_uri = os.getenv("IELTS_MONGO_URI") or crawler.settings.get("MONGO_URI")
        mongo_db = os.getenv("IELTS_MONGO_DB") or crawler.settings.get("MONGO_DB_NAME")
        return cls(mongo_uri, mongo_db)

    def open_spider(self, spider):
        spider.logger.info("Connected to MongoDB at %s", self.mongo.uri)

    def close_spider(self, spider):
        self.mongo.close()
        spider.logger.info("Mongo connection closed")

    def process_item(self, item, spider):
        adapter = ItemAdapter(item)
        data = adapter.asdict()
        test_doc = self.mongo.upsert_test(data)
        content_doc = self.mongo.upsert_content(test_doc, data["question_content"])
        self.mongo.upsert_answer(content_doc, data["answer_payload"])
        spider.logger.info(
            "Stored test %s (%s questions)",
            data["title"],
            data.get("total_questions"),
        )
        return item
