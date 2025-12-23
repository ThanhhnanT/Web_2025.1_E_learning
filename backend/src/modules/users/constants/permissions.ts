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
    'billing:view',
    'billing:manage',
  ],
  editor: [
    'user:view',
    'content:publish',
    'content:categories',
  ],
  viewer: [
    'user:view',
  ],
  support: [
    'user:view',
    'user:edit',
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


