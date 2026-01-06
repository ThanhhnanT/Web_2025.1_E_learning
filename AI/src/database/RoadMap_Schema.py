from mongoengine import Document, StringField, IntField, MapField, ListField, DateTimeField
from datetime import datetime

class RoadMap(Document):
    goal = StringField()
    level = StringField(required=False)
    description = StringField()
    estimated_hours = IntField()
    userId = StringField()
    createdAt = DateTimeField(default=datetime.now)
    roadmapId = StringField()

    skills = MapField(field=ListField(StringField()))

    meta = {
        'collection' : 'Road_Map',
        'ordering': ['-id']
    }
