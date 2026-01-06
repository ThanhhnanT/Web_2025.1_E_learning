import { getAccess } from '@/helper/api';

const API_DOMAIN = process.env.API || 'http://localhost:8888/';

// Overview Statistics
export const getAdminOverviewStats = async () => {
  return await getAccess('admin/statistics/overview');
};

// User Growth
export const getUserGrowthStats = async (days: number = 30) => {
  return await getAccess(`admin/statistics/users/growth?days=${days}`);
};

// Content Trends
export const getContentTrends = async (days: number = 30) => {
  return await getAccess(`admin/statistics/content/trends?days=${days}`);
};

// Most Active Users
export const getMostActiveUsers = async (limit: number = 10) => {
  return await getAccess(`admin/statistics/users/most-active?limit=${limit}`);
};

// Popular Courses
export const getPopularCourses = async (limit: number = 10) => {
  return await getAccess(`admin/statistics/courses/popular?limit=${limit}`);
};

// Learning Statistics
export const getLearningStats = async () => {
  return await getAccess('admin/statistics/learning/overview');
};

// Recent Activity
export const getRecentActivity = async (limit: number = 5) => {
  return await getAccess(`admin/statistics/activity/recent?limit=${limit}`);
};

