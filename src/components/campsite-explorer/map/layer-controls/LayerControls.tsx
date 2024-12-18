"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Layers } from "lucide-react";
import { useState } from "react";
import { TileLayer, LayerGroup } from "react-leaflet";

interface BaseLayer {
  name: string;
  layers: {
    url: string;
    maxZoom: number;
    opacity?: number;
  }[];
}

interface OverlayLayer {
  name: string;
  url: string;
  maxZoom: number;
  opacity?: number;
  checked?: boolean;
}

const baseLayers: BaseLayer[] = [
  {
    name: "Street Map",
    layers: [
      {
        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        maxZoom: 19,
      },
    ],
  },
  {
    name: "Satellite",
    layers: [
      {
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        maxZoom: 19,
      },
      {
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
        maxZoom: 19,
      },
    ],
  },
  {
    name: "Hybrid",
    layers: [
      {
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        maxZoom: 19,
        opacity: 0.9,
      },
      {
        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        maxZoom: 19,
        opacity: 0.4,
      },
      {
        url: "https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryTopo/MapServer/tile/{z}/{y}/{x}",
        maxZoom: 19,
        opacity: 0.6,
      },
    ],
  },
  {
    name: "Topographic",
    layers: [
      {
        url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
        maxZoom: 19,
        opacity: 0.5,
      },
    ],
  },
];

const overlayLayers: OverlayLayer[] = [
  {
    name: "Terrain",
    url: "https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryTopo/MapServer/tile/{z}/{y}/{x}",
    maxZoom: 19,
    opacity: 0.6,
    checked: true,
  },
  {
    name: "Hydrology",
    url: "https://basemap.nationalmap.gov/arcgis/rest/services/USGSHydroCached/MapServer/tile/{z}/{y}/{x}",
    maxZoom: 19,
    opacity: 1,
    checked: true,
  },
  {
    name: "Trails",
    url: "https://caltopo.com/tile/mb_topo/{z}/{x}/{y}.png",
    maxZoom: 19,
    opacity: 0.5,
  },
];

export default function LayerControls() {
  const [baseLayer, setBaseLayer] = useState("Hybrid");
  const [enabledOverlays, setEnabledOverlays] = useState<string[]>(
    overlayLayers.filter((layer) => layer.checked).map((layer) => layer.name)
  );
  const [isOpen, setIsOpen] = useState(false);

  const handleBaseLayerChange = (value: string) => {
    setBaseLayer(value);
  };

  const handleOverlayToggle = (checked: boolean, layerName: string) => {
    setEnabledOverlays((current) =>
      checked
        ? [...current, layerName]
        : current.filter((name) => name !== layerName)
    );
  };

  return (
    <>
      {/* base layers - always render all in consistent order, control visibility through opacity */}
      {baseLayers.map((baseLayerGroup) => (
        <LayerGroup key={baseLayerGroup.name}>
          {baseLayerGroup.layers.map((layer, index) => (
            <TileLayer
              key={`${baseLayerGroup.name}-${index}`}
              url={layer.url}
              maxZoom={layer.maxZoom}
              opacity={
                baseLayer === baseLayerGroup.name ? layer.opacity ?? 1 : 0
              }
            />
          ))}
        </LayerGroup>
      ))}

      {/* overlay layers - always render all in consistent order to control visibility of layers with different opacities */}
      {overlayLayers.map((layer) => (
        <TileLayer
          key={layer.name}
          url={layer.url}
          maxZoom={layer.maxZoom}
          opacity={
            enabledOverlays.includes(layer.name) ? layer.opacity ?? 1 : 0
          }
        />
      ))}

      {/* controls ui */}
      <div className="leaflet-top leaflet-right">
        <div className="leaflet-control">
          <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" title="Layer controls">
                <Layers className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48"
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              <DropdownMenuLabel>Base Layer</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={baseLayer}
                onValueChange={handleBaseLayerChange}
                onSelect={(e) => e.preventDefault()}
              >
                {baseLayers.map((layer) => (
                  <DropdownMenuRadioItem
                    key={layer.name}
                    value={layer.name}
                    onSelect={(e) => e.preventDefault()}
                  >
                    {layer.name}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>

              <DropdownMenuSeparator />
              <DropdownMenuLabel>Overlays</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {overlayLayers.map((layer) => (
                <DropdownMenuCheckboxItem
                  key={layer.name}
                  checked={enabledOverlays.includes(layer.name)}
                  onCheckedChange={(checked) =>
                    handleOverlayToggle(checked, layer.name)
                  }
                  onSelect={(e) => e.preventDefault()}
                >
                  {layer.name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </>
  );
}
