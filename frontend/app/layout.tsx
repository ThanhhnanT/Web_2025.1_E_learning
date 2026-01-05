import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
//import "./globals.css";
import LayoutWrapper from "../components/LayoutWrapper";
import Loading from "./loading";


export const metadata: Metadata = {
  title: {
    default: "LearniFy - Nền tảng học tập trực tuyến",
    template: "%s - LearniFy",
  },
  description: "Nền tảng học tập trực tuyến với các khóa học IELTS, TOEIC, HSK chất lượng cao",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        suppressHydrationWarning
      >
       <LayoutWrapper>
         <Suspense fallback={<Loading />}>
           {children}
         </Suspense>
       </LayoutWrapper>
      </body>
    </html>
  );
}
