import Cookies from "js-cookie";

export function checkAuth() {
  const token = Cookies.get("access_token");
  return !!token;
}
