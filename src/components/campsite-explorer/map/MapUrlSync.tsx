"use client";

import { useCallback, useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * updates the url with the current map center and zoom when the user moves or zooms the map
 * this enables reloading or sharing the exact current view
 */
export default function MapUrlSync() {
  const map = useMap();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // keep last written query string to avoid redundant replaces
  const lastQueryRef = useRef<string | null>(null);

  const writeUrlFromMap = useCallback(() => {
    // guard when map is not ready
    if (!map) return;

    const center = map.getCenter();
    const zoom = map.getZoom();

    // format for compact url, 5 decimals is ~1.1m precision
    const lat = center.lat.toFixed(6);
    const lng = center.lng.toFixed(6);
    const z = String(Math.round(zoom));

    const params = new URLSearchParams(searchParams?.toString() ?? "");
    // clean up bounds keys; only keep if needed
    params.delete("north");
    params.delete("south");
    params.delete("east");
    params.delete("west");
    params.set("lat", lat);
    params.set("lng", lng);
    // use single canonical key "z" and remove legacy "zoom"
    params.set("z", z);
    params.delete("zoom");

    const newUrl = `${pathname}?${params.toString()}`;

    if (lastQueryRef.current !== newUrl) {
      lastQueryRef.current = newUrl;
      // use replace to avoid polluting history; keep scroll position
      router.replace(newUrl, { scroll: false });
    }
  }, [map, pathname, router, searchParams]);

  useEffect(() => {
    if (!map) return;

    // write initial url state once when map becomes available if url is missing
    // this ensures the url always reflects a view after first render
    const hasLat = !!searchParams?.get("lat");
    const hasLng = !!searchParams?.get("lng");
    const hasZ = !!searchParams?.get("z");
    if (!(hasLat && hasLng && hasZ)) {
      writeUrlFromMap();
    }

    const handleMoveEnd = () => writeUrlFromMap();
    const handleZoomEnd = () => writeUrlFromMap();

    map.on("moveend", handleMoveEnd);
    map.on("zoomend", handleZoomEnd);

    return () => {
      map.off("moveend", handleMoveEnd);
      map.off("zoomend", handleZoomEnd);
    };
  }, [map, searchParams, writeUrlFromMap]);

  return null;
}
