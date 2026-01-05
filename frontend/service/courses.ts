import { getAccess, postAccess } from '@/helper/api';
import type { Course, CourseModule, Lesson } from '@/types/course';

interface CourseFilters {
  category?: 'HSK' | 'TOEIC' | 'IELTS';
  difficulty?: string;
  minPrice?: number;
  maxPrice?: number;
  isFree?: boolean;
  search?: string;
}

export const getAllCourses = async (filters?: CourseFilters): Promise<Course[]> => {
  const params: any = {};
  
  if (filters?.category) params.category = filters.category;
  if (filters?.difficulty) params.difficulty = filters.difficulty;
  if (filters?.minPrice !== undefined) params.minPrice = filters.minPrice;
  if (filters?.maxPrice !== undefined) params.maxPrice = filters.maxPrice;
  if (filters?.isFree !== undefined) params.isFree = filters.isFree;
  if (filters?.search) params.search = filters.search;

  const data = await getAccess('courses', params);
  return Array.isArray(data) ? data : [];
};

export const getCourseById = async (id: string): Promise<Course | null> => {
  if (!id) return null;
  const data = await getAccess(`courses/${id}`);
  return data ?? null;
};

export const getModulesByCourseId = async (courseId: string): Promise<CourseModule[]> => {
  if (!courseId) return [];
  const data = await getAccess('courses/modules/all', { courseId });
  return Array.isArray(data) ? data : [];
};

export const getLessonsByModuleId = async (moduleId: string): Promise<Lesson[]> => {
  if (!moduleId) return [];
  const data = await getAccess('courses/lessons/all', { moduleId });
  return Array.isArray(data) ? data : [];
};

// Review/Comment functions
export const getCourseReviews = async (courseId: string) => {
  if (!courseId) return [];
  const data = await getAccess(`comments/course/${courseId}`);
  return Array.isArray(data) ? data : [];
};

export const getCourseAverageRating = async (courseId: string) => {
  if (!courseId) return { averageRating: 0, totalReviews: 0 };
  const data = await getAccess(`comments/course/${courseId}/rating`);
  return data || { averageRating: 0, totalReviews: 0 };
};

export const createCourseReview = async (
  courseId: string,
  rating: number,
  content: string,
  userId: string
) => {
  return await postAccess('comments', {
    courseId,
    userId,
    rating,
    content,
  });
};

