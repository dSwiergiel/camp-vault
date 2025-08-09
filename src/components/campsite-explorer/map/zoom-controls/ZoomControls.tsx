"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { LocateFixed, Minus, Plus } from "lucide-react";
import { useMap } from "react-leaflet";
import { useUserCoordinates } from "@/lib/hooks/useUserCoordinates";
import { DEFAULT_ZOOM, DEFAULT_CENTER } from "@/lib/constants";
import { useSearchParams } from "next/navigation";

export default function ZoomControls() {
  const map = useMap();
  const hasInitiallyCentered = React.useRef(false);
  const searchParams = useSearchParams();
  const {
    latitude: userLatitude,
    longitude: userLongitude,
    requestLocation,
    permissionDenied,
  } = useUserCoordinates();

  useEffect(() => {
    // request location once when component mounts
    requestLocation();
  }, [requestLocation]);

  useEffect(() => {
    // if url already defines a center, don't override it
    const urlLat = searchParams?.get("lat");
    const urlLng = searchParams?.get("lng");
    const urlZ = searchParams?.get("z") ?? searchParams?.get("zoom");
    const hasUrlView = !!(urlLat && urlLng && urlZ);
    if (hasUrlView) {
      hasInitiallyCentered.current = true;
      return;
    }

    if (!hasInitiallyCentered.current) {
      if (userLatitude && userLongitude) {
        // user approved location - center on their position
        map.setView([userLatitude, userLongitude], DEFAULT_ZOOM, {
          animate: true,
          duration: 1,
        });
        hasInitiallyCentered.current = true;
      } else if (permissionDenied) {
        // user denied location - center on default coordinates
        map.setView(DEFAULT_CENTER, DEFAULT_ZOOM, {
          animate: true,
          duration: 1,
        });
        hasInitiallyCentered.current = true;
      }
    }
  }, [userLatitude, userLongitude, permissionDenied, map, searchParams]);

  const handleZoomIn = () => {
    map.zoomIn();
  };

  const handleZoomOut = () => {
    map.zoomOut();
  };

  const handleLocate = () => {
    requestLocation();
    if (userLatitude && userLongitude) {
      map.setView([userLatitude, userLongitude], DEFAULT_ZOOM, {
        animate: true,
        duration: 1,
      });
    }
  };

  return (
    <div className="leaflet-bottom leaflet-right">
      <div className="leaflet-control flex flex-col">
        <Button
          className="border-b rounded-none rounded-t-sm"
          onClick={handleZoomIn}
          variant="outline"
          size="icon"
          title="Zoom in"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          className={`border-b rounded-none ${
            !(userLatitude && userLongitude) ? "rounded-b-sm" : ""
          }`}
          onClick={handleZoomOut}
          variant="outline"
          size="icon"
          title="Zoom out"
        >
          <Minus className="h-4 w-4" />
        </Button>
        {userLatitude && userLongitude && (
          <Button
            className="rounded-none rounded-b-sm"
            onClick={handleLocate}
            variant="outline"
            size="icon"
            title="Go to my location"
          >
            <LocateFixed className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
