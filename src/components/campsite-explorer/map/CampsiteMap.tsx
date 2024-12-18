"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { Icon, LatLngExpression, DivIcon } from "leaflet";
import "leaflet/dist/leaflet.css";
import { useUserCoordinates } from "@/lib/hooks/useUserCoordinates";
import { renderToStaticMarkup } from "react-dom/server";
import UserLocationMarker from "./map-markers/UserLocationMarker";
import { Skeleton } from "@/components/ui/skeleton";
import { DEFAULT_CENTER, DEFAULT_ZOOM } from "@/lib/constants";
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

// define your campsite interface
interface Campsite {
  id: string;
  name: string;
  position: [number, number]; // [latitude, longitude]
}

// example campsites data
const campsites: Campsite[] = [
  { id: "1", name: "Sunny Valley", position: [51.505, -0.09] },
  // add more campsites...
];

export default function CampsiteMap() {
  const [isMounted, setIsMounted] = useState(false);
  const [icon, setIcon] = useState<Icon | undefined>(undefined);
  const [userIcon, setUserIcon] = useState<DivIcon | undefined>(undefined);
  const { latitude: userLatitude, longitude: userLongitude } =
    useUserCoordinates();

  // Add loading state that only checks for mounting and icon loading
  // We don't wait for coordinates since they're optional
  const isLoading = !isMounted || !icon || !userIcon;

  useEffect(() => {
    import("leaflet").then(({ Icon, DivIcon }) => {
      // Campsite marker icon
      setIcon(
        new Icon({
          iconUrl:
            "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          iconRetinaUrl:
            "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          shadowUrl:
            "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        })
      );

      // User location marker using DivIcon
      setUserIcon(
        new DivIcon({
          html: renderToStaticMarkup(<UserLocationMarker />),
          className: "user-location-marker",
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        })
      );

      setIsMounted(true);
    });
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto h-[calc(100vh-4rem)]">
        <Skeleton className="h-[calc(100vh-14.5rem)] w-full rounded-lg bg-muted" />
      </div>
    );
  }

  return (
    <div className="container mx-auto h-[calc(100vh-4rem)]">
      <MapContainer
        center={
          userLatitude && userLongitude
            ? [userLatitude, userLongitude]
            : DEFAULT_CENTER
        }
        zoom={DEFAULT_ZOOM}
        className="w-full h-[calc(100vh-14.5rem)] z-0 rounded-sm"
        zoomControl={false}
        attributionControl={false}
      >
        <AttributionControl
          position="bottomleft"
          prefix='<a href="/explore/map-providers">Map Data Providers</a>'
        />
        <ZoomControls />
        <LayerControls />

        {/* user location marker */}
        {userLatitude && userLongitude && userIcon && (
          <Marker
            position={[userLatitude, userLongitude]}
            icon={userIcon}
            title="Your location"
          >
            <Popup>You are here</Popup>
          </Marker>
        )}

        {/* campsite markers */}
        {campsites.map((campsite) => (
          <Marker key={campsite.id} position={campsite.position} icon={icon}>
            <Popup>{campsite.name}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
