/**
 * performance utilities for map clustering
 */

// throttle function to limit how often clustering recalculates
export function throttle<T extends (...args: any[]) => void>(
  func: T,
  limit: number
): T {
  let inThrottle: boolean;
  return ((...args: any[]) => {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  }) as T;
}

// debounce function to delay clustering until user stops interacting
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): T {
  let timeoutId: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  }) as T;
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
export class ClusterCache {
  private cache = new Map<string, any>();
  private maxSize = 50; // limit cache size

  // create cache key based on zoom level and data hash
  private createKey(zoom: number, dataLength: number, bounds?: any): string {
    const boundsStr = bounds
      ? `${bounds.north.toFixed(2)},${bounds.south.toFixed(
          2
        )},${bounds.east.toFixed(2)},${bounds.west.toFixed(2)}`
      : "all";
    return `${zoom}-${dataLength}-${boundsStr}`;
  }

  get(zoom: number, dataLength: number, bounds?: any): any {
    return this.cache.get(this.createKey(zoom, dataLength, bounds));
  }

  set(zoom: number, dataLength: number, result: any, bounds?: any): void {
    const key = this.createKey(zoom, dataLength, bounds);

    // remove oldest entries if cache is too large
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, result);
  }

  clear(): void {
    this.cache.clear();
  }
}
