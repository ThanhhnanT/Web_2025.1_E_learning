import Cookies from "js-cookie";

export function checkAuth() {
  // Ưu tiên token trong localStorage (legacy) hoặc Cookies (hiện tại)
  const localToken = typeof window !== "undefined"
    ? localStorage.getItem("access_token")
    : null;
  const cookieToken = Cookies.get("access_token");

  return !!(localToken || cookieToken);
}
