import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import {User, UserSchema} from './schemas/user.schema'
import { RolePreset, RolePresetSchema } from './schema/role-preset.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { CloudinaryService } from './cloudinary.service';
import { FriendsModule } from '../friends/friends.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema
      },
      {
        name: RolePreset.name,
        schema: RolePresetSchema
      }
    ]),
    FriendsModule
  ],
  controllers: [UsersController],
  providers: [UsersService, CloudinaryService],
  exports: [UsersService, CloudinaryService]
})
export class UsersModule {}
