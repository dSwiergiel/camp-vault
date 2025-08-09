/**
 * performance utilities for map clustering
 */

// throttle function to limit how often clustering recalculates
export function throttle<T extends (...args: unknown[]) => void>(
  func: T,
  limit: number
): T {
  let inThrottle = false;
  const throttled = ((...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  }) as T;
  return throttled;
}

// debounce function to delay clustering until user stops interacting
export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  delay: number
): T {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const debounced = ((...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T;
  return debounced;
}

// memory optimization - limit the number of items processed at once
export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

// cache for clustering results to avoid recalculation
export class ClusterCache<T = unknown> {
  private cache = new Map<string, T>();
  private maxSize = 50; // limit cache size

  // create cache key based on zoom level and data hash
  private createKey(
    zoom: number,
    dataLength: number,
    bounds?: { north: number; south: number; east: number; west: number }
  ): string {
    const boundsStr = bounds
      ? `${bounds.north.toFixed(2)},${bounds.south.toFixed(
          2
        )},${bounds.east.toFixed(2)},${bounds.west.toFixed(2)}`
      : "all";
    return `${zoom}-${dataLength}-${boundsStr}`;
  }

  get(
    zoom: number,
    dataLength: number,
    bounds?: { north: number; south: number; east: number; west: number }
  ): T | undefined {
    return this.cache.get(this.createKey(zoom, dataLength, bounds));
  }

  set(
    zoom: number,
    dataLength: number,
    result: T,
    bounds?: { north: number; south: number; east: number; west: number }
  ): void {
    const key = this.createKey(zoom, dataLength, bounds);

    // remove oldest entries if cache is too large
    if (this.cache.size >= this.maxSize) {
      const firstKeyResult = this.cache.keys().next();
      if (!firstKeyResult.done) {
        this.cache.delete(firstKeyResult.value);
      }
    }

    this.cache.set(key, result);
  }

  clear(): void {
    this.cache.clear();
  }
}
