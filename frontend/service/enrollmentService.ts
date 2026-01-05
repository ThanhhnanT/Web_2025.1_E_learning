import api from '../lib/api';

export interface Enrollment {
  _id: string;
  userId: string;
  courseId: any;
  paymentId: string;
  enrolledAt: string;
  progress: number;
  completedAt?: string;
  status: 'active' | 'completed' | 'suspended';
  createdAt: string;
  updatedAt: string;
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
    const response = await api.get('/enrollments', {
      params: { status },
    });
    return response.data;
  }

  /**
   * Get enrollment by ID
   */
  async getEnrollmentById(enrollmentId: string): Promise<Enrollment> {
    const response = await api.get(`/enrollments/${enrollmentId}`);
    return response.data;
  }

  /**
   * Check if enrolled in a course
   */
  async checkEnrollment(courseId: string): Promise<{ isEnrolled: boolean; enrollment?: Enrollment }> {
    const response = await api.get(`/enrollments/check/${courseId}`);
    return response.data;
  }

  /**
   * Update progress
   */
  async updateProgress(enrollmentId: string, progress: number): Promise<Enrollment> {
    const response = await api.patch(`/enrollments/${enrollmentId}/progress`, { progress });
    return response.data;
  }

  /**
   * Get enrollment statistics
   */
  async getMyStats(): Promise<EnrollmentStats> {
    const response = await api.get('/enrollments/stats/me');
    return response.data;
  }

  /**
   * Suspend enrollment
   */
  async suspendEnrollment(enrollmentId: string, reason?: string): Promise<Enrollment> {
    const response = await api.patch(`/enrollments/${enrollmentId}/suspend`, { reason });
    return response.data;
  }

  /**
   * Reactivate enrollment
   */
  async reactivateEnrollment(enrollmentId: string): Promise<Enrollment> {
    const response = await api.patch(`/enrollments/${enrollmentId}/reactivate`);
    return response.data;
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

