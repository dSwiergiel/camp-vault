"use client";

import React, { useState } from "react";
import {
  MapContainer,
  TileLayer,
  LayerGroup,
  Marker,
  Popup,
  ZoomControl,
  LayersControl,
  AttributionControl,
} from "react-leaflet";
import { Icon } from "leaflet";
import { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import ZoomControls from "./zoom-controls/ZoomControls";
import LayerControls from "./layer-controls/LayerControls";

// You might want to adjust these default coordinates to your area of interest
const DEFAULT_CENTER: LatLngExpression = [43.371122, -74.730233];
const DEFAULT_ZOOM = 15;

// Define your campsite interface
interface Campsite {
  id: string;
  name: string;
  position: [number, number]; // [latitude, longitude]
}

// Example campsites data
const campsites: Campsite[] = [
  { id: "1", name: "Sunny Valley", position: [51.505, -0.09] },
  // Add more campsites...
];

export default function CampsiteMap() {
  return (
    <div className="container mx-auto h-full">
      <MapContainer
        center={DEFAULT_CENTER as LatLngExpression}
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

        {/* Campsite Markers */}
        {campsites.map((campsite) => (
          <Marker key={campsite.id} position={campsite.position}>
            <Popup>{campsite.name}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
