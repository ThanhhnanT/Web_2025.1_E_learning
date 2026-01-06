import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios from 'axios';
import { User } from '../users/schemas/user.schema';
import { RegisterFaceDto } from './dto/register-face.dto';
import { VerifyFaceDto } from './dto/verify-face.dto';
import { DetectFaceDto } from './dto/detect-face.dto';

@Injectable()
export class FaceRecognitionService {
  private readonly logger = new Logger(FaceRecognitionService.name);
  private readonly aiServiceUrl: string;

  constructor(
    private configService: ConfigService,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {
    this.aiServiceUrl = this.configService.get<string>('AI_SERVICE_URL') || 'http://localhost:8000';
  }

  /**
   * Register face encoding for a user
   */
  async registerFace(userId: string, registerFaceDto: RegisterFaceDto) {
    try {
      this.logger.log(`Registering face for user ${userId}`);

      // Call AI service to encode face
      const response = await axios.post(
        `${this.aiServiceUrl}/face-recognition/encode`,
        {
          image_base64: registerFaceDto.image_base64,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 seconds timeout
        },
      );

      if (!response.data.success) {
        throw new BadRequestException(
          response.data.error || 'Failed to encode face',
        );
      }

      if (!response.data.encoding) {
        throw new BadRequestException('No encoding returned from AI service');
      }

      // Update user with face encoding
      const user = await this.userModel.findByIdAndUpdate(
        userId,
        {
          face_encoding: response.data.encoding,
          face_encoding_registered: true,
        },
        { new: true },
      );

      if (!user) {
        throw new NotFoundException('User not found');
      }

      this.logger.log(`Face registered successfully for user ${userId}`);

      return {
        success: true,
        message: 'Face registered successfully',
      };
    } catch (error: any) {
      this.logger.error(`Error registering face: ${error.message}`, error.stack);

      if (error.response) {
        throw new BadRequestException(
          `AI service returned error: ${error.response.data?.error || error.response.statusText}`,
        );
      }

      if (error.code === 'ECONNREFUSED') {
        throw new BadRequestException(
          'AI service is not available. Please try again later.',
        );
      }

      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      throw new BadRequestException(`Failed to register face: ${error.message}`);
    }
  }

  /**
   * Verify face against stored encoding
   */
  async verifyFace(userId: string, verifyFaceDto: VerifyFaceDto) {
    try {
      this.logger.log(`Verifying face for user ${userId}`);

      // Get user with face encoding
      const user = await this.userModel.findById(userId);

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (!user.face_encoding_registered || !user.face_encoding) {
        throw new BadRequestException(
          'Face not registered. Please register your face first.',
        );
      }

      // Call AI service to verify face
      const response = await axios.post(
        `${this.aiServiceUrl}/face-recognition/verify`,
        {
          image_base64: verifyFaceDto.image_base64,
          encoding: user.face_encoding,
          tolerance: 0.6, // Default tolerance
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 seconds timeout
        },
      );

      if (!response.data.success) {
        throw new BadRequestException(
          response.data.error || 'Failed to verify face',
        );
      }

      const { match, distance } = response.data;

      this.logger.log(
        `Face verification result for user ${userId}: match=${match}, distance=${distance}`,
      );

      return {
        success: true,
        match,
        distance,
        message: match
          ? 'Face verified successfully'
          : 'Face verification failed. Please try again.',
      };
    } catch (error: any) {
      this.logger.error(`Error verifying face: ${error.message}`, error.stack);

      if (error.response) {
        throw new BadRequestException(
          `AI service returned error: ${error.response.data?.error || error.response.statusText}`,
        );
      }

      if (error.code === 'ECONNREFUSED') {
        throw new BadRequestException(
          'AI service is not available. Please try again later.',
        );
      }

      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      throw new BadRequestException(`Failed to verify face: ${error.message}`);
    }
  }

  /**
   * Get face registration status for a user
   */
  async getFaceStatus(userId: string) {
    try {
      const user = await this.userModel.findById(userId);

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return {
        registered: user.face_encoding_registered || false,
        hasEncoding: !!user.face_encoding,
      };
    } catch (error: any) {
      this.logger.error(`Error getting face status: ${error.message}`, error.stack);

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new BadRequestException(`Failed to get face status: ${error.message}`);
    }
  }

  /**
   * Detect faces in image and return bounding boxes
   */
  async detectFaces(detectFaceDto: DetectFaceDto) {
    try {
      this.logger.log('Detecting faces in image');

      // Call AI service to detect faces
      const response = await axios.post(
        `${this.aiServiceUrl}/face-recognition/detect`,
        {
          image_base64: detectFaceDto.image_base64,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 seconds timeout
        },
      );

      // Return the response directly from AI service
      return response.data;
    } catch (error: any) {
      this.logger.error(`Error detecting faces: ${error.message}`, error.stack);

      if (error.response) {
        // Return error response in same format as AI service
        return {
          success: false,
          faces: [],
          face_count: 0,
          error: error.response.data?.error || error.response.statusText || 'Failed to detect faces',
        };
      }

      if (error.code === 'ECONNREFUSED') {
        return {
          success: false,
          faces: [],
          face_count: 0,
          error: 'AI service is not available. Please try again later.',
        };
      }

      return {
        success: false,
        faces: [],
        face_count: 0,
        error: `Failed to detect faces: ${error.message}`,
      };
    }
  }
}

