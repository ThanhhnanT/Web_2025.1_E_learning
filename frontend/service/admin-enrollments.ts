import { getAccess, postAccess, patchAccess, deleteAccess } from '@/helper/api';

export interface AdminEnrollment {
  _id: string;
  userId: string;
  courseId: string;
  status: 'active' | 'completed' | 'suspended';
  progress: number;
  createdAt: Date;
  updatedAt: Date;
}

// Get all enrollments
export const getAdminEnrollments = async (params?: {
  page?: number;
  limit?: number;
  userId?: string;
  courseId?: string;
  status?: string;
}) => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.userId) queryParams.append('userId', params.userId);
  if (params?.courseId) queryParams.append('courseId', params.courseId);
  if (params?.status) queryParams.append('status', params.status);

  return await getAccess(`admin/enrollments?${queryParams.toString()}`);
};

// Create enrollment
export const createAdminEnrollment = async (userId: string, courseId: string) => {
  return await postAccess('admin/enrollments', { userId, courseId });
};

// Update enrollment
export const updateAdminEnrollment = async (id: string, data: { status?: string; progress?: number }) => {
  return await patchAccess(`admin/enrollments/${id}`, data);
};

// Delete enrollment
export const deleteAdminEnrollment = async (id: string) => {
  return await deleteAccess(`admin/enrollments/${id}`);
};

// Reset progress
export const resetEnrollmentProgress = async (id: string) => {
  return await postAccess(`admin/enrollments/${id}/reset-progress`, {});
};

// Suspend enrollment
export const suspendEnrollment = async (id: string, reason?: string) => {
  return await postAccess(`admin/enrollments/${id}/suspend`, { reason });
};

// Reactivate enrollment
export const reactivateEnrollment = async (id: string) => {
  return await postAccess(`admin/enrollments/${id}/reactivate`, {});
};

// Bulk create enrollments
export const bulkCreateEnrollments = async (enrollments: Array<{ userId: string; courseId: string }>) => {
  return await postAccess('admin/enrollments/bulk/create', { enrollments });
};

