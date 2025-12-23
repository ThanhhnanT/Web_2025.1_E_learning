import { getAccess, postAccess, patchAccess, deleteAccess } from "@/helper/api";
import { Test, TestStatus } from "@/types/test";

export interface AdminTestQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: TestStatus | string;
  skill?: string;
  testType?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const fetchAdminTests = async (params: AdminTestQuery) => {
  return getAccess("tests", params) as Promise<PaginatedResponse<Test>>;
};

export const fetchTestStructure = async (testId: string) => {
  return getAccess(`tests/${testId}/structure`);
};

export const createTest = async (payload: Partial<Test>) => {
  return postAccess("tests", payload);
};

export const updateTest = async (id: string, payload: Partial<Test>) => {
  return patchAccess(`tests/${id}`, payload);
};

export const deleteTest = async (id: string) => {
  return deleteAccess(`tests/${id}`);
};

// Admin endpoints (auth required)
export const createSection = async (testId: string, payload: any) => {
  return postAccess(`admin/tests/${testId}/sections`, payload);
};

export const updateSection = async (
  testId: string,
  sectionId: string,
  payload: any
) => {
  return patchAccess(`admin/tests/${testId}/sections/${sectionId}`, payload);
};

export const deleteSection = async (testId: string, sectionId: string) => {
  return deleteAccess(`admin/tests/${testId}/sections/${sectionId}`);
};

export const createGroup = async (
  testId: string,
  sectionId: string,
  payload: any
) => {
  return postAccess(
    `admin/tests/${testId}/sections/${sectionId}/groups`,
    payload
  );
};

export const updateGroup = async (
  testId: string,
  sectionId: string,
  groupId: string,
  payload: any
) => {
  return patchAccess(
    `admin/tests/${testId}/sections/${sectionId}/groups/${groupId}`,
    payload
  );
};

export const deleteGroup = async (
  testId: string,
  sectionId: string,
  groupId: string
) => {
  return deleteAccess(
    `admin/tests/${testId}/sections/${sectionId}/groups/${groupId}`
  );
};

export const createQuestion = async (groupId: string, payload: any) => {
  return postAccess(`admin/tests/groups/${groupId}/questions`, payload);
};

export const updateQuestion = async (
  questionId: string,
  payload: any
) => {
  return patchAccess(`admin/tests/questions/${questionId}`, payload);
};

export const deleteQuestion = async (questionId: string) => {
  return deleteAccess(`admin/tests/questions/${questionId}`);
};

export const upsertAnswer = async (
  testId: string,
  sectionId: string,
  payload: any
) => {
  return postAccess(`admin/tests/${testId}/sections/${sectionId}/answers`, payload);
};

