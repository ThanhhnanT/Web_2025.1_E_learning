from mongoengine import Document, StringField, IntField, ListField, EmbeddedDocument, EmbeddedDocumentField, DictField, DateTimeField
from datetime import datetime

class Question(EmbeddedDocument):
    id = StringField()
    question_text = StringField()
    options = ListField(StringField())
    correct_answer = StringField()
    level = StringField()


class Day(EmbeddedDocument):
    day = IntField()
    skill = StringField()
    subskill = StringField()
    youtube_links = StringField()
    theory = StringField()
    question_review = ListField(EmbeddedDocumentField(Question))


class LearningPath(Document):
    userId = StringField()
    course = StringField()
    schedule = ListField(EmbeddedDocumentField(Day))
    roadmapId = StringField()
    createdAt = DateTimeField(default=datetime.now)
    currentDay = IntField(default=1)
    completedDays = ListField(IntField(), default=[])
    progressPercentage = IntField(default=0, min_value=0, max_value=100)
    totalDays = IntField()
    lastAccessed = DateTimeField()

    meta = {
        'collection': 'Learning_Path',
        'ordering': ['userId']
    }