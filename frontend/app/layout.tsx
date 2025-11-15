import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
//import "./globals.css";
import AntLayout from "../components/AntLayout";
import Loading from "./loading";


export const metadata: Metadata = {
  title: "LearniFy",
  description: "Study with me",
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
       <AntLayout>
         <Suspense fallback={<Loading />}>
           {children}
         </Suspense>
       </AntLayout>
      </body>
    </html>
  );
}
