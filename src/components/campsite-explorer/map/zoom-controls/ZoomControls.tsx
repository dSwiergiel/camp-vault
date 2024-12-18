"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { LocateFixed, Minus, Plus } from "lucide-react";
import { useMap } from "react-leaflet";
import { useUserCoordinates } from "@/lib/hooks/useUserCoordinates";
import { DEFAULT_ZOOM } from "@/lib/constants";

export default function ZoomControls() {
  const map = useMap();
  const { latitude: userLatitude, longitude: userLongitude } =
    useUserCoordinates();

  // automatically center map on user's location when coordinates become available
  useEffect(() => {
    if (userLatitude && userLongitude) {
      map.setView([userLatitude, userLongitude], DEFAULT_ZOOM);
    }
  }, [userLatitude, userLongitude, map]);

  const handleZoomIn = () => {
    map.zoomIn();
  };

  const handleZoomOut = () => {
    map.zoomOut();
  };

  const handleLocate = () => {
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
