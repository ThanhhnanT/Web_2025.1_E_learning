import { getAccess, postAccess, patchAccess, deleteAccess } from '@/helper/api';

export interface AdminPost {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    avatar_url?: string;
  };
  content: string;
  imageUrl?: string;
  status?: 'active' | 'pending' | 'reported' | 'archived';
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Get all posts with admin filters
export const getAdminPosts = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
  userId?: string;
  includeDeleted?: boolean;
  search?: string;
}) => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.status) queryParams.append('status', params.status);
  if (params?.userId) queryParams.append('userId', params.userId);
  if (params?.includeDeleted) queryParams.append('includeDeleted', 'true');
  if (params?.search) queryParams.append('search', params.search);

  return await getAccess(`admin/posts?${queryParams.toString()}`);
};

// Get reported posts
export const getReportedPosts = async () => {
  return await getAccess('admin/posts/reported');
};

// Get post statistics
export const getPostStatistics = async () => {
  return await getAccess('admin/posts/statistics');
};

// Admin update post
export const adminUpdatePost = async (id: string, data: Partial<{ content: string; imageUrl: string }>) => {
  return await patchAccess(`admin/posts/${id}`, data);
};

// Moderate post
export const moderatePost = async (id: string, status: string) => {
  return await patchAccess(`admin/posts/${id}/moderate`, { status });
};

// Hard delete post
export const hardDeletePost = async (id: string) => {
  return await deleteAccess(`admin/posts/${id}/hard`);
};

// Soft delete post
export const adminDeletePost = async (id: string) => {
  return await deleteAccess(`admin/posts/${id}`);
};

// Restore deleted post
export const restorePost = async (id: string) => {
  return await postAccess(`admin/posts/${id}/restore`, {});
};

// Bulk moderate posts
export const bulkModeratePosts = async (postIds: string[], status: string) => {
  return await postAccess('admin/posts/bulk/moderate', { postIds, status });
};

// Bulk delete posts
export const bulkDeletePosts = async (postIds: string[]) => {
  return await postAccess('admin/posts/bulk/delete', { postIds });
};

// Bulk hard delete posts
export const bulkHardDeletePosts = async (postIds: string[]) => {
  return await postAccess('admin/posts/bulk/hard', { postIds });
};

