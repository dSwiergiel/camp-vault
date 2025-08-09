"use client";

import React, { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import type { DivIcon } from "leaflet";
import "leaflet/dist/leaflet.css";
import { useUserCoordinates } from "@/lib/hooks/useUserCoordinates";
import { useClustering } from "@/lib/hooks/useClustering";
import { DEFAULT_CENTER, DEFAULT_ZOOM } from "@/lib/constants";
import { useSearchParams } from "next/navigation";
import campsitesData from "@/campsite-data/NYS_campsite_data.json";
import { Campsite } from "@/lib/models/campsite.model";

// dynamically import components
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
  ssr: false,
});
const AttributionControl = dynamic(
  () => import("react-leaflet").then((mod) => mod.AttributionControl),
  { ssr: false }
);
const LayerControls = dynamic(() => import("./layer-controls/LayerControls"), {
  ssr: false,
});
const ZoomControls = dynamic(() => import("./zoom-controls/ZoomControls"), {
  ssr: false,
});
const MapUrlSync = dynamic(() => import("./MapUrlSync"), {
  ssr: false,
});
import { useMap } from "react-leaflet";

interface CampsiteMapSimpleProps {
  onLoadingChange?: (isLoading: boolean) => void;
}

// safe icon HTML functions
function createBasicCampsiteMarkerHTML(): string {
  return `
    <div class="relative">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#059669" stroke="#fff" stroke-width="2"/>
        <circle cx="12" cy="9" r="2.5" fill="#fff"/>
      </svg>
    </div>
  `;
}

function createUserLocationMarkerHTML(): string {
  return `
    <div class="relative">
      <div class="absolute w-6 h-6 bg-red-500 rounded-full animate-ping opacity-75"></div>
      <div class="absolute w-4 h-4 bg-red-500 rounded-full border-2 border-white" style="left: 4px; top: 4px;"></div>
    </div>
  `;
}

function createClusterMarkerHTML(count: number): string {
  let colorClass = "bg-green-500";
  if (count >= 100) colorClass = "bg-red-500";
  else if (count >= 50) colorClass = "bg-orange-500";
  else if (count >= 20) colorClass = "bg-yellow-500";
  else if (count >= 10) colorClass = "bg-blue-500";

  const size =
    count >= 50 ? "w-12 h-12" : count >= 10 ? "w-10 h-10" : "w-8 h-8";
  const textSize = count >= 50 ? "text-sm" : "text-xs";

  return `
    <div class="relative">
      <div class="rounded-full border-2 border-white shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 cursor-pointer ${colorClass} ${size} text-white">
        <span class="${textSize} font-bold">${count}</span>
      </div>
    </div>
  `;
}

