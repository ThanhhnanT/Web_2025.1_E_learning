from fastapi import FastAPI
from dotenv import dotenv_values
from fastapi.middleware.cors import CORSMiddleware
from src.features.ai_schedule.schedule_controller import GenSchedule
from src.constant.ScheduleType import Schedule
from src.config.connectDatabase import  connect_db
from src.features.face_recognition.face_recognition_controller import router as face_recognition_router


config = dotenv_values(".env")

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

connect_db()

@app.get("/")
def root():
    return {"Hello": "World"}

@app.post("/generate_schedule")
async def query_schedule(req: Schedule):
    return GenSchedule(req)

# Face Recognition routes
app.include_router(face_recognition_router, prefix="/face-recognition", tags=["Face Recognition"])
