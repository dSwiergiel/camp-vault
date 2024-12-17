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
        <AttributionControl position="bottomleft" />
        <ZoomControls />
        <LayersControl position="topright">
          {/* OpenStreetMap Base Layer */}
          <LayersControl.BaseLayer name="Street Map">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              maxZoom={19}
            />
          </LayersControl.BaseLayer>

          {/* Satellite Layer */}
          <LayersControl.BaseLayer name="Satellite">
            <LayerGroup>
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution="Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
                maxZoom={19}
              />
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                attribution="Labels © Esri"
                maxZoom={19}
              />
            </LayerGroup>
          </LayersControl.BaseLayer>

          {/* New Hybrid Layer */}
          <LayersControl.BaseLayer checked name="Hybrid">
            <LayerGroup>
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution="Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
                maxZoom={19}
                opacity={0.9}
              />
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                maxZoom={19}
                opacity={0.4}
              />
              <TileLayer
                url="https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryTopo/MapServer/tile/{z}/{y}/{x}"
                attribution="USGS"
                maxZoom={19}
                opacity={0.6}
              />
              {/* <TileLayer
                url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                attribution='Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>'
                maxZoom={19}
                opacity={0.2}
              /> */}
            </LayerGroup>
          </LayersControl.BaseLayer>

          {/* New Topographic Base Layer */}
          <LayersControl.BaseLayer name="Topographic">
            <TileLayer
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
              attribution='Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>'
              maxZoom={19}
              opacity={0.5}
            />
          </LayersControl.BaseLayer>

          {/* Add these new overlays */}
          <LayersControl.Overlay checked name="Terrain">
            <TileLayer
              url="https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryTopo/MapServer/tile/{z}/{y}/{x}"
              attribution="USGS"
              maxZoom={19}
              opacity={0.6}
            />
          </LayersControl.Overlay>

          <LayersControl.Overlay checked name="Hydrology">
            <TileLayer
              url="https://basemap.nationalmap.gov/arcgis/rest/services/USGSHydroCached/MapServer/tile/{z}/{y}/{x}"
              attribution="USGS"
              maxZoom={19}
              opacity={1}
            />
          </LayersControl.Overlay>

          {/* <LayersControl.Overlay name="Terrain Features">
            <LayerGroup>
              <TileLayer
                url="https://services.arcgisonline.com/arcgis/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}"
                attribution="Esri"
                maxZoom={19}
                opacity={0.4}
              />
            </LayerGroup>
          </LayersControl.Overlay> */}

          {/* Trail Overlays */}
          <LayersControl.Overlay name="Trails">
            <TileLayer
              url="https://caltopo.com/tile/mb_topo/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://caltopo.com/">Caltopo</a>'
              maxZoom={19}
              opacity={0.5}
            />
          </LayersControl.Overlay>
          <LayersControl.Overlay name="Topographic">
            <TileLayer
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
              attribution='Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>'
              maxZoom={19}
              opacity={0.5}
            />
          </LayersControl.Overlay>
        </LayersControl>
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
