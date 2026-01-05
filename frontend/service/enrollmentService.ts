import { getAccess, postAccess, patchAccess } from '../helper/api';

export interface Enrollment {
  _id: string;
  userId: string;
  courseId: any;
  paymentId: string;
  enrolledAt: string;
  progress: number;
  completedAt?: string;
  status: 'active' | 'completed' | 'suspended';
  completedLessons?: string[];
  lastAccessedLessonId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EnrollmentProgress {
  completedLessons: string[];
  totalLessons: number;
  completedCount: number;
  progressPercentage: number;
  lastAccessedLessonId?: string;
}

export interface EnrollmentStats {
  total: number;
  active: number;
  completed: number;
  suspended: number;
  averageProgress: number;
}

class EnrollmentService {
  /**
   * Get user's enrollments
   */
  async getMyEnrollments(status?: string): Promise<Enrollment[]> {
    return await getAccess('enrollments', { status });
  }

  /**
   * Get enrollment by ID
   */
  async getEnrollmentById(enrollmentId: string): Promise<Enrollment> {
    return await getAccess(`enrollments/${enrollmentId}`);
  }

  /**
   * Check if enrolled in a course
   */
  async checkEnrollment(courseId: string): Promise<{ 
    isEnrolled: boolean; 
    enrollment?: Enrollment;
    progress?: EnrollmentProgress | null;
  }> {
    return await getAccess(`enrollments/check/${courseId}`);
  }

  /**
   * Update progress
   */
  async updateProgress(enrollmentId: string, progress: number): Promise<Enrollment> {
    return await patchAccess(`enrollments/${enrollmentId}/progress`, { progress });
  }

  /**
   * Mark a lesson as complete
   */
  async markLessonComplete(enrollmentId: string, lessonId: string): Promise<Enrollment> {
    return await patchAccess(`enrollments/${enrollmentId}/lessons/${lessonId}/complete`, {});
  }

  /**
   * Get enrollment progress details
   */
  async getEnrollmentProgress(enrollmentId: string): Promise<EnrollmentProgress> {
    return await getAccess(`enrollments/${enrollmentId}/progress`);
  }

  /**
   * Get enrollment statistics
   */
  async getMyStats(): Promise<EnrollmentStats> {
    return await getAccess('enrollments/stats/me');
  }

  /**
   * Suspend enrollment
   */
  async suspendEnrollment(enrollmentId: string, reason?: string): Promise<Enrollment> {
    return await patchAccess(`enrollments/${enrollmentId}/suspend`, { reason });
  }

  /**
   * Reactivate enrollment
   */
  async reactivateEnrollment(enrollmentId: string): Promise<Enrollment> {
    return await patchAccess(`enrollments/${enrollmentId}/reactivate`, {});
  }

  /**
   * Get progress color
   */
  getProgressColor(progress: number): string {
    if (progress < 30) return '#f5222d';
    if (progress < 70) return '#faad14';
    return '#52c41a';
  }

  /**
   * Get status color
   */
  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      active: '#1890ff',
      completed: '#52c41a',
      suspended: '#ff4d4f',
    };
    return colors[status] || '#d9d9d9';
  }

  /**
   * Get status label
   */
  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      active: 'Đang học',
      completed: 'Hoàn thành',
      suspended: 'Tạm dừng',
    };
    return labels[status] || status;
  }
}

export const enrollmentService = new EnrollmentService();
export default enrollmentService;

