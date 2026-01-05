export interface Comment {
  _id: string;
  testId?: string;
  courseId?: string;
  userId: string;
  content: string;
  rating?: number; // 1-5 stars, used for course reviews
  user?: {
    _id: string;
    name: string;
    email?: string;
    avatar_url?: string;
  };
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

