from fastapi import APIRouter, HTTPException
from src.constant.FaceRecognitionType import (
    EncodeFaceRequest,
    EncodeFaceResponse,
    VerifyFaceRequest,
    VerifyFaceResponse,
    DetectFaceRequest,
    DetectFaceResponse
)
from src.features.face_recognition.face_recognition_service import FaceRecognitionService

router = APIRouter()

@router.post("/encode", response_model=EncodeFaceResponse)
async def encode_face(request: EncodeFaceRequest):
    """
    Encode face from image
    
    Returns face encoding vector (128 dimensions) that can be stored and used for verification
    """
    try:
        success, encoding, error = FaceRecognitionService.encode_face(request.image_base64)
        
        if success:
            return EncodeFaceResponse(
                success=True,
                encoding=encoding,
                error=None
            )
        else:
            return EncodeFaceResponse(
                success=False,
                encoding=None,
                error=error
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/verify", response_model=VerifyFaceResponse)
async def verify_face(request: VerifyFaceRequest):
    """
    Verify face image against stored encoding
    
    Returns match result with distance metric
    """
    try:
        success, match, distance, error = FaceRecognitionService.verify_face(
            request.image_base64,
            request.encoding,
            request.tolerance
        )
        
        if success:
            return VerifyFaceResponse(
                success=True,
                match=match,
                distance=distance,
                error=None
            )
        else:
            return VerifyFaceResponse(
                success=False,
                match=False,
                distance=None,
                error=error
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/detect", response_model=DetectFaceResponse)
async def detect_faces(request: DetectFaceRequest):
    """
    Detect faces in image and return bounding boxes
    
    Returns list of face bounding boxes with coordinates
    """
    try:
        success, faces, error = FaceRecognitionService.detect_faces(request.image_base64)
        
        if success:
            return DetectFaceResponse(
                success=True,
                faces=faces,
                face_count=len(faces),
                error=None
            )
        else:
            return DetectFaceResponse(
                success=False,
                faces=[],
                face_count=0,
                error=error
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

