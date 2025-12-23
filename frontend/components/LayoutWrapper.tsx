"use client";

import { usePathname } from "next/navigation";
import AntLayout from "./AntLayout";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Don't wrap admin routes with AntLayout
  if (pathname?.startsWith("/admin")) {
    return <>{children}</>;
  }

  // Wrap all other routes with AntLayout
  return <AntLayout>{children}</AntLayout>;
}

