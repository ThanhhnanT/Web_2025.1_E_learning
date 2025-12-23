import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from './decorate/permissions.decorator';
import { UsersService } from '@/modules/users/users.service';
import { computeEffectivePermissions } from '@/modules/users/constants/permissions';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector, private usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user || !user._id) {
      throw new UnauthorizedException('User not authenticated');
    }

    const freshUser = await this.usersService.findOne(user._id);
    const effective = computeEffectivePermissions(freshUser.role, freshUser.permissions);
    const hasAll = requiredPermissions.every((perm) => effective.includes(perm));
    return hasAll;
  }
}


