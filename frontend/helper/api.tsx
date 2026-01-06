import axios, { type AxiosRequestConfig } from 'axios';
import Cookies from "js-cookie";


// Normalize base URL: remove trailing slash
const getBaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888';
  return url.replace(/\/+$/, ''); // Remove trailing slashes
};

const API_DOMAIN = getBaseUrl();

// Helper to normalize path: ensure it starts with /
const normalizePath = (path: string) => {
  return path.startsWith('/') ? path : '/' + path;
};

const config = {
    headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
    },
    // withCredentials: true
}
export const get = async (path: string, options: AxiosRequestConfig = {}) => {
    try {
        const result = await axios.get(API_DOMAIN + normalizePath(path), {
            ...config,
            ...options,
        });
        return result.data;
    } catch (error){
        console.log(error);
        throw error;
    }
}

export const post = async (path: string, data: object) => {
  try {
    const fullPath = API_DOMAIN + normalizePath(path);
    console.log(fullPath)
    const res = await axios.post(fullPath, data, config);
    return res.data; 
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.log('API Error:', error.response?.data || error.message);
      return error.response?.data; 
    } else {
      console.error('Unknown error:', error);
      throw error;
    }
  }
};


export const patch = async (path: String, data: object) => {
    try{
        const res = await axios.patch(API_DOMAIN + normalizePath(path.toString()), data, config)
        return res
    } catch (e) {
        return e; 
    }
}

export const deleteData = async (path: String) => {
    try{
        const res = await axios.delete(API_DOMAIN + normalizePath(path.toString()))
        return res
    } catch (e) {
        console.log(e)
    }
}




export const upImage = async (path: String, data: object) => {
    try{
        const response = await axios.post(API_DOMAIN + normalizePath(path.toString()), data, { headers: { 'Content-Type': 'multipart/form-data' } })
        return response
    } catch(e) {
        console.log(e)
    }
}



// API KÈM ACCESS_TOKEN

