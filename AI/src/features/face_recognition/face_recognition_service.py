import numpy as np
import base64
from io import BytesIO
from PIL import Image
import cv2
from typing import List, Tuple, Optional

# Optional imports - lazy loading to avoid GLIBCXX issues
INSIGHTFACE_AVAILABLE = False
FACE_RECOGNITION_AVAILABLE = False
FaceAnalysis = None
face_recognition = None

# Try to import InsightFace (lazy, only when needed)
def _import_insightface():
    global INSIGHTFACE_AVAILABLE, FaceAnalysis
    if INSIGHTFACE_AVAILABLE:
        return True
    try:
        from insightface.app import FaceAnalysis
        INSIGHTFACE_AVAILABLE = True
        return True
    except ImportError as e:
        print(f"Warning: InsightFace not available: {e}")
        INSIGHTFACE_AVAILABLE = False
        return False
    except Exception as e:
        print(f"Warning: Failed to import InsightFace: {e}")
        INSIGHTFACE_AVAILABLE = False
        return False

# Try to import face_recognition (fallback)
def _import_face_recognition():
    global FACE_RECOGNITION_AVAILABLE, face_recognition
    if FACE_RECOGNITION_AVAILABLE:
        return True
    try:
        import face_recognition
        FACE_RECOGNITION_AVAILABLE = True
        return True
    except ImportError as e:
        print(f"Warning: face_recognition library not available: {e}")
        FACE_RECOGNITION_AVAILABLE = False
        return False
    except Exception as e:
        print(f"Warning: Failed to import face_recognition: {e}")
        FACE_RECOGNITION_AVAILABLE = False
        return False

