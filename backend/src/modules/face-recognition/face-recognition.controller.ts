import {
  Controller,
  Post,
  Get,
  Body,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/passport/jwt-auth.guard';
import { FaceRecognitionService } from './face-recognition.service';
import { FaceVerificationTokenService } from './face-verification-token.service';
import { RegisterFaceDto } from './dto/register-face.dto';
import { VerifyFaceDto } from './dto/verify-face.dto';
import { DetectFaceDto } from './dto/detect-face.dto';

@ApiTags('Face Recognition')
@Controller('face-recognition')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FaceRecognitionController {
  constructor(
    private readonly faceRecognitionService: FaceRecognitionService,
    private readonly tokenService: FaceVerificationTokenService,
  ) {}

  @ApiOperation({
    summary: 'Register face encoding for authenticated user',
    description: 'Encode and store face encoding for the authenticated user. Requires authentication.',
  })
  @ApiResponse({ status: 200, description: 'Face registered successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid image or encoding failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post('register')
  async registerFace(@Request() req: any, @Body() registerFaceDto: RegisterFaceDto) {
    const userId = req.user._id || req.user.id;
    return this.faceRecognitionService.registerFace(userId.toString(), registerFaceDto);
  }

  @ApiOperation({
    summary: 'Verify face for authenticated user',
    description: 'Verify face image against stored encoding. Used for payment verification. Requires authentication.',
  })
  @ApiResponse({ status: 200, description: 'Face verification result' })
  @ApiResponse({ status: 400, description: 'Bad request - Face not registered or verification failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post('verify')
  async verifyFace(@Request() req: any, @Body() verifyFaceDto: VerifyFaceDto) {
    const userId = req.user._id || req.user.id;
    const result = await this.faceRecognitionService.verifyFace(userId.toString(), verifyFaceDto);
    
    // If verification successful, generate token
    if (result.success && result.match) {
      const token = this.tokenService.generateToken(userId.toString());
      return {
        ...result,
        verification_token: token,
      };
    }
    
    return result;
  }

  @ApiOperation({
    summary: 'Get face registration status',
    description: 'Check if the authenticated user has registered their face. Requires authentication.',
  })
  @ApiResponse({ status: 200, description: 'Face registration status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('status')
  async getFaceStatus(@Request() req: any) {
    const userId = req.user._id || req.user.id;
    return this.faceRecognitionService.getFaceStatus(userId.toString());
  }

  @ApiOperation({
    summary: 'Detect faces in image',
    description: 'Detect faces in image and return bounding boxes. Used for real-time face detection. Requires authentication.',
  })
  @ApiResponse({ status: 200, description: 'Face detection result with bounding boxes' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid image' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post('detect')
  async detectFaces(@Body() detectFaceDto: DetectFaceDto) {
    return this.faceRecognitionService.detectFaces(detectFaceDto);
  }
}

