import { getAccess, postAccess, patchAccess, deleteAccess } from '@/helper/api';

export interface AdminCourse {
  _id: string;
  title: string;
  description: string;
  category: 'HSK' | 'TOEIC' | 'IELTS';
  price: number;
  difficulty: string;
  status?: 'draft' | 'published';
  published?: boolean; // Deprecated, use status instead
  createdAt: Date;
  updatedAt: Date;
}

// Get all courses
export const getAdminCourses = async (params?: {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
}) => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.category) queryParams.append('category', params.category);
  if (params?.search) queryParams.append('search', params.search);

  return await getAccess(`admin/courses?${queryParams.toString()}`);
};

// Get course analytics
export const getCourseAnalytics = async (id: string) => {
  return await getAccess(`admin/courses/${id}/analytics`);
};

// Create course
export const createAdminCourse = async (data: Partial<AdminCourse>) => {
  return await postAccess('admin/courses', data);
};

// Update course
export const updateAdminCourse = async (id: string, data: Partial<AdminCourse>) => {
  return await patchAccess(`admin/courses/${id}`, data);
};

// Delete course
export const deleteAdminCourse = async (id: string) => {
  return await deleteAccess(`admin/courses/${id}`);
};

// Toggle publish status
export const toggleCoursePublish = async (id: string, published: boolean) => {
  return await postAccess(`admin/courses/${id}/publish`, { published });
};

// Module management
export const createAdminModule = async (data: any) => {
  return await postAccess('admin/courses/modules', data);
};

export const updateAdminModule = async (id: string, data: any) => {
  return await patchAccess(`admin/courses/modules/${id}`, data);
};

export const deleteAdminModule = async (id: string) => {
  return await deleteAccess(`admin/courses/modules/${id}`);
};

// Lesson management
export const createAdminLesson = async (data: any) => {
  return await postAccess('admin/courses/lessons', data);
};

export const updateAdminLesson = async (id: string, data: any) => {
  return await patchAccess(`admin/courses/lessons/${id}`, data);
};

export const deleteAdminLesson = async (id: string) => {
  return await deleteAccess(`admin/courses/lessons/${id}`);
};

// Bulk operations
export const bulkDeleteCourses = async (courseIds: string[]) => {
  return await postAccess('admin/courses/bulk/delete', { courseIds });
};

