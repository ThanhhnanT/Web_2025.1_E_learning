import { getAccess } from "@/helper/api";

// Get overall statistics for a user
export const getUserStatistics = async (userId: string) => {
  return await getAccess(`statistics/user/${userId}`);
};

// Get test statistics
export const getTestStatistics = async (userId: string) => {
  return await getAccess(`statistics/user/${userId}/tests`);
};

// Get course statistics
export const getCourseStatistics = async (userId: string) => {
  return await getAccess(`statistics/user/${userId}/courses`);
};

// Get flashcard statistics
export const getFlashcardStatistics = async (userId: string) => {
  return await getAccess(`statistics/user/${userId}/flashcards`);
};

// Get test chart data
export const getTestChartData = async (userId: string, startDate?: string, endDate?: string) => {
  const params: any = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  return await getAccess(`statistics/user/${userId}/tests/chart-data`, params);
};

