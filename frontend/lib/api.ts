const BASE_URL = 'https://api.example.com';

import Cookies from "js-cookie";

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
        localStorage.setItem("access_token", result.access_token);
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