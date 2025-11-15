"use client";

import React from "react";
import styles from "@/styles/antLayout.module.css";
import skeletonStyles from "@/styles/skeleton.module.css";

export default function Loading() {
  return (
    <div className={styles.container}>
      <div className={`${skeletonStyles.skeleton} ${skeletonStyles.contentSkeleton} ${skeletonStyles.contentSkeletonMedium}`} />
      <div className={`${skeletonStyles.skeleton} ${skeletonStyles.contentSkeleton} ${skeletonStyles.contentSkeletonLarge}`} />
    </div>
  );
}

