# Scrapy settings for Crawl_Ielts_Test project
#
# For simplicity, this file contains only settings considered important or
# commonly used. You can find more settings consulting the documentation:
#
#     https://docs.scrapy.org/en/latest/topics/settings.html
#     https://docs.scrapy.org/en/latest/topics/downloader-middleware.html
#     https://docs.scrapy.org/en/latest/topics/spider-middleware.html

import os

BOT_NAME = "Crawl_Ielts_Test"

SPIDER_MODULES = ["Crawl_Ielts_Test.spiders"]
NEWSPIDER_MODULE = "Crawl_Ielts_Test.spiders"


# Crawl responsibly by identifying yourself (and your website) on the user-agent
#USER_AGENT = "Crawl_Ielts_Test (+http://www.yourdomain.com)"

# Obey robots.txt rules
ROBOTSTXT_OBEY = True

CONCURRENT_REQUESTS = int(os.getenv("IELTS_CONCURRENT_REQUESTS", 2))
DOWNLOAD_DELAY = float(os.getenv("IELTS_DOWNLOAD_DELAY", 3.0))
CONCURRENT_REQUESTS_PER_DOMAIN = int(os.getenv("IELTS_CONCURRENT_PER_DOMAIN", 1))
CONCURRENT_REQUESTS_PER_IP = CONCURRENT_REQUESTS_PER_DOMAIN

# Disable cookies (enabled by default)
#COOKIES_ENABLED = False

# Disable Telnet Console (enabled by default)
#TELNETCONSOLE_ENABLED = False

# Override the default request headers:
#DEFAULT_REQUEST_HEADERS = {
#    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
#    "Accept-Language": "en",
#}

# Enable or disable spider middlewares
# See https://docs.scrapy.org/en/latest/topics/spider-middleware.html
#SPIDER_MIDDLEWARES = {
#    "Crawl_Ielts_Test.middlewares.CrawlIeltsTestSpiderMiddleware": 543,
#}

# Enable or disable downloader middlewares
# See https://docs.scrapy.org/en/latest/topics/downloader-middleware.html
#DOWNLOADER_MIDDLEWARES = {
#    "Crawl_Ielts_Test.middlewares.CrawlIeltsTestDownloaderMiddleware": 543,
#}

# Enable or disable extensions
# See https://docs.scrapy.org/en/latest/topics/extensions.html
#EXTENSIONS = {
#    "scrapy.extensions.telnet.TelnetConsole": None,
#}

# Configure item pipelines
# See https://docs.scrapy.org/en/latest/topics/item-pipeline.html
ITEM_PIPELINES = {
    "Crawl_Ielts_Test.pipelines.CrawlIeltsTestPipeline": 300,
}

# Enable and configure the AutoThrottle extension (disabled by default)
# See https://docs.scrapy.org/en/latest/topics/autothrottle.html
AUTOTHROTTLE_ENABLED = True
AUTOTHROTTLE_START_DELAY = float(os.getenv("IELTS_AUTOTHROTTLE_START", 2.0))
AUTOTHROTTLE_MAX_DELAY = float(os.getenv("IELTS_AUTOTHROTTLE_MAX", 30.0))
AUTOTHROTTLE_TARGET_CONCURRENCY = float(os.getenv("IELTS_AUTOTHROTTLE_TARGET", 0.5))
AUTOTHROTTLE_DEBUG = False

# Enable and configure HTTP caching (disabled by default)
# See https://docs.scrapy.org/en/latest/topics/downloader-middleware.html#httpcache-middleware-settings
#HTTPCACHE_ENABLED = True
#HTTPCACHE_EXPIRATION_SECS = 0
#HTTPCACHE_DIR = "httpcache"
#HTTPCACHE_IGNORE_HTTP_CODES = []
#HTTPCACHE_STORAGE = "scrapy.extensions.httpcache.FilesystemCacheStorage"

# Set settings whose default value is deprecated to a future-proof value
REQUEST_FINGERPRINTER_IMPLEMENTATION = "2.7"
TWISTED_REACTOR = "twisted.internet.asyncioreactor.AsyncioSelectorReactor"
FEED_EXPORT_ENCODING = "utf-8"

DEFAULT_REQUEST_HEADERS = {
    "User-Agent": os.getenv(
        "IELTS_CRAWLER_UA",
        "Mozilla/5.0 (compatible; IELTSBot/1.0; +https://github.com/)",
    )
}

MONGO_URI = os.getenv("IELTS_MONGO_URI")
MONGO_DB_NAME = os.getenv("IELTS_MONGO_DB", "ielts_app")
RETRY_TIMES = int(os.getenv("IELTS_RETRY_TIMES", 5))
