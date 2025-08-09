"use client";

import React from "react";

interface ClusterMarkerProps {
  count: number;
  size?: "small" | "medium" | "large";
}

/**
 * displays a cluster marker with campsite count
 * size is determined by number of campsites in cluster
 */
export default function ClusterMarker({ count, size }: ClusterMarkerProps) {
  // determine size based on count if not provided
  const markerSize = size || getMarkerSize(count);

  // get styling based on size
  const styles = getMarkerStyles(markerSize, count);

  return (
    <div className={styles.container}>
      <div className={styles.inner}>
        <span className={styles.text}>{count}</span>
      </div>
    </div>
  );
}

/**
 * determines marker size based on campsite count
 */
function getMarkerSize(count: number): "small" | "medium" | "large" {
  if (count >= 50) return "large";
  if (count >= 10) return "medium";
  return "small";
}

/**
 * returns tailwind classes for different marker sizes and counts
 */
function getMarkerStyles(size: "small" | "medium" | "large", count: number) {
  const baseClasses =
    "rounded-full border-2 border-white shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 cursor-pointer";

  // color based on count for better visual distinction
  let colorClasses = "";
  if (count >= 100) {
    colorClasses = "bg-red-500 text-white";
  } else if (count >= 50) {
    colorClasses = "bg-orange-500 text-white";
  } else if (count >= 20) {
    colorClasses = "bg-yellow-500 text-white";
  } else if (count >= 10) {
    colorClasses = "bg-blue-500 text-white";
  } else {
    colorClasses = "bg-green-500 text-white";
  }

  switch (size) {
    case "large":
      return {
        container: "relative",
        inner: `${baseClasses} ${colorClasses} w-12 h-12`,
        text: "text-sm font-bold",
      };
    case "medium":
      return {
        container: "relative",
        inner: `${baseClasses} ${colorClasses} w-10 h-10`,
        text: "text-xs font-semibold",
      };
    case "small":
    default:
      return {
        container: "relative",
        inner: `${baseClasses} ${colorClasses} w-8 h-8`,
        text: "text-xs font-medium",
      };
  }
}