class FaceRecognitionService:
    _scrfd_detector = None
    
    @classmethod
    def get_scrfd_detector(cls):
        if cls._scrfd_detector is None:
            # Try to import InsightFace only when needed
            if not _import_insightface():
                cls._scrfd_detector = False
                return False
            
            try:
                from insightface.app import FaceAnalysis
                cls._scrfd_detector = FaceAnalysis(
                    providers=['CPUExecutionProvider'], 
                    name='buffalo_l'  
                )
                cls._scrfd_detector.prepare(ctx_id=-1, det_size=(640, 640))
            except Exception as e:
                print(f"Warning: Failed to initialize SCRFD detector: {e}")
                print("Falling back to face_recognition library")
                cls._scrfd_detector = False  # Mark as failed
        return cls._scrfd_detector
    
    @staticmethod
    def detect_faces_scrfd(image: np.ndarray) -> Tuple[List, bool]:
        
        detector = FaceRecognitionService.get_scrfd_detector()
        
        if detector is False:

            return ([], False)
        
        try:
            if len(image.shape) == 3:
        
                bgr_image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
            else:
                bgr_image = image
            
            if bgr_image.dtype != np.uint8:
                bgr_image = (bgr_image * 255).astype(np.uint8) if bgr_image.max() <= 1.0 else bgr_image.astype(np.uint8)
            
            faces = detector.get(bgr_image)
            
            return (faces, True)
        except Exception as e:
            print(f"Error in SCRFD detection: {e}")
            import traceback
            traceback.print_exc()
            return ([], False)
    
    @staticmethod
    def crop_face_from_bbox(image: np.ndarray, bbox: np.ndarray, expand_ratio: float = 0.2) -> np.ndarray:
        h, w = image.shape[:2]
        
       
        if len(bbox) >= 4:
            x1, y1, x2, y2 = bbox[0], bbox[1], bbox[2], bbox[3]
        else:
            raise ValueError("Invalid bounding box format")
        
        width = x2 - x1
        height = y2 - y1
        expand_w = width * expand_ratio
        expand_h = height * expand_ratio
        
        
        x1 = max(0, int(x1 - expand_w))
        y1 = max(0, int(y1 - expand_h))
        x2 = min(w, int(x2 + expand_w))
        y2 = min(h, int(y2 + expand_h))
        
        
        face_crop = image[y1:y2, x1:x2]
        
        return face_crop
   
    @staticmethod
    def detect_faces(image_base64: str) -> Tuple[bool, List[dict], Optional[str]]:
        """
        Detect faces in image and return bounding boxes
        
        Returns:
            (success, faces_list, error_message)
            faces_list: List of dicts with keys: x1, y1, x2, y2, confidence
        """
        try:
            image = FaceRecognitionService.decode_base64_image(image_base64)
            faces, scrfd_available = FaceRecognitionService.detect_faces_scrfd(image)
            
            if scrfd_available and len(faces) > 0:
                face_boxes = []
                for face in faces:
                    bbox = face.bbox
                    face_boxes.append({
                        'x1': float(bbox[0]),
                        'y1': float(bbox[1]),
                        'x2': float(bbox[2]),
                        'y2': float(bbox[3]),
                        'confidence': float(face.det_score) if hasattr(face, 'det_score') else None
                    })
                
                return (True, face_boxes, None)
            else:
                # Fallback to face_recognition if SCRFD not available
                if _import_face_recognition() and face_recognition:
                    face_locations = face_recognition.face_locations(image)
                    
                    if len(face_locations) == 0:
                        return (True, [], None)
                    
                    face_boxes = []
                    for (top, right, bottom, left) in face_locations:
                        face_boxes.append({
                            'x1': float(left),
                            'y1': float(top),
                            'x2': float(right),
                            'y2': float(bottom),
                            'confidence': None
                        })
                    
                    return (True, face_boxes, None)
                else:
                    return (False, [], "Face detection not available")
                    
        except ValueError as e:
            return (False, [], str(e))
        except Exception as e:
            return (False, [], f"Unexpected error: {str(e)}")
    
    @staticmethod
    def decode_base64_image(image_base64: str) -> np.ndarray:
        try:
            if ',' in image_base64:
                image_base64 = image_base64.split(',')[1]
        
            image_data = base64.b64decode(image_base64)
            image = Image.open(BytesIO(image_data))
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            image_array = np.array(image)
            
            return image_array
        except Exception as e:
            raise ValueError(f"Failed to decode image: {str(e)}")
    
    @staticmethod
    def encode_face(image_base64: str) -> Tuple[bool, Optional[List[float]], Optional[str]]:
        
        try:
            image = FaceRecognitionService.decode_base64_image(image_base64)

            faces, scrfd_available = FaceRecognitionService.detect_faces_scrfd(image)
            
            if scrfd_available and len(faces) > 0:
                if len(faces) > 1:
                    return (False, None, "Multiple faces detected. Please provide an image with only one face")
                
                face = faces[0]
                
             
                bbox = face.bbox
                
                x1, y1, x2, y2 = int(bbox[0]), int(bbox[1]), int(bbox[2]), int(bbox[3])
                
                h, w = image.shape[:2]
                x1 = max(0, x1)
                y1 = max(0, y1)
                x2 = min(w, x2)
                y2 = min(h, y2)
                
                # Use InsightFace's built-in face recognition embedding
                if hasattr(face, 'embedding'):
                    # Use InsightFace embedding directly (512 dimensions for buffalo_l)
                    embedding = face.embedding
                    encoding = embedding.tolist()
                    return (True, encoding, None)
                else:
                    # Fallback: re-detect to get embedding
                    detector = FaceRecognitionService.get_scrfd_detector()
                    if detector:
                        # Convert to BGR for InsightFace
                        if len(image.shape) == 3:
                            bgr_image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
                        else:
                            bgr_image = image
                        if bgr_image.dtype != np.uint8:
                            bgr_image = (bgr_image * 255).astype(np.uint8) if bgr_image.max() <= 1.0 else bgr_image.astype(np.uint8)
                        
                        faces_with_embedding = detector.get(bgr_image)
                        if len(faces_with_embedding) > 0 and hasattr(faces_with_embedding[0], 'embedding'):
                            embedding = faces_with_embedding[0].embedding
                            encoding = embedding.tolist()
                            return (True, encoding, None)
                
                # If InsightFace embedding not available, try face_recognition as fallback
                if _import_face_recognition() and face_recognition:
                    face_location = (y1, x2, y2, x1)
                    face_encodings = face_recognition.face_encodings(image, [face_location])
                    if len(face_encodings) > 0:
                        encoding = face_encodings[0].tolist()
                        return (True, encoding, None)
                
                return (False, None, "Failed to encode face after detection")
            
            else:
                # SCRFD not available, try face_recognition fallback
                if _import_face_recognition() and face_recognition:
                    face_locations = face_recognition.face_locations(image)
                    
                    if len(face_locations) == 0:
                        return (False, None, "No face detected in the image")
                    
                    if len(face_locations) > 1:
                        return (False, None, "Multiple faces detected. Please provide an image with only one face")

                    face_encodings = face_recognition.face_encodings(image, face_locations)                
                    if len(face_encodings) == 0:
                        return (False, None, "Failed to encode face")
                    encoding = face_encodings[0].tolist()
                    
                    return (True, encoding, None)
                else:
                    return (False, None, "Face detection not available. Please install required dependencies.")
            
        except ValueError as e:
            return (False, None, str(e))
        except Exception as e:
            return (False, None, f"Unexpected error: {str(e)}")
    
    @staticmethod
    def verify_face(image_base64: str, stored_encoding: List[float], tolerance: float = 0.6) -> Tuple[bool, bool, Optional[float], Optional[str]]:
        
        try:
            image = FaceRecognitionService.decode_base64_image(image_base64)
            faces, scrfd_available = FaceRecognitionService.detect_faces_scrfd(image)
            
            if scrfd_available and len(faces) > 0:
                # Use SCRFD detection
                if len(faces) > 1:
                    return (False, False, None, "Multiple faces detected. Please provide an image with only one face")
                
                face = faces[0]
                
                bbox = face.bbox
                
                x1, y1, x2, y2 = int(bbox[0]), int(bbox[1]), int(bbox[2]), int(bbox[3])
                
                h, w = image.shape[:2]
                x1 = max(0, x1)
                y1 = max(0, y1)
                x2 = min(w, x2)
                y2 = min(h, y2)
              
                # Use InsightFace's built-in face recognition embedding
                if hasattr(face, 'embedding'):
                    # Use InsightFace embedding directly
                    embedding = face.embedding
                    stored_encoding_array = np.array(stored_encoding)
                    
                    # Calculate cosine distance (InsightFace uses cosine similarity)
                    # Normalize embeddings
                    embedding_norm = embedding / np.linalg.norm(embedding)
                    stored_norm = stored_encoding_array / np.linalg.norm(stored_encoding_array)
                    
                    # Cosine similarity (higher is better)
                    cosine_sim = np.dot(embedding_norm, stored_norm)
                    # Convert to distance (lower is better, similar to face_recognition)
                    face_distance = 1.0 - cosine_sim
                    
                    # InsightFace typically uses threshold around 0.6 for cosine similarity
                    # So distance threshold would be around 0.4
                    # Adjust tolerance for cosine distance
                    cosine_tolerance = 1.0 - (1.0 - tolerance)  # Convert face_recognition tolerance to cosine
                    match = face_distance <= cosine_tolerance
                    
                    return (True, match, float(face_distance), None)
                else:
                    # Fallback: try to get embedding from detector
                    detector = FaceRecognitionService.get_scrfd_detector()
                    if detector:
                        # Convert to BGR for InsightFace
                        if len(image.shape) == 3:
                            bgr_image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
                        else:
                            bgr_image = image
                        if bgr_image.dtype != np.uint8:
                            bgr_image = (bgr_image * 255).astype(np.uint8) if bgr_image.max() <= 1.0 else bgr_image.astype(np.uint8)
                        
                        faces_with_embedding = detector.get(bgr_image)
                        if len(faces_with_embedding) > 0 and hasattr(faces_with_embedding[0], 'embedding'):
                            embedding = faces_with_embedding[0].embedding
                            stored_encoding_array = np.array(stored_encoding)
                            
                            embedding_norm = embedding / np.linalg.norm(embedding)
                            stored_norm = stored_encoding_array / np.linalg.norm(stored_encoding_array)
                            cosine_sim = np.dot(embedding_norm, stored_norm)
                            face_distance = 1.0 - cosine_sim
                            cosine_tolerance = 1.0 - (1.0 - tolerance)
                            match = face_distance <= cosine_tolerance
                            
                            return (True, match, float(face_distance), None)
                
                # If InsightFace embedding not available, try face_recognition as fallback
                if _import_face_recognition() and face_recognition:
                    face_location = (y1, x2, y2, x1)
                    face_encodings = face_recognition.face_encodings(image, [face_location])
                    if len(face_encodings) == 0:
                        return (False, False, None, "Failed to encode face from image")
                    
                    stored_encoding_array = np.array(stored_encoding)
                    face_distance = face_recognition.face_distance([stored_encoding_array], face_encodings[0])[0]
                    match = face_distance <= tolerance
                    return (True, match, float(face_distance), None)
                
                return (False, False, None, "Failed to encode face from image")
            
            else:
                # SCRFD not available, try face_recognition fallback
                if _import_face_recognition() and face_recognition:
                    face_locations = face_recognition.face_locations(image)
                    
                    if len(face_locations) == 0:
                        return (False, False, None, "No face detected in the image")
                    
                    if len(face_locations) > 1:
                        return (False, False, None, "Multiple faces detected. Please provide an image with only one face")
                    
                    face_encodings = face_recognition.face_encodings(image, face_locations)
                    
                    if len(face_encodings) == 0:
                        return (False, False, None, "Failed to encode face from image")
                    
                    stored_encoding_array = np.array(stored_encoding)
                    face_distance = face_recognition.face_distance([stored_encoding_array], face_encodings[0])[0]
                    match = face_distance <= tolerance
                    return (True, match, float(face_distance), None)
                else:
                    return (False, False, None, "Face detection not available. Please install required dependencies.")
            
        except ValueError as e:
            return (False, False, None, str(e))
        except Exception as e:
            return (False, False, None, f"Unexpected error: {str(e)}")

