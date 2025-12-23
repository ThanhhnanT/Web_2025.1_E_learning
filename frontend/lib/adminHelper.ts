import Cookies from "js-cookie";
import { getUserProfile } from "@/helper/api";

export function checkAdminAuth(): boolean {
  const token = Cookies.get("access_token");
  return !!token;
}

export async function getAdminRole(): Promise<string | null> {
  try {
    const userProfile = await getUserProfile();
    return userProfile?.role || null;
  } catch (error) {
    console.error("Error fetching admin role:", error);
    return null;
  }
}

export async function isAdmin(): Promise<boolean> {
  const role = await getAdminRole();
  return role === "administrator" || role === "editor" || role === "support";
}

export function redirectToAdminLogin(): void {
  if (typeof window !== "undefined") {
    window.location.href = "/admin/login";
  }
}

