import { getAccess, postAccess, patchAccess, deleteAccess } from '@/helper/api';

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  bio?: string;
  avatar_url?: string;
  email_verified: boolean;
  role: 'administrator' | 'editor' | 'viewer' | 'support';
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
  lastLoginIp?: string;
  lastLoginLocation?: string;
}

export interface UsersResponse {
  data: User[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  phone: string;
  role?: 'administrator' | 'editor' | 'viewer' | 'support';
}

export interface UpdateUserData {
  name?: string;
  phone?: string;
  bio?: string;
  role?: 'administrator' | 'editor' | 'viewer' | 'support';
  email_verified?: boolean;
}

export const getUsers = async (
  page: number = 1,
  limit: number = 10,
  search?: string,
  role?: string
): Promise<UsersResponse> => {
  const params: any = {
    page: page.toString(),
    limit: limit.toString(),
  };
  
  if (search) {
    params.search = search;
  }
  
  if (role && role !== 'all') {
    params.role = role;
  }
  
  const queryString = new URLSearchParams(params).toString();
  return await getAccess(`users?${queryString}`);
};

export const getUserById = async (id: string): Promise<User> => {
  return await getAccess(`users/${id}`);
};

export const createUser = async (data: CreateUserData): Promise<{ _id: string }> => {
  return await postAccess('users/create-user', data);
};

export const updateUser = async (id: string, data: UpdateUserData): Promise<User> => {
  return await patchAccess(`users/${id}`, data);
};

export const deleteUser = async (id: string): Promise<{ message: string; statusCode: number }> => {
  return await deleteAccess(`users/${id}`);
};

export const getRolePresets = async (): Promise<Record<string, string[]>> => {
  return await getAccess('users/roles/presets');
};

export const updateRolePreset = async (
  role: string,
  permissions: string[]
): Promise<any> => {
  return await patchAccess(`users/roles/presets/${role}`, { permissions });
};

