"use client";

import { useState, Suspense } from "react";
import CampsiteMapWrapper from "@/components/campsite-explorer/map/CampsiteMapWrapper";
import CampsiteList from "@/components/campsite-explorer/list/CampsiteList";
import { Skeleton } from "@/components/ui/skeleton";

export default function Explore() {
  const [isMapLoading, setIsMapLoading] = useState(true);

  return (
    <div className="p-4">
      {isMapLoading && (
        <div className="container mx-auto ">
          <Skeleton className="h-[calc(100vh-11rem)] w-full rounded-sm bg-muted" />
        </div>
      )}
      <div className={isMapLoading ? "invisible" : "visible"}>
        <Suspense
          fallback={
            <Skeleton className="h-[calc(100vh-11rem)] w-full rounded-sm bg-muted" />
          }
        >
          <CampsiteMapWrapper onLoadingChange={setIsMapLoading} />
        </Suspense>
      </div>
      <CampsiteList />
    </div>
  );
}
