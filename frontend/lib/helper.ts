export function checkAuth(){
  const token = localStorage.getItem("access_token");
  return !!token;
}