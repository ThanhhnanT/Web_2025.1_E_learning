import Cookies from "js-cookie";

export function getUserId(): string | null {
  const directId = Cookies.get("user_id");
  if (directId) return directId;

  const token = Cookies.get("access_token");
  if (!token) return null;

  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    const payload = JSON.parse(jsonPayload);
    return payload.sud; 
  } catch (e) {
    console.error("Invalid token", e);
    return null;
  }
}

export const getDeckStorageKey = (userId: string) => `flashcard_decks_${userId}`;

export const getProgressKey = (title: string, userId: string) =>
  `flashcard_progress_${userId}_${title.replace(/\s+/g, "_").toLowerCase()}`;