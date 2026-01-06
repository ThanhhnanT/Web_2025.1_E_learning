import { CanActivate, ExecutionContext, Injectable, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UsersService } from '@/modules/users/users.service';

/**
 * Admin Guard
 * Protects routes that require administrator role
 * Use this guard on admin-only endpoints
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user._id) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Fetch fresh user data from database to ensure role is current
    const freshUser = await this.usersService.findOne(user._id);
    
    if (!freshUser) {
      throw new UnauthorizedException('User not found');
    }

    // Check if user has administrator role
    if (freshUser.role !== 'administrator') {
      throw new ForbiddenException('Access denied. Administrator role required.');
    }

    // Attach fresh user to request for use in controllers
    request.user = freshUser;

    return true;
  }
}

