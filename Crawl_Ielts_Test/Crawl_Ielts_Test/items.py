# Define here the models for your scraped items
#
# See documentation in:
# https://docs.scrapy.org/en/latest/topics/items.html

import scrapy


class IeltsTestItem(scrapy.Item):
    skill = scrapy.Field()
    title = scrapy.Field()
    series = scrapy.Field()
    test_number = scrapy.Field()
    source_url = scrapy.Field()
    test_code = scrapy.Field()
    question_content = scrapy.Field()
    answer_payload = scrapy.Field()
    total_questions = scrapy.Field()
    duration_minutes = scrapy.Field()
