import Cookies from "js-cookie";
import axios from "axios";

// Get base URL from environment variable or use default (same as helper/api.tsx)
const getBaseUrl = () => {
  const url = process.env.API || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888';
  return url.replace(/\/+$/, ''); // Remove trailing slashes
};

// Check if we need to use proxy (HTTPS frontend calling HTTP backend)
const shouldUseProxy = () => {
  if (typeof window === 'undefined') return false; // SSR, use direct URL
  const isHttps = window.location.protocol === 'https:';
  const backendUrl = getBaseUrl();
  const isHttpBackend = backendUrl.startsWith('http://');
  return isHttps && isHttpBackend;
};

const BASE_URL = shouldUseProxy() ? '/api/proxy' : getBaseUrl();

// Create axios instance with base configuration
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send cookies with requests
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      Cookies.remove('access_token');
      
      // Only redirect to login if not on public pages
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        const publicPaths = ['/login', '/register', '/courses', '/'];
        const isPublicPage = publicPaths.some(path => 
          currentPath === path || currentPath.startsWith('/courses/')
        );
        
        // Don't redirect if on public page or already on login page
        // TODO: Create proper /login page for users
        if (!isPublicPage && !currentPath.includes('/login')) {
          console.log('401 Unauthorized - User needs to login');
          console.log('Redirect to login disabled - login page not implemented yet');
          // window.location.href = '/login?redirect=' + encodeURIComponent(currentPath);
        } else {
          console.log('401 Unauthorized on public page - Not redirecting');
        }
      }
    }
    return Promise.reject(error);
  }
);

// Export axios instance as default
export default api;

// Keep existing functions for backward compatibility
export async function registerUser(data: {
    fullName: string;
    email: string;
    password: string;
    role: "student" | "teacher";
}) {
    const res = await fetch(`${BASE_URL}/register`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    return await res.json();
}

export async function loginUser(data: {
    email: string;
    password: string;
}){ 
  try{
    const res = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    const result = await res.json();
    if (res.ok &&result.access_token){
        // Token is set in cookie by backend, no need to store in localStorage
        return {success: true};
    }else{
        return {error: true, message: result.message || 'Đăng nhập thất bại'};
    }
  }catch(error){
    console.error("API login error:", error);
    return {error: true, message: 'Lỗi mạng hoặc máy chủ'};
  }
}
export function logoutUser() {
    Cookies.remove("access_token");
}