"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import styles from "@/styles/routeTransition.module.css";

export const RouteTransitionProvider = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Reset progress when route changes
    setIsLoading(true);
    setProgress(0);

    // Simulate progress animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        // Accelerate progress
        const increment = prev < 50 ? 10 : 5;
        return Math.min(prev + increment, 90);
      });
    }, 50);

    // Complete progress when route change is done
    const completeTimer = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 200);
    }, 300);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(completeTimer);
    };
  }, [pathname]);

  return (
    <>
      {isLoading && (
        <div className={styles.progressBarContainer}>
          <div 
            className={styles.progressBar} 
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      {children}
    </>
  );
};

