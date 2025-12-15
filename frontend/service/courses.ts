import { getAccess } from '@/helper/api';
import type { Course, CourseModule, Lesson } from '@/types/course';

export const getAllCourses = async (): Promise<Course[]> => {
  const data = await getAccess('courses');
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

