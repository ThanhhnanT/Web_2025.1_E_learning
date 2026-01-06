export type RoleKey = 'administrator' | 'viewer';

export const LEGACY_ROLE_MAP: Record<string, RoleKey> = {
  admin: 'administrator',
  user: 'viewer',
  editor: 'viewer',
  support: 'viewer',
};

export const ROLE_PRESETS: Record<RoleKey, string[]> = {
  administrator: [
    // User management
    'user:create',
    'user:edit',
    'user:edit-any',
    'user:delete',
    'user:view',
    'user:suspend',
    'user:activate',
    // Content management
    'content:publish',
    'content:categories',
    'content:edit-any',
    'content:delete-any',
    // Post management
    'post:create',
    'post:edit',
    'post:edit-any',
    'post:delete',
    'post:delete-any',
    'post:view',
    'post:moderate',
    // Comment management
    'comment:create',
    'comment:edit',
    'comment:edit-any',
    'comment:delete',
    'comment:delete-any',
    'comment:view',
    'comment:moderate',
    // Course management
    'course:create',
    'course:edit',
    'course:edit-any',
    'course:delete',
    'course:delete-any',
    'course:view',
    'course:publish',
    // Test management
    'test:create',
    'test:edit',
    'test:edit-any',
    'test:delete',
    'test:delete-any',
    'test:view',
    // Flashcard management
    'flashcard:create',
    'flashcard:edit',
    'flashcard:edit-any',
    'flashcard:delete',
    'flashcard:delete-any',
    'flashcard:view',
    // Chat management
    'chat:view-all',
    'chat:delete-any',
    'chat:moderate',
    // Enrollment management
    'enrollment:create',
    'enrollment:edit',
    'enrollment:delete',
    'enrollment:view-all',
    // Payment management
    'payment:view-all',
    'payment:manage',
    'payment:refund',
    // Friend/Social management
    'friend:view-all',
    'friend:manage',
    // Statistics
    'statistics:view-all',
    // Billing
    'billing:view',
    'billing:manage',
  ],
  viewer: [
    'post:create',
    'post:view',
    'post:edit', // Can only edit own posts
    'comment:create',
    'comment:view',
    'comment:edit', // Can only edit own comments
    'course:view',
    'test:view',
    'flashcard:view',
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


