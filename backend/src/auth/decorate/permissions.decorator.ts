import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions_required';
export const Permissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);