export default function CampsiteMapSimple({
  onLoadingChange,
}: CampsiteMapSimpleProps) {
  // simple boolean states - start as false to avoid initialization issues
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);

  // refs for icons to avoid state issues
  const basicIconRef = useRef<DivIcon | null>(null);
  const userIconRef = useRef<DivIcon | null>(null);
  const campsitesRef = useRef<Campsite[]>([]);
  const divIconClassRef = useRef<typeof DivIcon | null>(null);
  const mapInstanceRef = useRef<import("leaflet").Map | null>(null);

  // user coordinates
  const {
    latitude,
    longitude,
    isLoading: locationLoading,
    requestLocation,
  } = useUserCoordinates();
  const searchParams = useSearchParams();

  // url params
  const urlLat = searchParams?.get("lat");
  const urlLng = searchParams?.get("lng");
  const urlZ = searchParams?.get("z") ?? searchParams?.get("zoom");
  const parsedLat = urlLat ? Number(urlLat) : undefined;
  const parsedLng = urlLng ? Number(urlLng) : undefined;
  const parsedZoom = urlZ ? Number(urlZ) : undefined;

  // map instance bridge
  function MapInstanceBridge({
    onReady,
  }: {
    onReady: (map: import("leaflet").Map) => void;
  }) {
    const map = useMap();
    useEffect(() => {
      onReady(map);
      mapInstanceRef.current = map;
    }, [map, onReady]);
    return null;
  }

  // clustering logic
  const {
    clusters,
    singleMarkers,
    isLoading: clusteringLoading,
    handleClusterClick,
  } = useClustering({
    campsites: ready ? campsitesRef.current : [],
    map: mapInstanceRef.current,
  });

  // mount effect
  useEffect(() => {
    setMounted(true);
  }, []);

  // leaflet loading effect
  useEffect(() => {
    if (!mounted) return;

    let isMounted = true;

    const loadLeaflet = async () => {
      try {
        console.log("Starting Leaflet load...");

        // import leaflet
        const leafletModule = await import("leaflet");
        const { DivIcon } = leafletModule;

        if (!isMounted) {
          console.log("Component unmounted, aborting...");
          return;
        }

        console.log("Leaflet loaded, creating icons...");

        // store DivIcon class for cluster creation
        divIconClassRef.current = DivIcon;

        // create icons
        const basicIcon = new DivIcon({
          html: createBasicCampsiteMarkerHTML(),
          className: "campsite-marker",
          iconSize: [28, 28] as [number, number],
          iconAnchor: [14, 28] as [number, number],
        });

        const userIcon = new DivIcon({
          html: createUserLocationMarkerHTML(),
          className: "user-location-marker",
          iconSize: [24, 24] as [number, number],
          iconAnchor: [12, 12] as [number, number],
        });

        console.log("Icons created, storing in refs...");

        // store in refs
        basicIconRef.current = basicIcon;
        userIconRef.current = userIcon;
        campsitesRef.current = campsitesData as Campsite[];

        console.log("Setting ready to true...");
        setReady(true);
      } catch (error) {
        console.error("Error loading Leaflet:", error);
      }
    };

    loadLeaflet();

    return () => {
      isMounted = false;
    };
  }, [mounted]);

  // request location when ready
  useEffect(() => {
    if (ready) {
      requestLocation();
    }
  }, [ready, requestLocation]);

  // cluster icon creation function
  const createClusterIcon = (count: number): DivIcon | null => {
    if (!ready || !divIconClassRef.current) {
      return null;
    }

    try {
      return new divIconClassRef.current({
        html: createClusterMarkerHTML(count),
        className: "cluster-marker",
        iconSize: (count >= 50
          ? [48, 48]
          : count >= 10
          ? [40, 40]
          : [32, 32]) as [number, number],
        iconAnchor: (count >= 50
          ? [24, 24]
          : count >= 10
          ? [20, 20]
          : [16, 16]) as [number, number],
      });
    } catch (error) {
      console.error("Error creating cluster icon:", error);
      return null;
    }
  };

  // loading state
  const isLoading = !mounted || !ready || locationLoading || clusteringLoading;

  // loading callback
  useEffect(() => {
    onLoadingChange?.(isLoading);
  }, [isLoading, onLoadingChange]);

  console.log("CampsiteMapSimple render:", {
    mounted,
    ready,
    isLoading,
    campsitesCount: campsitesRef.current.length,
  });

  // show loading until ready
  if (!mounted || !ready) {
    return (
      <div className="container mx-auto h-[calc(100vh-4rem)]">
        <div className="w-full h-[calc(100vh-11rem)] bg-primary/10 rounded-sm flex items-center justify-center">
          <div className="text-muted-foreground">
            Loading map...
            {!mounted && " (mounting)"}
            {mounted && !ready && " (loading leaflet)"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto h-[calc(100vh-4rem)]">
      <MapContainer
        center={
          parsedLat != null &&
          !Number.isNaN(parsedLat) &&
          parsedLng != null &&
          !Number.isNaN(parsedLng)
            ? [parsedLat, parsedLng]
            : latitude && longitude
            ? [latitude, longitude]
            : DEFAULT_CENTER
        }
        zoom={
          parsedZoom != null && !Number.isNaN(parsedZoom)
            ? Math.max(0, Math.min(22, Math.round(parsedZoom)))
            : DEFAULT_ZOOM
        }
        className="w-full h-[calc(100vh-11rem)] z-0 rounded-sm [&.leaflet-container]:!bg-primary/10"
        zoomControl={false}
        attributionControl={false}
      >
        <MapInstanceBridge
          onReady={(map) => {
            mapInstanceRef.current = map;
          }}
        />
        <MapUrlSync />
        <AttributionControl
          position="bottomleft"
          prefix='<a href="/explore/map-providers">Map Data Providers</a>'
        />
        <ZoomControls />
        <LayerControls />

        {/* user location marker */}
        {latitude && longitude && userIconRef.current && (
          <Marker
            position={[latitude, longitude]}
            icon={userIconRef.current}
            title="Your location"
          >
            <Popup>You are here</Popup>
          </Marker>
        )}

        {/* cluster markers */}
        {clusters.map((cluster, index) => {
          const clusterIcon = createClusterIcon(cluster.count);
          if (!clusterIcon) return null;

          return (
            <Marker
              key={`cluster-${index}`}
              icon={clusterIcon}
              position={[cluster.lat, cluster.lng]}
              eventHandlers={{
                click: () => handleClusterClick(cluster),
              }}
            >
              <Popup>
                <div className="space-y-2">
                  <strong className="text-lg">{cluster.count} Campsites</strong>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {cluster.campsites
                      .slice(0, 10)
                      .map((campsite, campsiteIndex) => (
                        <div
                          key={campsiteIndex}
                          className="text-sm border-b border-gray-200 pb-1"
                        >
                          <div className="font-medium">
                            {campsite.site_name}
                          </div>
                          <div className="text-gray-600">
                            {campsite.location_name}
                          </div>
                        </div>
                      ))}
                    {cluster.count > 10 && (
                      <div className="text-sm text-gray-500 italic">
                        And {cluster.count - 10} more campsites...
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Click cluster to zoom in
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* individual campsite markers */}
        {singleMarkers.map((campsite, index) => {
          if (!basicIconRef.current) return null;

          return (
            <Marker
              key={`single-${index}`}
              icon={basicIconRef.current}
              position={[
                campsite.coordinates.latitude,
                campsite.coordinates.longitude,
              ]}
            >
              <Popup>
                <strong>{campsite.site_name}</strong>
                <br />
                Type: {campsite.type}
                <br />
                Location: {campsite.location_name}
                <br />
                Coordinates:{" "}
                <a
                  href={`https://www.google.com/maps?q=${campsite.coordinates.latitude},${campsite.coordinates.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {campsite.coordinates.latitude.toFixed(4)},{" "}
                  {campsite.coordinates.longitude.toFixed(4)}
                </a>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
