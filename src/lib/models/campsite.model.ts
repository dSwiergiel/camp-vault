export interface Campsite {
  location_name: string;
  site_name: string;
  type: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}
