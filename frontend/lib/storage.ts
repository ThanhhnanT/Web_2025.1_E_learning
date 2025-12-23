import { Post } from '@/types/blog';

const STORAGE_KEY = 'blog_platform_posts_data';

export const loadPostsFromStorage = (): Post[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const savePostsToStorage = (posts: Post[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  } catch (error) {
    console.error("Storage full or error", error);
    alert("Không thể lưu bài viết (có thể do ảnh quá lớn so với LocalStorage)");
  }
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};