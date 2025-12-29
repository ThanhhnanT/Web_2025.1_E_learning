import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService implements OnModuleInit {
  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadImage(file: any, folder: string = 'avatars'): Promise<string> {
    return new Promise((resolve, reject) => {
      const options: any = {
        folder,
        resource_type: 'image',
        quality: 'auto',
      };

      // Only apply face crop for avatars
      if (folder === 'avatars') {
        options.transformation = [
          { width: 400, height: 400, crop: 'fill', gravity: 'face' },
          { quality: 'auto' },
        ];
      } else {
        // For posts, just optimize quality and limit size
        options.transformation = [
          { quality: 'auto', fetch_format: 'auto' },
        ];
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        options,
        (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve(result.secure_url);
          } else {
            reject(new Error('Upload failed: No result returned'));
          }
        },
      );

      uploadStream.end(file.buffer);
    });
  }

  async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error('Error deleting image from Cloudinary:', error);
    }
  }
}

