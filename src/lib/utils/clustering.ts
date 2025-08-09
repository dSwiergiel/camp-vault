import { Campsite } from "../models/campsite.model";

export interface ClusterPoint {
  lat: number;
  lng: number;
  campsite: Campsite;
}

export interface Cluster {
  lat: number;
  lng: number;
  count: number;
  campsites: Campsite[];
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

/**
 * calculates distance between two points using haversine formula
 * returns distance in kilometers
 */
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * converts zoom level to cluster radius in kilometers
 * higher zoom = smaller radius (more detailed clustering)
 * lower zoom = larger radius (fewer, bigger clusters)
 */
function getClusterRadius(zoom: number): number {
  // aggressive clustering at low zoom, gradual breakup at higher zoom
  if (zoom >= 16) return 0.1; // individual markers at highest zoom
  if (zoom >= 14) return 0.5; // very close zoom - tiny clusters
  if (zoom >= 12) return 1.5; // city level - small clusters
  if (zoom >= 10) return 4; // neighborhood level - medium clusters
  if (zoom >= 8) return 12; // city-wide level - larger clusters
  if (zoom >= 6) return 30; // county level - big clusters
  if (zoom >= 4) return 60; // state level - very large clusters
  return 100; // country level - massive clusters
}

/**
 * clusters campsites based on their proximity and current zoom level
 * uses a simple greedy clustering algorithm for performance
 */
export function clusterCampsites(
  campsites: Campsite[],
  zoom: number,
  customRadius?: number
): { clusters: Cluster[]; singleMarkers: Campsite[] } {
  const radius = customRadius || getClusterRadius(zoom);
  const clusters: Cluster[] = [];
  const processed = new Set<number>();
  const singleMarkers: Campsite[] = [];

  // convert campsites to points for easier processing
  const points: ClusterPoint[] = campsites.map((campsite) => ({
    lat: campsite.coordinates.latitude,
    lng: campsite.coordinates.longitude,
    campsite,
  }));

  // process each point to create clusters
  for (let i = 0; i < points.length; i++) {
    if (processed.has(i)) continue;

    const currentPoint = points[i];
    const nearbyPoints: ClusterPoint[] = [currentPoint];
    processed.add(i);

    // find all nearby points within cluster radius
    for (let j = i + 1; j < points.length; j++) {
      if (processed.has(j)) continue;

      const distance = calculateDistance(
        currentPoint.lat,
        currentPoint.lng,
        points[j].lat,
        points[j].lng
      );

      if (distance <= radius) {
        nearbyPoints.push(points[j]);
        processed.add(j);
      }
    }

    // determine if we should cluster based on zoom level and point count
    const shouldCluster =
      nearbyPoints.length > 1 &&
      (zoom < 10 || // always cluster at low zoom levels
        (zoom < 13 && nearbyPoints.length >= 3) || // medium zoom: cluster if 3+ points
        (zoom < 15 && nearbyPoints.length >= 5) || // high zoom: cluster if 5+ points
        nearbyPoints.length >= 8); // very high zoom: only cluster if many points

    if (shouldCluster) {
      const lats = nearbyPoints.map((p) => p.lat);
      const lngs = nearbyPoints.map((p) => p.lng);

      // calculate center of cluster
      const centerLat = lats.reduce((sum, lat) => sum + lat, 0) / lats.length;
      const centerLng = lngs.reduce((sum, lng) => sum + lng, 0) / lngs.length;

      // calculate bounds for cluster
      const north = Math.max(...lats);
      const south = Math.min(...lats);
      const east = Math.max(...lngs);
      const west = Math.min(...lngs);

      clusters.push({
        lat: centerLat,
        lng: centerLng,
        count: nearbyPoints.length,
        campsites: nearbyPoints.map((p) => p.campsite),
        bounds: { north, south, east, west },
      });
    } else {
      // single point or small groups at high zoom become individual markers
      nearbyPoints.forEach((point) => {
        singleMarkers.push(point.campsite);
      });
    }
  }

  return { clusters, singleMarkers };
}

/**
 * filters clusters and markers based on current map bounds
 * improves performance by only rendering visible items
 */
export function filterVisibleItems(
  clusters: Cluster[],
  singleMarkers: Campsite[],
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }
): { visibleClusters: Cluster[]; visibleMarkers: Campsite[] } {
  const visibleClusters = clusters.filter(
    (cluster) =>
      cluster.lat >= bounds.south &&
      cluster.lat <= bounds.north &&
      cluster.lng >= bounds.west &&
      cluster.lng <= bounds.east
  );

  const visibleMarkers = singleMarkers.filter(
    (marker) =>
      marker.coordinates.latitude >= bounds.south &&
      marker.coordinates.latitude <= bounds.north &&
      marker.coordinates.longitude >= bounds.west &&
      marker.coordinates.longitude <= bounds.east
  );

  return { visibleClusters, visibleMarkers };
}
