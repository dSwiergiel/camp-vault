"use client";

import React, { useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { useUserCoordinates } from "@/lib/hooks/useUserCoordinates";
import { DEFAULT_CENTER, DEFAULT_ZOOM } from "@/lib/constants";
import { useSearchParams } from "next/navigation";
import campsitesData from "@/campsite-data/NYS_campsite_data.json";
import { Campsite } from "@/lib/models/campsite.model";

// dynamically import all components
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

interface CampsiteMapIsolatedProps {
  onLoadingChange?: (isLoading: boolean) => void;
}

// helper functions for icon HTML
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

export default function CampsiteMapIsolated({
  onLoadingChange,
}: CampsiteMapIsolatedProps) {
  // use refs instead of state to avoid React state initialization issues
  const initializationState = useRef({
    isHydrated: false,
    leafletReady: false,
    iconsReady: false,
    mounted: true,
  });

  const leafletState = useRef<{
    DivIconClass: typeof import("leaflet").DivIcon | null;
    basicIcon: import("leaflet").DivIcon | null;
    userIcon: import("leaflet").DivIcon | null;
    defaultClusterIcon: import("leaflet").DivIcon | null;
  }>({
    DivIconClass: null,
    basicIcon: null,
    userIcon: null,
    defaultClusterIcon: null,
  });

  const mapState = useRef<{
    mapInstance: import("leaflet").Map | null;
    campsites: Campsite[];
  }>({
    mapInstance: null,
    campsites: [],
  });
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);

  // safe force update
  const triggerUpdate = useCallback(() => {
    if (initializationState.current.mounted) {
      forceUpdate();
    }
  }, []);

  // hydration effect
  useEffect(() => {
    initializationState.current.isHydrated = true;
    triggerUpdate();
  }, [triggerUpdate]);

  // leaflet loading effect
  useEffect(() => {
    if (!initializationState.current.isHydrated) return;

    let mounted = true;

    const loadLeaflet = async () => {
      try {
        const { DivIcon } = await import("leaflet");

        if (!mounted || !initializationState.current.mounted) return;

        leafletState.current.DivIconClass = DivIcon;
        initializationState.current.leafletReady = true;

        // create icons
        try {
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

          const clusterIcon = new DivIcon({
            html: createClusterMarkerHTML(0),
            className: "cluster-marker",
            iconSize: [32, 32] as [number, number],
            iconAnchor: [16, 16] as [number, number],
          });

          leafletState.current.basicIcon = basicIcon;
          leafletState.current.userIcon = userIcon;
          leafletState.current.defaultClusterIcon = clusterIcon;
          initializationState.current.iconsReady = true;

          // load campsite data
          mapState.current.campsites = campsitesData as Campsite[];

          triggerUpdate();
        } catch (iconError) {
          console.error("Error creating icons:", iconError);
        }
      } catch (leafletError) {
        console.error("Error loading Leaflet:", leafletError);
      }
    };

    loadLeaflet();

    return () => {
      mounted = false;
    };
  }, [triggerUpdate]);

  // cleanup effect
  useEffect(() => {
    const currentState = initializationState.current;
    return () => {
      currentState.mounted = false;
    };
  }, []);

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

  // request location effect
  useEffect(() => {
    if (
      initializationState.current.isHydrated &&
      initializationState.current.leafletReady
    ) {
      requestLocation();
    }
  }, [requestLocation]);

  // loading state
  const isLoading =
    !initializationState.current.isHydrated ||
    !initializationState.current.leafletReady ||
    !initializationState.current.iconsReady ||
    locationLoading;

  // loading change callback
  useEffect(() => {
    onLoadingChange?.(isLoading);
  }, [isLoading, onLoadingChange]);

  // create cluster icon function (for future clustering implementation)
  const createClusterIcon = useCallback((count: number) => {
    if (
      !initializationState.current.leafletReady ||
      !leafletState.current.DivIconClass
    ) {
      return leafletState.current.defaultClusterIcon;
    }

    try {
      return new leafletState.current.DivIconClass({
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
      return leafletState.current.defaultClusterIcon;
    }
  }, []);

  // Use the function to prevent unused warning (will be used when clustering is implemented)
  void createClusterIcon;

  // simple clustering logic (inline to avoid hook complications)
  const getClustersAndMarkers = useCallback(() => {
    if (
      !initializationState.current.iconsReady ||
      !mapState.current.campsites.length
    ) {
      return { clusters: [], singleMarkers: [] };
    }

    // simple implementation - just return first 100 as single markers for now
    return {
      clusters: [],
      singleMarkers: mapState.current.campsites.slice(0, 100),
    };
  }, []);

  const { singleMarkers } = getClustersAndMarkers();

  // debug logging
  console.log("CampsiteMapIsolated render state:", {
    isHydrated: initializationState.current.isHydrated,
    leafletReady: initializationState.current.leafletReady,
    iconsReady: initializationState.current.iconsReady,
    hasBasicIcon: !!leafletState.current.basicIcon,
    hasUserIcon: !!leafletState.current.userIcon,
    campsitesCount: mapState.current.campsites.length,
  });

  // don't render until everything is ready
  if (
    !initializationState.current.isHydrated ||
    !initializationState.current.leafletReady ||
    !initializationState.current.iconsReady
  ) {
    return (
      <div className="container mx-auto h-[calc(100vh-4rem)]">
        <div className="w-full h-[calc(100vh-11rem)] bg-primary/10 rounded-sm flex items-center justify-center">
          <div className="text-muted-foreground">
            Loading map...
            {!initializationState.current.isHydrated && " (hydrating)"}
            {!initializationState.current.leafletReady && " (loading leaflet)"}
            {!initializationState.current.iconsReady && " (creating icons)"}
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
        <MapUrlSync />
        <AttributionControl
          position="bottomleft"
          prefix='<a href="/explore/map-providers">Map Data Providers</a>'
        />
        <ZoomControls />
        <LayerControls />

        {/* user location marker */}
        {latitude && longitude && leafletState.current.userIcon && (
          <Marker
            position={[latitude, longitude]}
            icon={leafletState.current.userIcon}
            title="Your location"
          >
            <Popup>You are here</Popup>
          </Marker>
        )}

        {/* individual campsite markers */}
        {singleMarkers.map((campsite, index) => {
          if (!leafletState.current.basicIcon) return null;

          return (
            <Marker
              key={`single-${index}`}
              icon={leafletState.current.basicIcon}
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