const getTokenHeader = () => {
  const token = Cookies.get('access_token'); 
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getAccess = async (path: string, params: object = {}) => {
  try {
    const tokenHeader = getTokenHeader();
    const result = await axios.get(API_DOMAIN + normalizePath(path), {
      ...config,
      headers: { ...config.headers, ...tokenHeader },
      params, 
    });
    return result.data;
  } catch (e: any) {
    // Log more details for debugging
    if (e?.response) {
      console.error(`API GET Error [${path}]:`, {
        status: e.response.status,
        statusText: e.response.statusText,
        data: e.response.data,
        url: e.config?.url || `${API_DOMAIN}${normalizePath(path)}`,
        message: e.message
      });
      console.error(`Full error response:`, JSON.stringify(e.response.data, null, 2));
    } else if (e?.request) {
      // Network error - server not reachable
      console.error(`API GET Network Error [${path}]:`, e.message || 'Network request failed');
      // Don't log the full request object as it's not useful
    } else {
      console.error(`API GET Error [${path}]:`, e.message || 'Unknown error');
    }
    throw e; // Re-throw để component có thể handle error
  }
};


export const postAccess = async (path: string, data: object, options: AxiosRequestConfig = {}) => {
  try {
    const tokenHeader = getTokenHeader();
    // If data is FormData, don't set Content-Type header (let browser set it with boundary)
    const isFormData = data instanceof FormData;
    let headers: any;
    
    if (isFormData) {
      // For FormData, only include token and remove Content-Type from options.headers
      const { 'Content-Type': _, ...otherOptionsHeaders } = options.headers || {};
      headers = { ...tokenHeader, ...otherOptionsHeaders };
    } else {
      headers = { ...config.headers, ...tokenHeader, ...options.headers };
    }
    
    const res = await axios.post(API_DOMAIN + normalizePath(path), data, { 
      ...config, 
      ...options,
      headers
    });
    return res.data;
  } catch (error: any) {
    // Log more details for debugging
    if (error?.response) {
      console.error(`API POST Error [${path}]:`, {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        url: error.config?.url || `${API_DOMAIN}${normalizePath(path)}`,
        message: error.message
      });
      console.error(`Full error response:`, JSON.stringify(error.response.data, null, 2));
    } else if (error?.request) {
      console.error(`API POST Network Error [${path}]:`, {
        message: error.message,
        url: `${API_DOMAIN}${normalizePath(path)}`,
        request: error.request
      });
    } else {
      console.error(`API POST Error [${path}]:`, {
        message: error.message,
        error: error
      });
    }
    throw error; // Re-throw để component có thể handle error
  }
};

export const patchAccess = async (path: string, data: object, options: AxiosRequestConfig = {}) => {
  try {
    const tokenHeader = getTokenHeader();
    // If data is FormData, don't set Content-Type header (let browser set it with boundary)
    const isFormData = data instanceof FormData;
    let headers: any;
    
    if (isFormData) {
      // For FormData, only include token and remove Content-Type from options.headers
      const { 'Content-Type': _, ...otherOptionsHeaders } = options.headers || {};
      headers = { ...tokenHeader, ...otherOptionsHeaders };
    } else {
      headers = { ...config.headers, ...tokenHeader, ...options.headers };
    }
    
    const res = await axios.patch(API_DOMAIN + normalizePath(path), data, { 
      ...config, 
      ...options,
      headers
    });
    return res.data;
  } catch (e: any) {
    // Log more details for debugging
    if (e?.response) {
      console.error(`API PATCH Error [${path}]:`, {
        status: e.response.status,
        statusText: e.response.statusText,
        data: e.response.data,
        url: e.config?.url || `${API_DOMAIN}${normalizePath(path)}`,
        message: e.message
      });
      console.error(`Full error response:`, JSON.stringify(e.response.data, null, 2));
    } else if (e?.request) {
      console.error(`API PATCH Network Error [${path}]:`, {
        message: e.message,
        url: `${API_DOMAIN}${normalizePath(path)}`,
        request: e.request
      });
    } else {
      console.error(`API PATCH Error [${path}]:`, {
        message: e.message,
        error: e
      });
    }
    throw e; // Re-throw để component có thể handle error
  }
};

export const deleteAccess = async (path: string) => {
  try {
    const tokenHeader = await getTokenHeader();
    const res = await axios.delete(API_DOMAIN + normalizePath(path), { ...config, headers: { ...config.headers, ...tokenHeader } });
    return res.data;
  } catch (e: any) {
    // Log more details for debugging
    if (e?.response) {
      console.error(`API DELETE Error [${path}]:`, {
        status: e.response.status,
        statusText: e.response.statusText,
        data: e.response.data,
        url: e.config?.url || `${API_DOMAIN}${normalizePath(path)}`,
        message: e.message
      });
      console.error(`Full error response:`, JSON.stringify(e.response.data, null, 2));
    } else if (e?.request) {
      console.error(`API DELETE Network Error [${path}]:`, {
        message: e.message,
        url: `${API_DOMAIN}${normalizePath(path)}`,
        request: e.request
      });
    } else {
      console.error(`API DELETE Error [${path}]:`, {
        message: e.message,
        error: e
      });
    }
    throw e; // Re-throw để component có thể handle error
  }
};

// Profile functions
export const getUserProfile = async () => {
  try {
    return await getAccess('auth/profile');
  } catch (error: any) {
    // Only log if it's not a network error (those are already logged in getAccess)
    if (error?.response) {
      console.error('Error fetching user profile:', error.response?.data || error.message);
    }
    throw error;
  }
};

export const updateProfile = async (data: { 
  name?: string; 
  phone?: string; 
  bio?: string;
  showOverview?: boolean;
  showBlog?: boolean;
  showFriends?: boolean;
}) => {
  try {
    return await patchAccess('users/profile', data);
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};

export const uploadAvatar = async (file: File) => {
  try {
    const tokenHeader = await getTokenHeader();
    const formData = new FormData();
    formData.append('file', file);
    
    const res = await axios.post(API_DOMAIN + normalizePath('users/profile/avatar'), formData, {
      headers: {
        ...tokenHeader,
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw error;
  }
};

export const uploadVideo = async (file: File) => {
  try {
    const tokenHeader = await getTokenHeader();
    const formData = new FormData();
    formData.append('file', file);
    
    const res = await axios.post(API_DOMAIN + normalizePath('users/upload/video'), formData, {
      headers: {
        ...tokenHeader,
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  } catch (error) {
    console.error('Error uploading video:', error);
    throw error;
  }
};

export const uploadCoverImage = async (file: File) => {
  try {
    const tokenHeader = await getTokenHeader();
    const formData = new FormData();
    formData.append('file', file);
    
    const res = await axios.post(API_DOMAIN + normalizePath('users/profile/cover-image'), formData, {
      headers: {
        ...tokenHeader,
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  } catch (error) {
    console.error('Error uploading cover image:', error);
    throw error;
  }
};

export const changePassword = async (data: { oldPassword: string; newPassword: string }) => {
  try {
    return await patchAccess('users/profile/password', data);
  } catch (error) {
    console.error('Error changing password:', error);
    throw error;
  }
};

// Logout function - removes access token cookie
export function logoutUser() {
  Cookies.remove("access_token");
}