"use client";

import React, { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import type { DivIcon, Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import { useUserCoordinates } from "@/lib/hooks/useUserCoordinates";
import { useClustering } from "@/lib/hooks/useClustering";
import { DEFAULT_CENTER, DEFAULT_ZOOM } from "@/lib/constants";
import { useSearchParams } from "next/navigation";
import campsitesData from "@/campsite-data/NYS_campsite_data.json";
import { Campsite } from "@/lib/models/campsite.model";

// dynamically import all components since leaflet needs to be loaded in the browser
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

interface CampsiteMapClientProps {
  onLoadingChange?: (isLoading: boolean) => void;
}

// helper functions to create icon HTML safely
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

export default function CampsiteMapClient({
  onLoadingChange,
}: CampsiteMapClientProps) {
  // wait for hydration
  const [isHydrated, setIsHydrated] = useState(false);
  const [leafletReady, setLeafletReady] = useState(false);
  const [iconsReady, setIconsReady] = useState(false);

  // leaflet state
  const [DivIconClass, setDivIconClass] = useState<typeof DivIcon | null>(null);
  const [basicIcon, setBasicIcon] = useState<DivIcon | null>(null);
  const [userIcon, setUserIcon] = useState<DivIcon | null>(null);
  const [defaultClusterIcon, setDefaultClusterIcon] = useState<DivIcon | null>(
    null
  );

  // map state
  const [mapInstance, setMapInstance] = useState<LeafletMap | null>(null);
  const [campsites, setCampsites] = useState<Campsite[]>([]);
  const mapRef = useRef<LeafletMap | null>(null);

  // hydration check
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // leaflet loading
  useEffect(() => {
    if (!isHydrated) return;

    let mounted = true;

    import("leaflet")
      .then(({ DivIcon }) => {
        if (!mounted) return;

        setDivIconClass(DivIcon);
        setLeafletReady(true);

        // create icons
        try {
          const basicIconInstance = new DivIcon({
            html: createBasicCampsiteMarkerHTML(),
            className: "campsite-marker",
            iconSize: [28, 28] as [number, number],
            iconAnchor: [14, 28] as [number, number],
          });

          const userIconInstance = new DivIcon({
            html: createUserLocationMarkerHTML(),
            className: "user-location-marker",
            iconSize: [24, 24] as [number, number],
            iconAnchor: [12, 12] as [number, number],
          });

          const clusterIconInstance = new DivIcon({
            html: createClusterMarkerHTML(0),
            className: "cluster-marker",
            iconSize: [32, 32] as [number, number],
            iconAnchor: [16, 16] as [number, number],
          });

          setBasicIcon(basicIconInstance);
          setUserIcon(userIconInstance);
          setDefaultClusterIcon(clusterIconInstance);
          setIconsReady(true);

          // load campsite data
          setCampsites(campsitesData as Campsite[]);
        } catch (error) {
          console.error("Error creating icons:", error);
        }
      })
      .catch((error) => {
        console.error("Error loading Leaflet:", error);
      });

    return () => {
      mounted = false;
    };
  }, [isHydrated]);

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

  // clustering
  const {
    clusters,
    singleMarkers,
    isLoading: clusteringLoading,
    handleClusterClick,
  } = useClustering({
    campsites: iconsReady ? campsites : [],
    map: mapInstance,
  });

  // map instance bridge
  function MapInstanceBridge({
    onReady,
  }: {
    onReady: (map: LeafletMap) => void;
  }) {
    const map = useMap();
    useEffect(() => {
      onReady(map);
      mapRef.current = map;
    }, [map, onReady]);
    return null;
  }

  // request location
  useEffect(() => {
    if (isHydrated && leafletReady) {
      requestLocation();
    }
  }, [isHydrated, leafletReady, requestLocation]);

  // loading state
  const isLoading =
    !isHydrated ||
    !leafletReady ||
    !iconsReady ||
    locationLoading ||
    clusteringLoading;

  // loading change callback
  useEffect(() => {
    onLoadingChange?.(isLoading);
  }, [isLoading, onLoadingChange]);

  // create dynamic cluster icon
  const createClusterIcon = (count: number): DivIcon | null => {
    if (!DivIconClass || !isHydrated || !leafletReady) {
      return defaultClusterIcon;
    }

    try {
      return new DivIconClass({
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
      return defaultClusterIcon;
    }
  };

  // don't render until everything is ready
  if (!isHydrated || !leafletReady || !iconsReady) {
    return (
      <div className="container mx-auto h-[calc(100vh-4rem)]">
        <div className="w-full h-[calc(100vh-11rem)] bg-primary/10 rounded-sm flex items-center justify-center">
          <div className="text-muted-foreground">Loading map...</div>
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
        ref={mapRef}
      >
        <MapInstanceBridge onReady={setMapInstance} />
        <MapUrlSync />
        <AttributionControl
          position="bottomleft"
          prefix='<a href="/explore/map-providers">Map Data Providers</a>'
        />
        <ZoomControls />
        <LayerControls />

        {/* user location marker */}
        {latitude && longitude && userIcon && (
          <Marker
            position={[latitude, longitude]}
            icon={userIcon}
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
          if (!basicIcon) return null;

          return (
            <Marker
              key={`single-${index}`}
              icon={basicIcon}
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
