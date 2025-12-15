export type CourseTopic = 'All' | 'HSK' | 'TOEIC' | 'IELTS' | 'Other';

export interface Instructor {
  _id?: string;
  name?: string;
  avatar?: string;
  bio?: string;
}

export interface Course {
  _id: string;
  title: string;
  description?: string;
  language?: string;
  level?: string;
  price: number;
  thumbnail_url?: string;
  avatar?: string;
  instructor?: Instructor | string;
  status?: 'draft' | 'published';
  totalStudents?: number;
  totalModules?: number;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CourseModule {
  _id: string;
  courseId: string;
  title: string;
  description?: string;
  order: number;
  totalLessons?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface LessonContent {
  video_url?: string;
  text_content?: string;
  quiz_data?: unknown;
  [key: string]: unknown;
}

export interface Lesson {
  _id: string;
  moduleId: string;
  title: string;
  description?: string;
  order: number;
  type: 'video' | 'text' | 'quiz';
  content?: string | LessonContent;
  duration?: number;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

