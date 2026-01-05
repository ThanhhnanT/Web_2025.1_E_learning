import type { CourseModule, Lesson } from '@/types/course';

export interface CourseProgress {
  courseId: string;
  completedLessons: string[];
  lastAccessedLesson?: string;
}

const STORAGE_PREFIX = 'courseProgress_';

/**
 * Get progress data for a course from localStorage
 */
export const getCourseProgressData = (courseId: string): CourseProgress | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const data = localStorage.getItem(`${STORAGE_PREFIX}${courseId}`);
    if (!data) return null;
    return JSON.parse(data) as CourseProgress;
  } catch (error) {
    console.error('Error reading course progress:', error);
    return null;
  }
};

/**
 * Save progress data for a course to localStorage
 */
export const saveCourseProgressData = (progress: CourseProgress): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${progress.courseId}`, JSON.stringify(progress));
  } catch (error) {
    console.error('Error saving course progress:', error);
  }
};

/**
 * Get list of completed lesson IDs for a course
 */
export const getCompletedLessons = (courseId: string): string[] => {
  const progress = getCourseProgressData(courseId);
  return progress?.completedLessons || [];
};

/**
 * Mark a lesson as completed
 */
export const markLessonComplete = (courseId: string, lessonId: string): void => {
  const progress = getCourseProgressData(courseId) || {
    courseId,
    completedLessons: [],
  };
  
  if (!progress.completedLessons.includes(lessonId)) {
    progress.completedLessons.push(lessonId);
    saveCourseProgressData(progress);
  }
};

/**
 * Check if a lesson is completed
 */
export const isLessonCompleted = (courseId: string, lessonId: string): boolean => {
  const completedLessons = getCompletedLessons(courseId);
  return completedLessons.includes(lessonId);
};

/**
 * Calculate progress percentage for a module
 */
export const getModuleProgress = (moduleId: string, lessons: Lesson[], courseId: string): number => {
  if (lessons.length === 0) return 0;
  
  const completedLessons = getCompletedLessons(courseId);
  const completedCount = lessons.filter(lesson => 
    completedLessons.includes(lesson._id)
  ).length;
  
  return Math.round((completedCount / lessons.length) * 100);
};

/**
 * Calculate overall course progress
 */
export const getCourseProgress = (
  courseId: string,
  modules: CourseModule[],
  lessonsByModule: Record<string, Lesson[]>
): number => {
  let totalLessons = 0;
  let completedLessons = 0;
  const completedLessonIds = getCompletedLessons(courseId);
  
  modules.forEach(module => {
    const lessons = lessonsByModule[module._id] || [];
    totalLessons += lessons.length;
    completedLessons += lessons.filter(lesson => 
      completedLessonIds.includes(lesson._id)
    ).length;
  });
  
  if (totalLessons === 0) return 0;
  return Math.round((completedLessons / totalLessons) * 100);
};

/**
 * Get number of completed modules
 */
export const getCompletedModulesCount = (
  modules: CourseModule[],
  lessonsByModule: Record<string, Lesson[]>,
  courseId: string
): number => {
  const completedLessonIds = getCompletedLessons(courseId);
  
  return modules.filter(module => {
    const lessons = lessonsByModule[module._id] || [];
    if (lessons.length === 0) return false;
    return lessons.every(lesson => completedLessonIds.includes(lesson._id));
  }).length;
};

/**
 * Check if a module is completed
 */
export const isModuleCompleted = (
  moduleId: string,
  lessons: Lesson[],
  courseId: string
): boolean => {
  if (lessons.length === 0) return false;
  const completedLessonIds = getCompletedLessons(courseId);
  return lessons.every(lesson => completedLessonIds.includes(lesson._id));
};

/**
 * Check if a module is in progress
 */
export const isModuleInProgress = (
  moduleId: string,
  lessons: Lesson[],
  courseId: string
): boolean => {
  if (lessons.length === 0) return false;
  const completedLessonIds = getCompletedLessons(courseId);
  const hasCompleted = lessons.some(lesson => completedLessonIds.includes(lesson._id));
  const allCompleted = lessons.every(lesson => completedLessonIds.includes(lesson._id));
  return hasCompleted && !allCompleted;
};

/**
 * Check if a module is locked (previous module not completed)
 */
export const isModuleLocked = (
  module: CourseModule,
  modules: CourseModule[],
  lessonsByModule: Record<string, Lesson[]>,
  courseId: string
): boolean => {
  // First module is always unlocked
  if (module.order === 1) return false;
  
  // Find previous module
  const previousModule = modules.find(m => m.order === module.order - 1);
  if (!previousModule) return false;
  
  // Check if previous module is completed
  const previousLessons = lessonsByModule[previousModule._id] || [];
  return !isModuleCompleted(previousModule._id, previousLessons, courseId);
};

/**
 * Get the current lesson (first uncompleted lesson)
 */
export const getCurrentLesson = (
  modules: CourseModule[],
  lessonsByModule: Record<string, Lesson[]>,
  courseId: string
): { module: CourseModule; lesson: Lesson } | null => {
  const completedLessonIds = getCompletedLessons(courseId);
  
  // Sort modules by order
  const sortedModules = [...modules].sort((a, b) => a.order - b.order);
  
  for (const module of sortedModules) {
    const lessons = (lessonsByModule[module._id] || []).sort((a, b) => a.order - b.order);
    
    for (const lesson of lessons) {
      if (!completedLessonIds.includes(lesson._id)) {
        return { module, lesson };
      }
    }
  }
  
  return null;
};

/**
 * Check if a lesson is locked (previous lesson not completed)
 * @param lesson - The lesson to check
 * @param lessons - All lessons in the module
 * @param courseId - Course ID
 * @param module - Optional module object to check if it's module 1 (for free trial)
 */
export const isLessonLocked = (
  lesson: Lesson,
  lessons: Lesson[],
  courseId: string,
  module?: CourseModule
): boolean => {
  // Module 1 (order = 1) is always unlocked for free trial - all lessons accessible
  if (module && module.order === 1) return false;
  
  // First lesson in module is always unlocked
  if (lesson.order === 1) return false;
  
  // Find previous lesson
  const previousLesson = lessons.find(l => l.order === lesson.order - 1);
  if (!previousLesson) return false;
  
  // Check if previous lesson is completed
  return !isLessonCompleted(courseId, previousLesson._id);
};

