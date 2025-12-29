export type RoleKey = 'administrator' | 'editor' | 'viewer' | 'support';

export const LEGACY_ROLE_MAP: Record<string, RoleKey> = {
  admin: 'administrator',
  user: 'viewer',
};

export const ROLE_PRESETS: Record<RoleKey, string[]> = {
  administrator: [
    'user:create',
    'user:edit',
    'user:delete',
    'user:view',
    'content:publish',
    'content:categories',
    'post:create',
    'post:edit',
    'post:delete',
    'post:view',
    'post:moderate',
    'billing:view',
    'billing:manage',
  ],
  editor: [
    'user:view',
    'content:publish',
    'content:categories',
    'post:create',
    'post:edit',
    'post:view',
    'post:moderate',
  ],
  viewer: [
    'user:view',
    'post:create',
    'post:view',
  ],
  support: [
    'user:view',
    'user:edit',
    'post:view',
    'billing:view',
  ],
};

export const computeEffectivePermissions = (
  role: string | undefined,
  overrides?: string[] | null,
): string[] => {
  if (overrides && overrides.length > 0) {
    return Array.from(new Set(overrides));
  }
  const preset = role && ROLE_PRESETS[role as RoleKey];
  return preset ? Array.from(new Set(preset)) : [];
};


