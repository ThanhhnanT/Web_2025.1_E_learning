import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FaceRecognitionController } from './face-recognition.controller';
import { FaceRecognitionService } from './face-recognition.service';
import { FaceVerificationTokenService } from './face-verification-token.service';
import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
  ],
  controllers: [FaceRecognitionController],
  providers: [FaceRecognitionService, FaceVerificationTokenService],
  exports: [FaceRecognitionService, FaceVerificationTokenService],
})
export class FaceRecognitionModule {}

