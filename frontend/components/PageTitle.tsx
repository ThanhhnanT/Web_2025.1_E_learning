"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// Mapping các route với title tương ứng
const getPageTitle = (pathname: string, titleParam?: string | null): string => {
  const baseTitle = "LearniFy";
  
  // Lấy title từ query params nếu có (cho các trang động)
  if (titleParam) {
    return `${decodeURIComponent(titleParam)} - ${baseTitle}`;
  }

  // Mapping các route cố định
  const titleMap: Record<string, string> = {
    "/": "Trang chủ",
    "/about": "Giới thiệu",
    "/courses/online": "Khóa học trực tuyến",
    "/tests": "Đề thi online",
    "/flashcards": "Flashcards",
    "/posts": "Blog",
    "/friends": "Bạn bè",
    "/chats": "Tin nhắn",
    "/auth/profile": "Hồ sơ",
    "/statistics": "Thống kê",
  };

  // Kiểm tra route chính xác
  if (titleMap[pathname]) {
    return `${titleMap[pathname]} - ${baseTitle}`;
  }

  // Kiểm tra route động với pattern matching
  if (pathname.startsWith("/courses/") && pathname !== "/courses/online") {
    return `Chi tiết khóa học - ${baseTitle}`;
  }
  
  if (pathname.startsWith("/tests/") && pathname.includes("/sections/")) {
    return `Làm bài thi - ${baseTitle}`;
  }
  
  if (pathname.startsWith("/tests/") && pathname.includes("/results/")) {
    return `Kết quả thi - ${baseTitle}`;
  }
  
  if (pathname.startsWith("/tests/")) {
    return `Chi tiết đề thi - ${baseTitle}`;
  }
  
  if (pathname.startsWith("/flashcards/lists/")) {
    return `Danh sách từ vựng - ${baseTitle}`;
  }
  
  if (pathname.startsWith("/flashcards/discover/")) {
    return `Khám phá flashcards - ${baseTitle}`;
  }
  
  if (pathname.startsWith("/admin/dashboard")) {
    return `Bảng điều khiển - ${baseTitle}`;
  }
  
  if (pathname.startsWith("/admin/users")) {
    return `Quản lý người dùng - ${baseTitle}`;
  }
  
  if (pathname.startsWith("/admin/roles")) {
    return `Quản lý vai trò - ${baseTitle}`;
  }
  
  if (pathname.startsWith("/admin/tests")) {
    return `Quản lý đề thi - ${baseTitle}`;
  }
  
  if (pathname.startsWith("/admin/posts")) {
    return `Quản lý bài viết - ${baseTitle}`;
  }
  
  if (pathname.startsWith("/admin/flashcards")) {
    return `Quản lý flashcards - ${baseTitle}`;
  }
  
  if (pathname.startsWith("/admin")) {
    return `Quản trị - ${baseTitle}`;
  }

  // Mặc định
  return baseTitle;
};

export default function PageTitle() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    try {
      const titleParam = searchParams?.get("title");
      const title = getPageTitle(pathname || "", titleParam);
      document.title = title;
    } catch (error) {
      // Fallback nếu có lỗi với searchParams
      const title = getPageTitle(pathname || "", null);
      document.title = title;
    }
  }, [pathname, searchParams]);

  return null; // Component này không render gì
}

