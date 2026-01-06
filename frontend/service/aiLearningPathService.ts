import { postAccess, getAccess, patchAccess } from '@/helper/api';

export interface CreateAiLearningPathRequest {
  goal: string;
  level?: string;
  description?: string;
  estimatedHours: number;
  weeklyHours?: number;
  goals?: string;
}

export interface UpdateProgressRequest {
  completedDay?: number;
  currentDay?: number;
  progressPercentage?: number;
}

export interface LearningPathResponse {
  success: boolean;
  data: {
    skills: Record<string, string[]>;
    learning_path: any[];
    roadmapId?: string;
    learningPathId?: string;
    totalDays?: number;
    roadmap_id?: string;
    learning_path_id?: string;
    total_days?: number;
    imageUrl?: string;
  };
  message: string;
}

/**
 * Generate a new AI learning path
 */
export const generateLearningPath = async (
  data: CreateAiLearningPathRequest
): Promise<LearningPathResponse> => {
  try {
    const response = await postAccess('ai-learning-paths/generate', data);
    return response;
  } catch (error: any) {
    console.error('Error generating learning path:', error);
    throw error;
  }
};

/**
 * Get all learning paths for the current user
 */
export const getUserLearningPaths = async () => {
  try {
    console.log('[aiLearningPathService] Fetching user learning paths from: ai-learning-paths');
    const response = await getAccess('ai-learning-paths');
    console.log('[aiLearningPathService] API Response:', response);
    console.log('[aiLearningPathService] Response type:', typeof response);
    console.log('[aiLearningPathService] Is array:', Array.isArray(response));
    if (response && typeof response === 'object') {
      console.log('[aiLearningPathService] Response keys:', Object.keys(response));
    }
    return response;
  } catch (error: any) {
    console.error('[aiLearningPathService] Error getting user learning paths:', error);
    console.error('[aiLearningPathService] Error response:', error?.response);
    console.error('[aiLearningPathService] Error message:', error?.message);
    throw error;
  }
};

/**
 * Get a specific learning path by ID
 */
export const getLearningPath = async (id: string) => {
  try {
    const response = await getAccess(`ai-learning-paths/${id}`);
    return response;
  } catch (error: any) {
    console.error('Error getting learning path:', error);
    throw error;
  }
};

/**
 * Update progress for a learning path
 */
export const updateProgress = async (
  id: string,
  data: UpdateProgressRequest
) => {
  try {
    const response = await patchAccess(`ai-learning-paths/${id}/progress`, data);
    return response;
  } catch (error: any) {
    console.error('Error updating progress:', error);
    throw error;
  }
};

/**
 * Get progress for a learning path
 */
export const getProgress = async (id: string) => {
  try {
    const response = await getAccess(`ai-learning-paths/${id}/progress`);
    return response;
  } catch (error: any) {
    console.error('Error getting progress:', error);
    throw error;
  }
};

