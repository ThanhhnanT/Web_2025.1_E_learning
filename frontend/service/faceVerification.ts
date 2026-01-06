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
   * This calls the backend API which then calls the AI service
   */
  async detectFaces(imageBase64: string): Promise<DetectFaceResponse> {
    return await postAccess('face-recognition/detect', {
      image_base64: imageBase64,
    });
  }
}

export const faceVerificationService = new FaceVerificationService();
export default faceVerificationService;

