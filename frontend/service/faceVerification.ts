import { getAccess, postAccess } from '../helper/api';

export interface FaceStatusResponse {
  registered: boolean;
  hasEncoding: boolean;
}

export interface RegisterFaceResponse {
  success: boolean;
  message: string;
}

export interface VerifyFaceResponse {
  success: boolean;
  match: boolean;
  distance?: number;
  message: string;
  verification_token?: string;
}

export interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  confidence?: number;
}

export interface DetectFaceResponse {
  success: boolean;
  faces: BoundingBox[];
  face_count: number;
  error?: string;
}

class FaceVerificationService {
  /**
   * Register face encoding for the authenticated user
   */
  async registerFace(imageBase64: string): Promise<RegisterFaceResponse> {
    return await postAccess('face-recognition/register', {
      image_base64: imageBase64,
    });
  }

  /**
   * Verify face for the authenticated user
   */
  async verifyFace(imageBase64: string): Promise<VerifyFaceResponse> {
    return await postAccess('face-recognition/verify', {
      image_base64: imageBase64,
    });
  }

  /**
   * Get face registration status for the authenticated user
   */
  async getFaceStatus(): Promise<FaceStatusResponse> {
    return await getAccess('face-recognition/status');
  }

  /**
   * Detect faces in image and return bounding boxes
   * This calls the AI service directly
   */
  async detectFaces(imageBase64: string): Promise<DetectFaceResponse> {
    const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000';
    const url = `${AI_SERVICE_URL}/face-recognition/detect`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_base64: imageBase64,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Face detection failed: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      throw error;
    }
  }
}

export const faceVerificationService = new FaceVerificationService();
export default faceVerificationService;

