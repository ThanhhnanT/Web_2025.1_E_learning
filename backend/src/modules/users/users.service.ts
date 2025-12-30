import { BadRequestException, Injectable, NotFoundException, UnauthorizedException, OnModuleInit } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { InjectModel } from '@nestjs/mongoose';
import {User} from '@/modules/users/schemas/user.schema'
import { RolePreset } from './schema/role-preset.schema';
import {Model } from 'mongoose'
import { hashPassword, comparePass } from '@/utils/hashpass';
import aqp from 'api-query-params';
import { CreateAuthDto } from '@/auth/dto/create-auth.dto';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import {MailerService} from '@nestjs-modules/mailer'
import { VerifyDto } from '@/auth/dto/verify-email.dto';
import { CloudinaryService } from './cloudinary.service';
import { computeEffectivePermissions, LEGACY_ROLE_MAP, ROLE_PRESETS } from './constants/permissions';
import { UpdateRolePresetDto } from './dto/update-role-preset.dto';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectModel(User.name) 
    private userModel: Model<User>,
    @InjectModel(RolePreset.name)
    private rolePresetModel: Model<RolePreset>,
    private readonly mailerService: MailerService,
    private readonly cloudinaryService: CloudinaryService
  ) {}
  
 isEmailExist = async (email:string) => {
  const user = await this.userModel.exists({email:email})
  if(user) return true
  return false
}

 async create(createUserDto: CreateUserDto) {
    
    const {name, email, password, phone, role} = createUserDto
    const isExist = await this.isEmailExist(email)

    if(isExist){
      throw new BadRequestException(`Email đã tồn tại: ${email}. Vui lòng sử dụng email khác `)
    }

    const hashPass = await hashPassword(password)
    // console.log(hashPass)
    
    const newUser = await this.userModel.create({
      name: name,
      email: email,
      password: hashPass,
      phone: phone,
      role: role || 'viewer'
    })


    return {
      _id: newUser._id
    };
  }

  async findAll(query: string, page: number, search?: string) {
    let {filter, limit, sort} = aqp(query)
    if(!limit) limit = 10
    if (filter.limit) delete filter.limit
    if (filter.page) delete filter.page
    
    // Add search functionality for name and email
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      const searchFilter = {
        $or: [
          { name: searchRegex },
          { email: searchRegex }
        ]
      };
      // Merge search filter with existing filter
      if (Object.keys(filter).length > 0) {
        filter = { $and: [filter, searchFilter] };
      } else {
        filter = searchFilter;
      }
    }
    
    const totalItems = await this.userModel.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / limit);
    const offset = (page - 1) * (+limit);
    
    const results = await this.userModel.find(filter)
      .limit(limit)
      .skip(offset)
      .sort(sort as any)
      .select('-password')
      .exec();
    
    return {
      data: results,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        limit
      }
    };
  }

  async findOne(id: string) {
    const user = await this.userModel.findById(id).select('-password');
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    await this.normalizeLegacyRole(user);
    return user;
  }

  async getUserByEmail(email: string) {
    const user = await this.userModel.findOne({email: email}).select('-password');
    if (user) {
      await this.normalizeLegacyRole(user);
    }
    return user;
  }

  async update(userId: string, updateUserDto: UpdateUserDto) {
    const user = await this.userModel.findById(userId);
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updateData: any = {};
    if (updateUserDto.name !== undefined) {
      updateData.name = updateUserDto.name;
    }
    if (updateUserDto.phone !== undefined) {
      updateData.phone = updateUserDto.phone;
    }
    if (updateUserDto.bio !== undefined) {
      updateData.bio = updateUserDto.bio;
    }
    if (updateUserDto.role !== undefined) {
      updateData.role = updateUserDto.role;
    }
    if (updateUserDto.email_verified !== undefined) {
      updateData.email_verified = updateUserDto.email_verified;
    }
    if (updateUserDto.showOverview !== undefined) {
      updateData.showOverview = updateUserDto.showOverview;
    }
    if (updateUserDto.showBlog !== undefined) {
      updateData.showBlog = updateUserDto.showBlog;
    }
    if (updateUserDto.showFriends !== undefined) {
      updateData.showFriends = updateUserDto.showFriends;
    }

    const updatedUser = await this.userModel.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select('-password');

    return updatedUser;
  }

  async updateAvatar(userId: string, file: any) {
    const user = await this.userModel.findById(userId);
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Upload image to Cloudinary
    const avatarUrl = await this.cloudinaryService.uploadImage(file);

    // Update user's avatar_url
    const updatedUser = await this.userModel.findByIdAndUpdate(
      userId,
      { avatar_url: avatarUrl },
      { new: true }
    ).select('-password');

    return updatedUser;
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.userModel.findById(userId);
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify old password
    const isOldPasswordValid = await comparePass(changePasswordDto.oldPassword, user.password);
    
    if (!isOldPasswordValid) {
      throw new UnauthorizedException('Mật khẩu cũ không đúng');
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(changePasswordDto.newPassword);

    // Update password
    await this.userModel.findByIdAndUpdate(
      userId,
      { password: hashedNewPassword }
    );

    return {
      message: 'Đổi mật khẩu thành công',
      statusCode: 200,
    };
  }

  async remove(id: string) {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    await this.userModel.findByIdAndDelete(id);
    return {
      message: 'User deleted successfully',
      statusCode: 200
    };
  }

  async recordLogin(userId: string, ip?: string, location?: string) {
    await this.userModel.findByIdAndUpdate(userId, {
      lastLoginAt: new Date(),
      lastLoginIp: ip,
      lastLoginLocation: location,
    });
  }

  async updatePermissions(userId: string, permissions: string[]) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const unique = Array.from(new Set(permissions));
    const updatedUser = await this.userModel.findByIdAndUpdate(
      userId,
      { permissions: unique },
      { new: true }
    ).select('-password');
    return updatedUser;
  }

  async getPermissions(userId: string) {
    const user = await this.userModel.findById(userId).select('-password');
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.normalizeLegacyRole(user);
    return {
      role: user.role,
      overrides: user.permissions || [],
      effective: computeEffectivePermissions(user.role, user.permissions),
    };
  }

  async getRolePresets() {
    try {
      // Try to get from database first
      const presets = await this.rolePresetModel.find().lean().exec();
      
      if (presets.length > 0) {
        // Convert to the same format as ROLE_PRESETS
        const result: Record<string, string[]> = {};
        presets.forEach((preset) => {
          result[preset.role] = preset.permissions || [];
        });
        
        // Fill in missing roles with defaults
        Object.keys(ROLE_PRESETS).forEach((role) => {
          if (!result[role]) {
            result[role] = ROLE_PRESETS[role as keyof typeof ROLE_PRESETS];
          }
        });
        
        return result;
      }
      
      // If no presets in DB, initialize DB and return defaults
      await this.initializeRolePresets();
      return ROLE_PRESETS;
    } catch (error) {
      console.error('Error getting role presets from DB, using defaults:', error);
      // If DB error, return defaults from constants
      return ROLE_PRESETS;
    }
  }

  async initializeRolePresets() {
    // Initialize with default presets if not exists
    try {
      for (const [role, permissions] of Object.entries(ROLE_PRESETS)) {
        await this.rolePresetModel.findOneAndUpdate(
          { role },
          { role, permissions },
          { upsert: true, new: true }
        );
      }
    } catch (error) {
      console.error('Error initializing role presets:', error);
      // Don't throw, just log - presets will be loaded from constants
    }
  }

  async updateRolePreset(role: string, updateDto: UpdateRolePresetDto) {
    const validRoles = ['administrator', 'editor', 'viewer', 'support'];
    if (!validRoles.includes(role)) {
      throw new BadRequestException(`Invalid role: ${role}`);
    }

    const uniquePermissions = Array.from(new Set(updateDto.permissions));
    
    const preset = await this.rolePresetModel.findOneAndUpdate(
      { role },
      { role, permissions: uniquePermissions },
      { upsert: true, new: true }
    ).lean().exec();

    return preset;
  }

  private async normalizeLegacyRole(user: any) {
    if (!user || !user.role) return;
    const mapped = LEGACY_ROLE_MAP[user.role];
    if (mapped && mapped !== user.role) {
      await this.userModel.updateOne({ _id: user._id }, { role: mapped });
      user.role = mapped;
    }
  }


  hanldeRegister = async (createUser : CreateAuthDto) => {
    const {name, email, password, phone} = createUser
    const isExist = await this.isEmailExist(email)

    if(isExist){
      throw new BadRequestException(`Email đã tồn tại: ${email}. Vui lòng sử dụng email khác `)
    }

    const hashPass = await hashPassword(password)
    // console.log(hashPass)
    const codeId = uuidv4()
    const newUser = await this.userModel.create({
      name: name,
      email: email,
      password: hashPass,
      isActive: false,
      codeId: codeId,
      codeExpired: dayjs().add(1, 'day')
    })

    await this.mailerService.sendMail({
      to: email,
      subject: 'Active your account',
      text: 'welcome',
      template: 'register',
      context: {
        name: name,
        activationCode: codeId 
      }

    })

    return {
      statusCode: 201,
    }
  };
  
  verifyEmail = async (verifyDto: VerifyDto) => {
    const { email, codeId } = verifyDto;

    try {
      const user = await this.userModel.findOne({ email });

      if (!user) {
        return {
          statusCode: 404,
          message: 'User not found',
        };
      }

      if (user.codeId !== codeId) {
        return {
          statusCode: 400,
          message: 'Mã xác nhận không đúng',
        };
      }

      await this.userModel.updateOne(
        { email },
        { email_verified: true, codeId: null }
      );

      return {
        statusCode: 200,
        id: user.id,
        email: user.email,
      };
    } catch (error) {
      return {
        statusCode: 500,
        message: 'Internal server error',
        error: error.message,
      };
    }
  };

  async onModuleInit() {
    // Migration: Add privacy settings to existing users
    try {
      const result = await this.userModel.updateMany(
        {
          $or: [
            { showOverview: { $exists: false } },
            { showBlog: { $exists: false } },
            { showFriends: { $exists: false } },
          ],
        },
        {
          $set: {
            showOverview: true,
            showBlog: true,
            showFriends: true,
          },
        },
      );
      if (result.modifiedCount > 0) {
        console.log(`Migration: Updated ${result.modifiedCount} users with privacy settings`);
      }
    } catch (error) {
      console.error('Error migrating privacy settings:', error);
    }
  }
}
