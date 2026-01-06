from src.utils.load_documents import load_document
from src.utils.vector_store import load_vector_store, create_vector_store
from dotenv import dotenv_values
from src.utils.custom_emb import create_embeddings
from src.utils.initialize_llms import initialize_llm
from src.utils.create_agent import create_agent
from src.utils.learning_path import create_learning_path, create_roadmap
from langchain.memory import ConversationBufferMemory
import sys
import os
from src.constant import ScheduleType
import json
import re
from src.database.RoadMap_Schema import RoadMap
from src.database.Learning_Path import LearningPath
from src.utils.get_domain import get_domain
from src.utils.generate_course_title import generate_course_title
from src.utils.find_course_image import find_course_image
from datetime import datetime
import uuid


config = dotenv_values(".env")
def GenSchedule(req: ScheduleType):
    print(req)
    try:
        base_path = "data/questions/AI_Engineer"
        documents= []
        
        for root, dirs, files in os.walk(base_path):
            for file in files:
                if file.endswith(".json"):
                    path = os.path.join(root, file)
                    parts = path.split(os.sep)
        
                    if len(parts) >= 5:
                        domain = parts[3].strip().lower()  # 'computer vision'
                        level = parts[4].strip().lower()  # 'advance'
                        file_type = os.path.splitext(file)[0].strip()  # 'Theory'
                    else:
                        continue
        
                    # Load tài liệu với metadata
                    docs = load_document(path, level=level, domain=domain)
                    if docs:
                        # Thêm file_type vào metadata
                        for doc in docs:
                            doc.metadata["file_type"] = file_type
                        documents.extend(docs)
                        print(
                            f"Loaded {len(docs)} chunks from {path} (domain={domain}, level={level}, file_type={file_type})")
        
        if not documents:
            print("No documents loaded.")
            return {"error": "No documents loaded"}

        # Map user level to folder level names
        level_mapping = {
            "beginner": "beginner",
            "intermediate": "medium",
            "advanced": "advance",
            "medium": "medium",
            "advance": "advance"
        }
        user_knowledge = req.level.lower()
        user_level_for_filter = level_mapping.get(user_knowledge, user_knowledge)
        print(f"User level: {user_knowledge} -> Filter level: {user_level_for_filter}")
        
        learning_goal = req.goal
        # Generate beautiful course title
        course_title = generate_course_title(learning_goal)
        print(f"Original goal: {learning_goal}")
        print(f"Generated course title: {course_title}")
        
        domain = get_domain(learning_goal)
        print("Domain:", domain)


        embeddings = create_embeddings()
        if os.path.exists(config['VECTORDB_PATH']):
            vector_store = load_vector_store(db_path=config['VECTORDB_PATH'], embeddings=embeddings)
        else:
            vector_store = create_vector_store(documents, embeddings)


        # --- LLM, Agent ---
        llm = initialize_llm()
        memory = ConversationBufferMemory(memory_key="chat_history", input_key="input")
        agent = create_agent(domain, user_level_for_filter, llm, vector_store, memory)

        # --- Create learning path ---
        # Ensure domain is in English for tool calls
        if not domain:
            domain = "computer vision"  # Default fallback
            print(f"Warning: Domain extraction failed, using default: {domain}")
        
        roadmap = create_roadmap(agent, learning_goal, user_knowledge, domain)

        if roadmap.startswith("```"):
            roadmap = re.sub(r"^```[a-zA-Z]*\n?", "", roadmap)
            roadmap = re.sub(r"```$", "", roadmap)
        roadmap= json.loads(roadmap)
        learning_path = []
        day = 1
        for key, skill in roadmap["skills"].items():
            for subskill in skill:
                schedule_of_day= create_learning_path(agent, skill= key, subskill=subskill, level=user_knowledge, day=day)
                if schedule_of_day.startswith("```"):
                    schedule_of_day = re.sub(r"^```[a-zA-Z]*\n?", "", schedule_of_day)
                    schedule_of_day = re.sub(r"```$", "", schedule_of_day)
                schedule_of_day = json.loads(schedule_of_day)
                learning_path.append(schedule_of_day)
                if day ==3:
                    break
                day += 1
            break


        # Generate roadmapId
        roadmap_id = str(uuid.uuid4())
        
        # Calculate totalDays
        total_days = len(learning_path)
        

        image_url = find_course_image(course_title, learning_goal)
        print(f"Course image URL: {image_url}")
        
        roadmap = RoadMap(
            goal=course_title,  # Use generated course title instead of raw input
            level=req.level,
            description=req.discription,
            estimated_hours=req.estimated_hours,
            skills=roadmap["skills"],
            userId=req.userId,
            roadmapId=roadmap_id,
            createdAt=datetime.now(),
            imageUrl=image_url  # Add course cover image URL
        )
        try:
            roadmap.save()
            print(f"✅ RoadMap saved successfully with ID: {roadmap.id}, roadmapId: {roadmap_id}")
        except Exception as e:
            print(f"❌ Error saving RoadMap: {e}")
            import traceback
            traceback.print_exc()
            raise
        
        schedule = LearningPath(
            schedule=learning_path,
            userId=req.userId,
            roadmapId=roadmap_id,
            createdAt=datetime.now(),
            currentDay=1,
            completedDays=[],
            progressPercentage=0,
            totalDays=total_days,
            lastAccessed=datetime.now()
        )
        try:
            schedule.save()
            print(f" LearningPath saved successfully")
            print(f"   - MongoDB ID: {schedule.id}")
            print(f"   - roadmapId: {roadmap_id}")
            print(f"   - userId: {req.userId}")
            print(f"   - totalDays: {total_days}")
            print(f"   - Collection: Learning_Path")
        except Exception as e:
            print(f" Error saving LearningPath: {e}")
            import traceback
            traceback.print_exc()
            raise

        return {
            "success": True,
            "skills": roadmap["skills"],
            "learning_path": learning_path,
            "roadmapId": roadmap_id,
            "learningPathId": str(schedule.id),
            "roadmapMongoId": str(roadmap.id),
            "learningPathMongoId": str(schedule.id),
            "totalDays": total_days,
            "courseTitle": course_title,  # Add generated course title
            "imageUrl": image_url,  # Add course cover image URL
            "message": "Learning path generated successfully"
        }

    except Exception as e:
        print(f" Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return {"error": str(e), "success": False}
