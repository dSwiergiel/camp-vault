"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { DivIcon } from "leaflet";
import "leaflet/dist/leaflet.css";
import { useUserCoordinates } from "@/lib/hooks/useUserCoordinates";
import { renderToStaticMarkup } from "react-dom/server";
import UserLocationMarker from "./map-markers/UserLocationMarker";
import { DEFAULT_CENTER, DEFAULT_ZOOM } from "@/lib/constants";
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

interface CampsiteMapProps {
  onLoadingChange?: (isLoading: boolean) => void;
}

export default function CampsiteMap({ onLoadingChange }: CampsiteMapProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [icon, setIcon] = useState<DivIcon | undefined>(undefined);
  const [userIcon, setUserIcon] = useState<DivIcon | undefined>(undefined);
  const {
    latitude,
    longitude,
    isLoading: locationLoading,
    requestLocation,
  } = useUserCoordinates();
  const [campsites, setCampsites] = useState<Campsite[]>([]);

  const isLoading = !isMounted || !icon || !userIcon || locationLoading;

  useEffect(() => {
    import("leaflet").then(({ DivIcon }) => {
      // campsite marker icon
      // setIcon(
      //   new Icon({
      //     iconUrl:
      //       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      //     iconRetinaUrl:
      //       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      //     shadowUrl:
      //       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      //     iconSize: [25, 41],
      //     iconAnchor: [12, 41],
      //     popupAnchor: [1, -34],
      //     shadowSize: [41, 41],
      //   })
      // );

      setIcon(
        new DivIcon({
          html: renderToStaticMarkup(<BasicCampsiteMarker />),
          className: "campsite-marker",
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        })
      );

      // ser location marker using DivIcon
      setUserIcon(
        new DivIcon({
          html: renderToStaticMarkup(<UserLocationMarker />),
          className: "user-location-marker",
          iconSize: [24, 24],
          iconAnchor: [12, 12],
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

  return (
    <div className="container mx-auto h-[calc(100vh-4rem)]">
      <MapContainer
        center={latitude && longitude ? [latitude, longitude] : DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        className="w-full h-[calc(100vh-11rem)] z-0 rounded-sm [&.leaflet-container]:!bg-primary/10"
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
        {latitude && longitude && userIcon && (
          <Marker
            position={[latitude, longitude]}
            icon={userIcon}
            title="Your location"
          >
            <Popup>You are here</Popup>
          </Marker>
        )}

        {/* campsite markers */}
        {campsites.map((campsite, index) => {
          return (
            <Marker
              key={index}
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

        {/* <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={50} // Adjust this value to control cluster size
        >
          {campsites.map((campsite, index) => (
            <Marker
              key={index}
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
          ))}
        </MarkerClusterGroup> */}
      </MapContainer>
    </div>
  );
}
