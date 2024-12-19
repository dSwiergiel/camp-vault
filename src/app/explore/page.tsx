"use client";

import { useState } from "react";
import CampsiteMap from "@/components/campsite-explorer/map/CampsiteMap";
import CampsiteList from "@/components/campsite-explorer/list/CampsiteList";
import { Skeleton } from "@/components/ui/skeleton";

export default function Explore() {
  const [isMapLoading, setIsMapLoading] = useState(true);

  return (
    <div className="p-4">
      {isMapLoading && (
        <div className="container mx-auto ">
          <Skeleton className="h-[calc(100vh-10rem)] w-full rounded-sm bg-muted" />
        </div>
      )}
      <div className={isMapLoading ? "invisible" : "visible"}>
        <CampsiteMap onLoadingChange={setIsMapLoading} />
      </div>
      <CampsiteList />
    </div>
  );
}
