import { getAccess, postAccess, patchAccess, deleteAccess } from '@/helper/api';

export interface AdminComment {
  _id: string;
  postId: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    avatar_url?: string;
  };
  content: string;
  imageUrl?: string;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Get all comments with admin filters
export const getAdminComments = async (params?: {
  page?: number;
  limit?: number;
  postId?: string;
  userId?: string;
  includeDeleted?: boolean;
  search?: string;
}) => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.postId) queryParams.append('postId', params.postId);
  if (params?.userId) queryParams.append('userId', params.userId);
  if (params?.includeDeleted) queryParams.append('includeDeleted', 'true');
  if (params?.search) queryParams.append('search', params.search);

  return await getAccess(`admin/comments?${queryParams.toString()}`);
};

// Get reported comments
export const getReportedComments = async () => {
  return await getAccess('admin/comments/reported');
};

// Get comment statistics
export const getCommentStatistics = async () => {
  return await getAccess('admin/comments/statistics');
};

// Get comment by ID
export const getCommentById = async (id: string) => {
  return await getAccess(`admin/comments/${id}`);
};

// Admin update comment
export const adminUpdateComment = async (postId: string, commentId: string, data: { content: string }) => {
  return await patchAccess(`admin/comments/${postId}/comments/${commentId}`, data);
};

// Admin delete comment
export const adminDeleteComment = async (postId: string, commentId: string) => {
  return await deleteAccess(`admin/comments/${postId}/comments/${commentId}`);
};

// Hard delete comment
export const hardDeleteComment = async (commentId: string) => {
  return await deleteAccess(`admin/comments/${commentId}/hard`);
};

// Restore comment
export const restoreComment = async (commentId: string) => {
  return await postAccess(`admin/comments/${commentId}/restore`, {});
};

// Bulk delete comments
export const bulkDeleteComments = async (commentIds: string[]) => {
  return await postAccess('admin/comments/bulk/delete', { commentIds });
};

// Bulk hard delete comments
export const bulkHardDeleteComments = async (commentIds: string[]) => {
  return await postAccess('admin/comments/bulk/hard', { commentIds });
};

