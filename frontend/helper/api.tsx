import axios, { type AxiosRequestConfig } from 'axios';
import Cookies from "js-cookie";


const API_DOMAIN = process.env.API || 'http://localhost:8888/'
const config = {
    headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
    },
    // withCredentials: true
}
export const get = async (path: string, options: AxiosRequestConfig = {}) => {
    try {
        const result = await axios.get(API_DOMAIN + path, {
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
    console.log(API_DOMAIN + path)
    const res = await axios.post(API_DOMAIN + path, data, config);
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
        const res = await axios.patch(API_DOMAIN +path, data, config)
        return res
    } catch (e) {
        return e; 
    }
}

export const deleteData = async (path: String) => {
    try{
        const res = await axios.delete(API_DOMAIN + path)
        return res
    } catch (e) {
        console.log(e)
    }
}




export const upImage = async (path: String, data: object) => {
    try{
        const response = await axios.post(API_DOMAIN + path, data, { headers: { 'Content-Type': 'multipart/form-data' } })
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
    const result = await axios.get(API_DOMAIN + path, {
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
        url: e.config?.url || `${API_DOMAIN}${path}`,
        message: e.message
      });
      console.error(`Full error response:`, JSON.stringify(e.response.data, null, 2));
    } else if (e?.request) {
      console.error(`API GET Network Error [${path}]:`, {
        message: e.message,
        url: `${API_DOMAIN}${path}`,
        request: e.request
      });
    } else {
      console.error(`API GET Error [${path}]:`, {
        message: e.message,
        error: e
      });
    }
    throw e; // Re-throw để component có thể handle error
  }
};


export const postAccess = async (path: string, data: object) => {
  try {
    const tokenHeader = await getTokenHeader();
    const res = await axios.post(API_DOMAIN + path, data, { ...config, headers: { ...config.headers, ...tokenHeader } });
    return res.data;
  } catch (error) {
    console.log('API Error:', error);
    throw error;
  }
};

export const patchAccess = async (path: string, data: object) => {
  try {
    const tokenHeader = await getTokenHeader();
    const res = await axios.patch(API_DOMAIN + path, data, { ...config, headers: { ...config.headers, ...tokenHeader } });
    return res.data;
  } catch (e: any) {
    // Log more details for debugging
    if (e?.response) {
      console.error(`API PATCH Error [${path}]:`, {
        status: e.response.status,
        statusText: e.response.statusText,
        data: e.response.data,
        url: e.config?.url || `${API_DOMAIN}${path}`,
        message: e.message
      });
      console.error(`Full error response:`, JSON.stringify(e.response.data, null, 2));
    } else if (e?.request) {
      console.error(`API PATCH Network Error [${path}]:`, {
        message: e.message,
        url: `${API_DOMAIN}${path}`,
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

// Profile functions
export const getUserProfile = async () => {
  try {
    return await getAccess('auth/profile');
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

export const updateProfile = async (data: { name?: string; phone?: string; bio?: string }) => {
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
    
    const res = await axios.post(API_DOMAIN + 'users/profile/avatar', formData, {
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

export const changePassword = async (data: { oldPassword: string; newPassword: string }) => {
  try {
    return await patchAccess('users/profile/password', data);
  } catch (error) {
    console.error('Error changing password:', error);
    throw error;
  }
};