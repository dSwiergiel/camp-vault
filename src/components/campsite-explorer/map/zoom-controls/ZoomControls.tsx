import { Button } from "@/components/ui/button";
import { LocateFixed, Minus } from "lucide-react";
import { Plus } from "lucide-react";
import { useMap } from "react-leaflet";
import { useUserCoordinates } from "@/lib/hooks/useUserCoordinates";

export default function ZoomControls() {
  const map = useMap();
  const { latitude, longitude } = useUserCoordinates();

  const handleZoomIn = () => {
    map.zoomIn();
  };

  const handleZoomOut = () => {
    map.zoomOut();
  };

  const handleLocate = () => {
    if (latitude && longitude) {
      map.setView([latitude, longitude], 12);
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
            !(latitude && longitude) ? "rounded-b-sm" : ""
          }`}
          onClick={handleZoomOut}
          variant="outline"
          size="icon"
          title="Zoom out"
        >
          <Minus className="h-4 w-4" />
        </Button>
        {latitude && longitude && (
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
