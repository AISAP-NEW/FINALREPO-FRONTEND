import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ThumbnailCache {
  [datasetId: string]: {
    url: string;
    timestamp: number;
    loaded: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ThumbnailService {
  private thumbnailCache: ThumbnailCache = {};
  private loadingThumbnails = new Set<string>();
  private thumbnailLoadedSubject = new BehaviorSubject<string>('');
  
  // Maximum cache age in milliseconds (5 minutes)
  private readonly CACHE_MAX_AGE = 5 * 60 * 1000;
  
  // Maximum concurrent thumbnail loads
  private readonly MAX_CONCURRENT_LOADS = 3;
  private currentLoads = 0;
  private loadQueue: string[] = [];

  constructor() {
    // Clear old cache entries periodically
    setInterval(() => this.cleanupCache(), this.CACHE_MAX_AGE);
  }

  getThumbnailUrl(datasetId: string): string {
    return `http://localhost:5183/api/Dataset/${datasetId}/thumbnail`;
  }

  isThumbnailCached(datasetId: string): boolean {
    const cached = this.thumbnailCache[datasetId];
    if (!cached) return false;
    
    // Check if cache is still valid
    const isExpired = Date.now() - cached.timestamp > this.CACHE_MAX_AGE;
    if (isExpired) {
      delete this.thumbnailCache[datasetId];
      return false;
    }
    
    return cached.loaded;
  }

  getCachedThumbnailUrl(datasetId: string): string | null {
    if (this.isThumbnailCached(datasetId)) {
      return this.thumbnailCache[datasetId].url;
    }
    return null;
  }

  preloadThumbnail(datasetId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // Check cache first
      if (this.isThumbnailCached(datasetId)) {
        resolve(this.thumbnailCache[datasetId].url);
        return;
      }

      // Check if already loading
      if (this.loadingThumbnails.has(datasetId)) {
        // Wait for existing load to complete
        const checkInterval = setInterval(() => {
          if (this.isThumbnailCached(datasetId)) {
            clearInterval(checkInterval);
            resolve(this.thumbnailCache[datasetId].url);
          }
        }, 100);
        return;
      }

      // Add to queue if too many concurrent loads
      if (this.currentLoads >= this.MAX_CONCURRENT_LOADS) {
        this.loadQueue.push(datasetId);
        return;
      }

      this.loadThumbnail(datasetId, resolve, reject);
    });
  }

  private loadThumbnail(datasetId: string, resolve: (url: string) => void, reject: (error: any) => void) {
    this.loadingThumbnails.add(datasetId);
    this.currentLoads++;

    const thumbnailUrl = this.getThumbnailUrl(datasetId);
    
    // Initialize cache entry
    this.thumbnailCache[datasetId] = {
      url: thumbnailUrl,
      timestamp: Date.now(),
      loaded: false
    };

    const img = new Image();
    
    img.onload = () => {
      this.thumbnailCache[datasetId].loaded = true;
      this.loadingThumbnails.delete(datasetId);
      this.currentLoads--;
      this.thumbnailLoadedSubject.next(datasetId);
      resolve(thumbnailUrl);
      
      // Process queue
      this.processQueue();
    };
    
    img.onerror = () => {
      delete this.thumbnailCache[datasetId];
      this.loadingThumbnails.delete(datasetId);
      this.currentLoads--;
      reject(new Error(`Failed to load thumbnail for dataset ${datasetId}`));
      
      // Process queue
      this.processQueue();
    };
    
    img.src = thumbnailUrl;
  }

  private processQueue() {
    if (this.loadQueue.length > 0 && this.currentLoads < this.MAX_CONCURRENT_LOADS) {
      const nextDatasetId = this.loadQueue.shift()!;
      this.preloadThumbnail(nextDatasetId);
    }
  }

  private cleanupCache() {
    const now = Date.now();
    Object.keys(this.thumbnailCache).forEach(datasetId => {
      const cached = this.thumbnailCache[datasetId];
      if (now - cached.timestamp > this.CACHE_MAX_AGE) {
        delete this.thumbnailCache[datasetId];
      }
    });
  }

  clearCache(): void {
    this.thumbnailCache = {};
    this.loadingThumbnails.clear();
    this.loadQueue = [];
    this.currentLoads = 0;
  }

  getThumbnailLoadedObservable(): Observable<string> {
    return this.thumbnailLoadedSubject.asObservable();
  }

  // Batch preload thumbnails for better performance
  preloadThumbnails(datasetIds: string[]): Promise<void> {
    const promises = datasetIds.map(id => this.preloadThumbnail(id));
    return Promise.all(promises).then(() => {});
  }
} 