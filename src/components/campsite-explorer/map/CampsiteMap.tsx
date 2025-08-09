"use client";

import React, { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import type { DivIcon, Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import { useUserCoordinates } from "@/lib/hooks/useUserCoordinates";
import { useClustering } from "@/lib/hooks/useClustering";
import { renderToStaticMarkup } from "react-dom/server";
import UserLocationMarker from "./map-markers/UserLocationMarker";
import ClusterMarker from "./map-markers/ClusterMarker";
import { DEFAULT_CENTER, DEFAULT_ZOOM } from "@/lib/constants";
import { useSearchParams } from "next/navigation";
import MapUrlSync from "./MapUrlSync";
import campsitesData from "@/campsite-data/NYS_campsite_data.json";
import { Campsite } from "@/lib/models/campsite.model";
import BasicCampsiteMarker from "./map-markers/BasicCampsiteMarker";

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
import { useMap } from "react-leaflet";

interface CampsiteMapProps {
  onLoadingChange?: (isLoading: boolean) => void;
}

export default function CampsiteMap({ onLoadingChange }: CampsiteMapProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [icon, setIcon] = useState<DivIcon | undefined>(undefined);
  const [clusterIcon, setClusterIcon] = useState<DivIcon | undefined>(
    undefined
  );
  const [userIcon, setUserIcon] = useState<DivIcon | undefined>(undefined);
  const mapRef = useRef<LeafletMap | null>(null);
  const [mapInstance, setMapInstance] = useState<LeafletMap | null>(null);

  // bridge to capture the map instance once MapContainer mounts
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

  const {
    latitude,
    longitude,
    isLoading: locationLoading,
    requestLocation,
  } = useUserCoordinates();
  const [campsites, setCampsites] = useState<Campsite[]>([]);
  const searchParams = useSearchParams();

  // derive initial center and zoom from url if present
  const urlLat = searchParams?.get("lat");
  const urlLng = searchParams?.get("lng");
  // prefer canonical "z"; if only legacy "zoom" exists we'll normalize it later
  const urlZ = searchParams?.get("z") ?? searchParams?.get("zoom");
  const parsedLat = urlLat ? Number(urlLat) : undefined;
  const parsedLng = urlLng ? Number(urlLng) : undefined;
  const parsedZoom = urlZ ? Number(urlZ) : undefined;

  // clustering logic
  const {
    clusters,
    singleMarkers,
    isLoading: clusteringLoading,
    handleClusterClick,
  } = useClustering({
    campsites,
    map: mapInstance,
  });

  const isLoading =
    !isMounted ||
    !icon ||
    !clusterIcon ||
    !userIcon ||
    locationLoading ||
    clusteringLoading;

  useEffect(() => {
    import("leaflet").then(({ DivIcon }) => {
      // campsite marker icon
      setIcon(
        new DivIcon({
          html: renderToStaticMarkup(<BasicCampsiteMarker />),
          className: "campsite-marker",
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        })
      );

      // user location marker using DivIcon
      setUserIcon(
        new DivIcon({
          html: renderToStaticMarkup(<UserLocationMarker />),
          className: "user-location-marker",
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        })
      );

      // placeholder cluster icon (will be replaced with dynamic icons)
      setClusterIcon(
        new DivIcon({
          html: renderToStaticMarkup(<ClusterMarker count={0} />),
          className: "cluster-marker",
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        })
      );

      setIsMounted(true);
      setCampsites(campsitesData as Campsite[]);
    });
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  useEffect(() => {
    onLoadingChange?.(isLoading);
  }, [isLoading, onLoadingChange]);

  // create dynamic cluster icon based on count
  const createClusterIcon = (count: number): DivIcon | undefined => {
    if (!isMounted || !clusterIcon) return clusterIcon;

    // create a new DivIcon with the specific count
    try {
      // we need to dynamically import here to avoid SSR issues
      const { DivIcon } = require("leaflet");
      return new DivIcon({
        html: renderToStaticMarkup(<ClusterMarker count={count} />),
        className: "cluster-marker",
        iconSize: count >= 50 ? [48, 48] : count >= 10 ? [40, 40] : [32, 32],
        iconAnchor: count >= 50 ? [24, 24] : count >= 10 ? [20, 20] : [16, 16],
      });
    } catch {
      // fallback to default cluster icon if import fails
      return clusterIcon;
    }
  };

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
          const clusterIconForCount = createClusterIcon(cluster.count);
          return (
            <Marker
              key={`cluster-${index}`}
              icon={clusterIconForCount}
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
          return (
            <Marker
              key={`single-${index}`}
              icon={icon}
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
