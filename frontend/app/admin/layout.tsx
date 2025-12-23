"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";
import { checkAdminAuth, isAdmin, redirectToAdminLogin } from "@/lib/adminHelper";

export default function AdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // Don't protect the login page
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  // For other admin routes, use AdminLayout which handles protection
  return <AdminLayout>{children}</AdminLayout>;
}

