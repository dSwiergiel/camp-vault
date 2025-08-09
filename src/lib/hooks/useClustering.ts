"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Map as LeafletMap } from "leaflet";
import { Campsite } from "../models/campsite.model";
import {
  clusterCampsites,
  filterVisibleItems,
  Cluster,
} from "../utils/clustering";
import { throttle, ClusterCache } from "../utils/performance";

interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface UseClusteringProps {
  campsites: Campsite[];
  map: LeafletMap | null;
  clusterRadius?: number;
}

interface UseClusteringReturn {
  clusters: Cluster[];
  singleMarkers: Campsite[];
  zoom: number;
  bounds: MapBounds | null;
  isLoading: boolean;
  handleClusterClick: (cluster: Cluster) => void;
  refreshClusters: () => void;
}

/**
 * manages clustering logic and map interactions
 * recalculates clusters when zoom level or map bounds change
 */
export function useClustering({
  campsites,
  map,
  clusterRadius,
}: UseClusteringProps): UseClusteringReturn {
  const [zoom, setZoom] = useState<number>(10);
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const cacheRef = useRef(
    new ClusterCache<{ clusters: Cluster[]; singleMarkers: Campsite[] }>()
  );

  // calculate clusters based on current zoom level with caching
  const { clusters: allClusters, singleMarkers: allSingleMarkers } =
    useMemo(() => {
      if (campsites.length === 0) return { clusters: [], singleMarkers: [] };

      // check cache first
      const cached = cacheRef.current.get(zoom, campsites.length);
      if (cached) {
        return cached;
      }

      setIsLoading(true);
      const result = clusterCampsites(campsites, zoom, clusterRadius);
      setIsLoading(false);

      // cache the result
      cacheRef.current.set(zoom, campsites.length, result);

      return result;
    }, [campsites, zoom, clusterRadius]);

  // filter clusters and markers based on visible bounds for performance
  const { visibleClusters, visibleMarkers } = useMemo(() => {
    if (!bounds)
      return { visibleClusters: allClusters, visibleMarkers: allSingleMarkers };

    return filterVisibleItems(allClusters, allSingleMarkers, bounds);
  }, [allClusters, allSingleMarkers, bounds]);

  // update zoom and bounds when map changes (throttled for performance)
  const updateMapStateFn = useCallback(() => {
    if (!map) return;

    const currentZoom = map.getZoom();
    const currentBounds = map.getBounds();

    setZoom(currentZoom);
    setBounds({
      north: currentBounds.getNorth(),
      south: currentBounds.getSouth(),
      east: currentBounds.getEast(),
      west: currentBounds.getWest(),
    });
  }, [map]);

  const updateMapState = useMemo(
    () => throttle(updateMapStateFn, 100),
    [updateMapStateFn]
  );

  // set up map event listeners
  useEffect(() => {
    if (!map) return;

    // initial state
    updateMapState();

    // listen for zoom and move events
    const handleZoomEnd = () => updateMapState();
    const handleMoveEnd = () => updateMapState();

    map.on("zoomend", handleZoomEnd);
    map.on("moveend", handleMoveEnd);

    return () => {
      map.off("zoomend", handleZoomEnd);
      map.off("moveend", handleMoveEnd);
    };
  }, [map, updateMapState]);

  // handle cluster click - zoom to fit all campsites in cluster
  const handleClusterClick = useCallback(
    (cluster: Cluster) => {
      if (!map) return;

      // calculate zoom level that will fit all cluster points
      const paddedBounds = {
        north: cluster.bounds.north + 0.01,
        south: cluster.bounds.south - 0.01,
        east: cluster.bounds.east + 0.01,
        west: cluster.bounds.west - 0.01,
      };

      // create leaflet bounds and fit map to them
      import("leaflet").then(({ LatLngBounds }) => {
        const leafletBounds = new LatLngBounds(
          [paddedBounds.south, paddedBounds.west],
          [paddedBounds.north, paddedBounds.east]
        );

        map.fitBounds(leafletBounds, {
          padding: [20, 20],
          maxZoom: 18, // allow zooming closer to see individual markers
        });
      });
    },
    [map]
  );

  // clear cache when campsites data changes
  useEffect(() => {
    cacheRef.current.clear();
  }, [campsites]);

  // force refresh clusters (useful for manual updates)
  const refreshClusters = useCallback(() => {
    cacheRef.current.clear();
    updateMapState();
  }, [updateMapState]);

  return {
    clusters: visibleClusters,
    singleMarkers: visibleMarkers,
    zoom,
    bounds,
    isLoading,
    handleClusterClick,
    refreshClusters,
  };
}
