from pydantic import BaseModel, Field
from typing import List, Optional

class EncodeFaceRequest(BaseModel):
    image_base64: str = Field(..., description="Base64 encoded image string")

    class Config:
        schema_extra = {
            "example": {
                "image_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
            }
        }

class EncodeFaceResponse(BaseModel):
    success: bool
    encoding: Optional[List[float]] = None
    error: Optional[str] = None

    class Config:
        schema_extra = {
            "example": {
                "success": True,
                "encoding": [0.123, -0.456, 0.789, ...],
                "error": None
            }
        }

class VerifyFaceRequest(BaseModel):
    image_base64: str = Field(..., description="Base64 encoded image string to verify")
    encoding: List[float] = Field(..., description="Face encoding vector to compare against")
    tolerance: float = Field(0.6, description="Face recognition tolerance (default 0.6)")

    class Config:
        schema_extra = {
            "example": {
                "image_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
                "encoding": [0.123, -0.456, 0.789, ...],
                "tolerance": 0.6
            }
        }

class VerifyFaceResponse(BaseModel):
    success: bool
    match: bool = False
    distance: Optional[float] = None
    error: Optional[str] = None

    class Config:
        schema_extra = {
            "example": {
                "success": True,
                "match": True,
                "distance": 0.35,
                "error": None
            }
        }

class DetectFaceRequest(BaseModel):
    image_base64: str = Field(..., description="Base64 encoded image string")

    class Config:
        schema_extra = {
            "example": {
                "image_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
            }
        }

class BoundingBox(BaseModel):
    x1: float = Field(..., description="Left coordinate")
    y1: float = Field(..., description="Top coordinate")
    x2: float = Field(..., description="Right coordinate")
    y2: float = Field(..., description="Bottom coordinate")
    confidence: Optional[float] = Field(None, description="Detection confidence score")

class DetectFaceResponse(BaseModel):
    success: bool
    faces: List[BoundingBox] = Field(default_factory=list, description="List of detected face bounding boxes")
    face_count: int = Field(0, description="Number of faces detected")
    error: Optional[str] = None

    class Config:
        schema_extra = {
            "example": {
                "success": True,
                "faces": [
                    {"x1": 100, "y1": 150, "x2": 300, "y2": 350, "confidence": 0.95}
                ],
                "face_count": 1,
                "error": None
            }
        }

