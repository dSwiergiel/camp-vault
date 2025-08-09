"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

// import CampsiteMapSimple with no SSR to prevent hydration issues
const CampsiteMapSimple = dynamic(() => import("./CampsiteMapSimple"), {
  ssr: false,
  loading: () => (
    <div className="container mx-auto h-[calc(100vh-4rem)]">
      <Skeleton className="h-[calc(100vh-11rem)] w-full rounded-sm bg-muted" />
    </div>
  ),
});

interface CampsiteMapWrapperProps {
  onLoadingChange?: (isLoading: boolean) => void;
}

export default function CampsiteMapWrapper({
  onLoadingChange,
}: CampsiteMapWrapperProps) {
  return <CampsiteMapSimple onLoadingChange={onLoadingChange} />;
}
